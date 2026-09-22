import { describe, it, expect } from "vitest";
import { recommendFormat, FORMAT_LIBRARY } from "../../src/pipeline/formats.js";

describe("Musa — recomendação de formato por estratégia", () => {
  it("a biblioteca é organizada por dimensões", () => {
    expect(FORMAT_LIBRARY.producao).toContain("Lo-fi");
    expect(FORMAT_LIBRARY.producao).toContain("High-fi");
    expect(FORMAT_LIBRARY.estrutura).toContain("Duplo personagem");
    expect(FORMAT_LIBRARY.narrativa).toContain("Polêmica/Contraponto");
  });

  it("recomenda combinação coerente com a função (não aleatória)", () => {
    const aut = recommendFormat("Autoridade", "meio");
    expect(aut.estrutura).toBe("React");
    expect(aut.narrativa).toBe("Análise");
    expect(aut.justificativa).toContain("Autoridade");

    const obj = recommendFormat("Quebra de Objeção", "fundo");
    expect(obj.estrutura).toBe("Duplo personagem");

    const rap = recommendFormat("Relacionamento", "meio");
    expect(rap.producao).toBe("Lo-fi");
    expect(rap.narrativa).toBe("Storytelling");
  });

  it("respeita a superfície da ideia quando informada", () => {
    const r = recommendFormat("Autoridade", "meio", "Carrossel");
    expect(r.superficie).toBe("Carrossel");
  });

  it("faz fallback por funil para função desconhecida", () => {
    const r = recommendFormat("FunçãoInexistente", "fundo");
    expect(r.superficie).toBe("Stories");
    expect(r.producao).toBe("Mid-fi");
  });
});
