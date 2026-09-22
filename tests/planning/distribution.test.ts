import { describe, it, expect } from "vitest";
import {
  planDistribution,
  largestRemainder,
  CONTENT_FUNCTIONS,
} from "../../src/core/planning/distribution.js";

describe("Distribuição editorial por funil", () => {
  it("soma exatamente o total (método do maior resto)", () => {
    const r = planDistribution({ total: 12, funnel: { topo: 50, meio: 30, fundo: 20 } });
    expect(r.funnel.topo + r.funnel.meio + r.funnel.fundo).toBe(12);
    expect(r.funnel).toEqual({ topo: 6, meio: 4, fundo: 2 });
  });

  it("normaliza percentuais que não somam 100", () => {
    const r = planDistribution({ total: 10, funnel: { topo: 2, meio: 1, fundo: 1 } });
    // 2:1:1 → 50/25/25
    expect(r.funnel).toEqual({ topo: 5, meio: 3, fundo: 2 });
    expect(r.funnelPercent).toEqual({ topo: 50, meio: 25, fundo: 25 });
  });

  it("funções somam o total e usam pesos-padrão quando ausentes", () => {
    const r = planDistribution({ total: 20, funnel: { topo: 60, meio: 30, fundo: 10 } });
    const sum = CONTENT_FUNCTIONS.reduce((a, f) => a + r.functions[f], 0);
    expect(sum).toBe(20);
  });

  it("mais topo do que fundo é respeitado", () => {
    const r = planDistribution({ total: 10, funnel: { topo: 80, meio: 10, fundo: 10 } });
    expect(r.funnel.topo).toBeGreaterThan(r.funnel.fundo);
    expect(r.funnel.topo).toBe(8);
  });

  it("avisa quando há fundo de funil mas nenhuma conversão", () => {
    const r = planDistribution({
      total: 10,
      funnel: { topo: 20, meio: 20, fundo: 60 },
      functions: {
        descoberta: 5, conscientizacao: 5, educativo: 0,
        conversao: 0, experiencia_propria: 0, experiencia_compartilhada: 0,
      },
    });
    expect(r.warnings.some((w) => w.includes("conversão"))).toBe(true);
  });

  it("largestRemainder lida com pesos zerados", () => {
    expect(largestRemainder([0, 0, 0], 5)).toEqual([0, 0, 0]);
  });
});
