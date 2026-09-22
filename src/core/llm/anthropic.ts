import type { LlmGenerateRequest, LlmGenerateResult, LlmProvider } from "./provider.js";

/**
 * Adapter REAL da Anthropic (Claude). Implementa a mesma interface do mock.
 *
 * Não é exercitado enquanto CONTENT_OS_LLM_PROVIDER=mock. Quando houver
 * ANTHROPIC_API_KEY no ambiente e o provider for "anthropic", os agentes
 * passam a usar o modelo real SEM qualquer mudança no código dos agentes.
 */
export type AnthropicConfig = {
  apiKey: string;
  model?: string;
  baseUrl?: string;
};

export class AnthropicLlmProvider implements LlmProvider {
  readonly name = "anthropic";
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(private readonly config: AnthropicConfig) {
    this.model = config.model ?? "claude-sonnet-4-20250514";
    this.baseUrl = config.baseUrl ?? "https://api.anthropic.com";
  }

  async generate(req: LlmGenerateRequest): Promise<LlmGenerateResult> {
    const res = await fetch(`${this.baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: req.maxTokens ?? 4096,
        temperature: req.temperature ?? 0,
        system: req.system,
        messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!res.ok) {
      throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as {
      content: Array<{ type: string; text?: string }>;
      usage?: { input_tokens: number; output_tokens: number };
    };
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
