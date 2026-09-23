import { AnthropicLlmProvider } from "./anthropic.js";
import { MockLlmProvider } from "./mock.js";
import type { LlmProvider } from "./provider.js";

export type { LlmProvider, LlmGenerateRequest, LlmGenerateResult, LlmMessage } from "./provider.js";
export { MockLlmProvider } from "./mock.js";
export { AnthropicLlmProvider } from "./anthropic.js";
export { RAW_INPUTS_BEGIN, RAW_INPUTS_END } from "./markers.js";

/**
 * Fábrica de provider. Decide pelo ambiente, com fallback seguro para o mock.
 * CONTENT_OS_LLM_PROVIDER=anthropic exige ANTHROPIC_API_KEY.
 */
export function createLlmProvider(env: NodeJS.ProcessEnv = process.env): LlmProvider {
  const choice = (env.CONTENT_OS_LLM_PROVIDER ?? "mock").toLowerCase();
  if (choice === "anthropic") {
    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "CONTENT_OS_LLM_PROVIDER=anthropic requer ANTHROPIC_API_KEY no ambiente.",
      );
    }
    return new AnthropicLlmProvider({
      apiKey,
      ...(env.ANTHROPIC_MODEL ? { model: env.ANTHROPIC_MODEL } : {}),
      ...(env.ANTHROPIC_BASE_URL ? { baseUrl: env.ANTHROPIC_BASE_URL } : {}),
    });
  }
  return new MockLlmProvider();
}
