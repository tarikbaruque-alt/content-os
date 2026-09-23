import { describe, it, expect } from "vitest";
import { deriveStrategyPaths } from "../../src/pipeline/strategy-paths.js";
import type { Dna } from "../../src/pipeline/types.js";

const dna: Dna = [
  { section: "positioning", field: "diferenciais", value: "Meu diferencial é um estilo documental", state: "FACT", source: "x" },
  { section: "audience", field: "objecoes", value: "Acham caro demais", state: "FACT", source: "x" },
  { section: "audience", field: "desejos", value: "Elas desejam reviver as emoções", state: "FACT", source: "x" },
  { section: "audience", field: "dores", value: "A maior dor é o medo", state: "FACT", source: "x" },
  { section: "audience", field: "persona", value: "Noivas de 28 a 38 anos", state: "FACT", source: "x" },
  { section: "voice_of_customer", field: "frase", value: "Chorei vendo as fotos", state: "FACT", source: "x" },
];

describe("Átlas — caminhos estratégicos", () => {
  it("apresenta a biblioteca completa de caminhos, ranqueada", () => {
    const { paths } = deriveStrategyPaths(dna);
    expect(paths.length).toBe(15);
    for (let i = 1; i < paths.length; i++) {
      expect(paths[i - 1]!.relevancia).toBeGreaterThanOrEqual(paths[i]!.relevancia);
    }
  });

  it("cada caminho é completo (objetivo, funções, pilares, métricas)", () => {
    const { paths } = deriveStrategyPaths(dna);
    for (const p of paths) {
      expect(p.objetivo.length).toBeGreaterThan(3);
      expect(p.funcoes.length).toBeGreaterThan(0);
      expect(p.pilares.length).toBeGreaterThan(0);
      expect(p.metricas.length).toBeGreaterThan(0);
      expect(p.quando.startsWith("Use quando")).toBe(true);
    }
  });

  it("recomenda um mix que soma 100%", () => {
    const { mix } = deriveStrategyPaths(dna);
    expect(mix.length).toBe(4);
    expect(mix.reduce((a, m) => a + m.pct, 0)).toBe(100);
  });

  it("prioriza o caminho aderente ao DNA (objeção forte → quebra de objeções no topo)", () => {
    const { paths } = deriveStrategyPaths(dna);
    const obj = paths.find((p) => p.key === "objecoes")!;
    expect(obj.relevancia).toBeGreaterThan(55);
    expect(paths.slice(0, 6).some((p) => p.key === "objecoes")).toBe(true);
  });
});
