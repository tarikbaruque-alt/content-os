/**
 * Abstração de provedor de IA. Os agentes falam com esta interface, nunca com
 * um SDK específico — trocar de modelo/provedor não exige reescrever agentes.
 */
export type LlmMessage = {
  role: "user" | "assistant";
  content: string;
};

export type LlmGenerateRequest = {
  system: string;
  messages: LlmMessage[];
  temperature?: number;
  maxTokens?: number;
};

export type LlmGenerateResult = {
  text: string;
  provider: string;
  model?: string;
  usage?: { inputTokens: number; outputTokens: number };
};

export interface LlmProvider {
  readonly name: string;
  generate(req: LlmGenerateRequest): Promise<LlmGenerateResult>;
}
