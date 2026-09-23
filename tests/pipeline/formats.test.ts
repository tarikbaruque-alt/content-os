import { describe, it, expect } from "vitest";
import { recommendFormat, FORMAT_LIBRARY, FORMATOS } from "../../src/pipeline/formats.js";

describe("Musa — recomendação de formato por estratégia", () => {
  it("a biblioteca é organizada por dimensões", () => {
    expect(FORMAT_LIBRARY.producao).toContain("Lo-fi");
    expect(FORMAT_LIBRARY.producao).toContain("High-fi");
    expect(FORMAT_LIBRARY.estrutura).toContain("Duplo personagem");
    expect(FORMAT_LIBRARY.narrativa).toContain("Polêmica/Contraponto");
  });

  it("biblioteca de formatos tem ≥15 formatos nomeados e utilizáveis", () => {
    expect(FORMATOS.length).toBeGreaterThanOrEqual(15);
    const nomes = FORMATOS.map((f) => f.nome);
    ["Talking Head", "Tela Dividida", "React", "Entrevista", "Duplo Personagem", "POV", "Vlog", "Bastidores", "Passo a Passo / Tutorial", "Storytelling", "Case / Estudo de Caso", "Análise / Opinião", "Demonstração", "Comparação", "Resposta a Comentário", "Série / Quadro Recorrente"].forEach((n) =>
      expect(nomes).toContain(n),
    );
  });

  it("recomenda formato nomeado + objetivo + motivo por função", () => {
    const prova = recommendFormat("Prova", "fundo");
    expect(prova.formato).toBe("Case / Estudo de Caso");
    expect(prova.objetivo.length).toBeGreaterThan(8);
    expect(prova.justificativa).toContain("Case");
    const obj = recommendFormat("Quebra de Objeção", "fundo");
    expect(obj.formato).toBe("Duplo Personagem");
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
