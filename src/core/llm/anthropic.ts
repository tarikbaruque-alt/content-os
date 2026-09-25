import Anthropic from "@anthropic-ai/sdk";
import type { LlmGenerateRequest, LlmGenerateResult, LlmProvider } from "./provider.js";

/**
 * Adapter REAL da Anthropic (Claude), pelo SDK oficial. Implementa a mesma
 * interface do mock.
 *
 * Não é exercitado enquanto CONTENT_OS_LLM_PROVIDER=mock. Quando houver
 * ANTHROPIC_API_KEY no ambiente e o provider for "anthropic", os agentes
 * passam a usar o modelo real SEM qualquer mudança no código dos agentes.
 *
 * O SDK já repete sozinho 429/5xx/erros de rede (maxRetries). Resposta cortada
 * (max_tokens) ou recusada vira erro explícito: devolver meio JSON faria o
 * agente cair no rascunho sem ninguém saber por quê.
 *
 * Modelo padrão: claude-opus-5. Para reduzir custo, defina
 * ANTHROPIC_MODEL=claude-sonnet-5 (ou claude-haiku-4-5).
 */
export type AnthropicConfig = {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  /** Pensamento adaptativo (default true; o Haiku 4.5 não suporta e fica sem). */
  thinking?: boolean;
  /** Injeção para testes. */
  client?: Pick<Anthropic, "messages">;
};

export const DEFAULT_ANTHROPIC_MODEL = "claude-opus-5";
/** Pensamento e resposta dividem o mesmo orçamento: pouco aqui corta o JSON no meio. */
export const DEFAULT_MAX_TOKENS = 16000;

export class AnthropicLlmProvider implements LlmProvider {
  readonly name = "anthropic";
  private readonly model: string;
  private readonly thinking: boolean;
  private readonly client: Pick<Anthropic, "messages">;

  constructor(config: AnthropicConfig) {
    this.model = config.model ?? DEFAULT_ANTHROPIC_MODEL;
    this.thinking = (config.thinking ?? true) && !/haiku/.test(this.model);
    this.client = config.client ?? new Anthropic({ apiKey: config.apiKey, baseURL: config.baseUrl, maxRetries: 3 });
  }

  async generate(req: LlmGenerateRequest): Promise<LlmGenerateResult> {
    const params: Anthropic.MessageCreateParamsNonStreaming = {
      model: this.model,
      max_tokens: Math.max(req.maxTokens ?? 0, DEFAULT_MAX_TOKENS),
      system: req.system,
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
    };
    if (this.thinking) params.thinking = { type: "adaptive" };
    else if (req.temperature !== undefined) params.temperature = req.temperature;

    const msg = await this.client.messages.create(params);
    if (msg.stop_reason === "max_tokens") {
      throw new Error(`Resposta cortada pelo limite de ${params.max_tokens} tokens (${this.model}).`);
    }
    if (msg.stop_reason === "refusal") {
      throw new Error(`O modelo recusou o pedido (${this.model}).`);
    }
    const text = msg.content
      .filter((c): c is Anthropic.TextBlock => c.type === "text")
      .map((c) => c.text)
      .join("");

    return {
      text,
      provider: this.name,
      model: this.model,
      usage: { inputTokens: msg.usage.input_tokens, outputTokens: msg.usage.output_tokens },
    };
  }
}
