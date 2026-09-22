import type { LlmGenerateRequest, LlmGenerateResult, LlmProvider } from "./provider.js";

/**
 * Adapter REAL da Anthropic (Claude). Implementa a mesma interface do mock.
 *
 * Não é exercitado enquanto CONTENT_OS_LLM_PROVIDER=mock. Quando houver
 * ANTHROPIC_API_KEY no ambiente e o provider for "anthropic", os agentes
 * passam a usar o modelo real SEM qualquer mudança no código dos agentes.
 *
 * Modelo padrão: claude-opus-5 (id atual, sem sufixo de data). Para reduzir
 * custo, defina ANTHROPIC_MODEL=claude-sonnet-5 (ou claude-haiku-4-5).
 */
export type AnthropicConfig = {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  /** Pensamento estendido adaptativo (default true nos modelos 4.6+). */
  thinking?: boolean;
};

export const DEFAULT_ANTHROPIC_MODEL = "claude-opus-5";

export class AnthropicLlmProvider implements LlmProvider {
  readonly name = "anthropic";
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly thinking: boolean;

  constructor(private readonly config: AnthropicConfig) {
    this.model = config.model ?? DEFAULT_ANTHROPIC_MODEL;
    this.baseUrl = config.baseUrl ?? "https://api.anthropic.com";
    this.thinking = config.thinking ?? true;
  }

  async generate(req: LlmGenerateRequest): Promise<LlmGenerateResult> {
    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: req.maxTokens ?? 4096,
      system: req.system,
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
    };
    if (this.thinking) {
      // Adaptive thinking: budget_tokens é rejeitado (400) nos modelos atuais,
      // e temperature deve ser omitido quando o pensamento está ligado.
      body.thinking = { type: "adaptive" };
    } else if (req.temperature !== undefined) {
      body.temperature = req.temperature;
    }

    const res = await fetch(`${this.baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as {
      content: Array<{ type: string; text?: string }>;
      usage?: { input_tokens: number; output_tokens: number };
    };
    // Ignora blocos de "thinking"; concatena só o texto final.
    const text = data.content
      .filter((c) => c.type === "text")
      .map((c) => c.text ?? "")
      .join("");

    return {
      text,
      provider: this.name,
      model: this.model,
      usage: data.usage
        ? { inputTokens: data.usage.input_tokens, outputTokens: data.usage.output_tokens }
        : undefined,
    };
  }
}
