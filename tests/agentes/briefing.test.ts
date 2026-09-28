import { describe, it, expect } from "vitest";
import { limparRespostas, tokenValido, MAX_TEXTO } from "../../supabase/functions/_shared/briefing.ts";

describe("briefing por link (entrada anônima)", () => {
  it("só passa texto em chaves simples, com teto de tamanho", () => {
    const r = limparRespostas({ name: " Ana Doces ", niche: "Confeitaria", "x y": "fora", obj: { a: 1 }, lista: ["a"], vazio: "  ", obs: "a".repeat(MAX_TEXTO + 50), n: 3 });
    expect(r).toEqual({ name: "Ana Doces", niche: "Confeitaria", obs: "a".repeat(MAX_TEXTO), n: "3" });
  });
  it("sem nome da empresa, ou com lixo, não aceita", () => {
    expect(limparRespostas({ niche: "x" })).toBeNull();
    expect(limparRespostas(null)).toBeNull();
    expect(limparRespostas(["name"])).toBeNull();
    expect(limparRespostas("name")).toBeNull();
  });
  it("token do link tem formato fixo", () => {
    expect(tokenValido("0123456789abcdef0123456789abcdef")).toBe(true);
    expect(tokenValido("../docs")).toBe(false);
    expect(tokenValido("0123456789abcdef0123456789abcdeZ")).toBe(false);
  });
});
