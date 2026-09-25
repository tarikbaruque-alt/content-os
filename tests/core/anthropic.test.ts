import { describe, it, expect } from "vitest";
import { AnthropicLlmProvider, DEFAULT_MAX_TOKENS } from "../../src/core/llm/anthropic.js";

// Cliente falso: guarda os parâmetros enviados e devolve a mensagem pedida.
function fake(reply: Record<string, unknown>) {
  const sent: Record<string, any>[] = [];
  const client = { messages: { create: async (p: Record<string, unknown>) => { sent.push(p); return reply; } } };
  return { sent, client: client as any };
}
const ok = (text: string, stop = "end_turn") => ({
  content: [{ type: "thinking", thinking: "" }, { type: "text", text }],
  stop_reason: stop,
  usage: { input_tokens: 10, output_tokens: 5 },
});
const req = { system: "s", messages: [{ role: "user" as const, content: "oi" }] };

describe("AnthropicLlmProvider", () => {
  it("devolve só o texto final e usa pensamento adaptativo com orçamento folgado", async () => {
    const f = fake(ok('{"a":1}'));
    const res = await new AnthropicLlmProvider({ apiKey: "k", client: f.client }).generate({ ...req, maxTokens: 4096 });
    expect(res.text).toBe('{"a":1}');
    expect(f.sent[0]!.thinking).toEqual({ type: "adaptive" });
    expect(f.sent[0]!.max_tokens).toBe(DEFAULT_MAX_TOKENS);
    expect(f.sent[0]!.model).toBe("claude-opus-5");
  });

  it("resposta cortada ou recusada vira erro explícito (não meio JSON)", async () => {
    await expect(new AnthropicLlmProvider({ apiKey: "k", client: fake(ok('{"a":', "max_tokens")).client }).generate(req)).rejects.toThrow(/cortada/);
    await expect(new AnthropicLlmProvider({ apiKey: "k", client: fake(ok("", "refusal")).client }).generate(req)).rejects.toThrow(/recusou/);
  });

  it("Haiku não recebe pensamento adaptativo (não suporta)", async () => {
    const f = fake(ok("x"));
    await new AnthropicLlmProvider({ apiKey: "k", model: "claude-haiku-4-5", client: f.client }).generate({ ...req, temperature: 0.2 });
    expect(f.sent[0]!.thinking).toBeUndefined();
    expect(f.sent[0]!.temperature).toBe(0.2);
  });
});
