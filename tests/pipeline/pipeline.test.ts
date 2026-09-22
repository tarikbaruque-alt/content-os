import { describe, it, expect, beforeAll } from "vitest";
import { runPipeline } from "../../src/pipeline/run.js";
import type { PipelineResult } from "../../src/pipeline/types.js";
import {
  PIPELINE_BRIEFING,
  PIPELINE_CLIENT,
  PIPELINE_SOURCE,
} from "../../src/demo/pipeline-client.js";

describe("Pipeline ponta a ponta (Íris → … → Notion)", () => {
  let r: PipelineResult;
  beforeAll(async () => {
    r = await runPipeline(PIPELINE_CLIENT, PIPELINE_BRIEFING, PIPELINE_SOURCE);
  });

  it("Content DNA é estruturado pela Íris", () => {
    expect(r.dna.length).toBeGreaterThan(8);
    expect(r.dna.some((d) => d.section === "audience" && d.field === "persona")).toBe(true);
  });

  it("Estratégia tem profundidade (Big Message, funções, pilares)", () => {
    expect(r.strategy.bigMessage.length).toBeGreaterThan(20);
    expect(r.strategy.funcoes.length).toBeGreaterThanOrEqual(8);
    expect(r.strategy.pilares.length).toBe(4);
    expect(r.strategy.emocoes.length).toBeGreaterThan(2);
  });

  it("gera no mínimo 15 ideias realmente diferentes", () => {
    expect(r.ideas.length).toBeGreaterThanOrEqual(15);
    const funcoes = new Set(r.ideas.map((i) => i.funcao));
    expect(funcoes.size).toBeGreaterThanOrEqual(6); // diversidade de função
    const titulos = new Set(r.ideas.map((i) => i.titulo));
    expect(titulos.size).toBeGreaterThanOrEqual(12); // não são a mesma ideia
  });

  it("cada item do calendário tem conteúdo pronto (roteiro/slides/stories + copy + CTA)", () => {
    expect(r.calendar.items.length).toBeGreaterThan(0);
    for (const it of r.calendar.items) {
      const hasBody = !!(it.content.roteiro || it.content.slides || it.content.stories);
      expect(hasBody).toBe(true);
      expect(it.content.copy.length).toBeGreaterThan(10);
      expect(it.content.cta.length).toBeGreaterThan(0);
      expect(it.content.emocao.length).toBeGreaterThan(0);
    }
  });

  it("cada peça vira uma página de Notion com a cadeia estratégica", () => {
    expect(r.notion.length).toBe(r.calendar.items.length);
    for (const p of r.notion) {
      for (const key of ["Funil", "Função estratégica", "Emoção", "CTA", "Status"]) {
        expect(p.properties[key]).toBeTruthy();
      }
    }
  });

  it("performance distingue DATA/HYPOTHESIS/INTERPRETATION/INSIGHT/RECOMMENDATION", () => {
    const kinds = new Set(r.performance.map((p) => p.kind));
    ["DATA", "HYPOTHESIS", "INTERPRETATION", "INSIGHT", "RECOMMENDATION"].forEach((k) =>
      expect(kinds.has(k as never)).toBe(true),
    );
  });

  it("personalização: a estratégia carrega termos do próprio cliente (teste do concorrente)", () => {
    const blob = (r.strategy.bigMessage + " " + r.strategy.posicionamento).toLowerCase();
    // termos vindos do DNA da fotógrafa
    const specific = ["emoç", "document", "registr", "foto", "natural"].some((t) => blob.includes(t));
    expect(specific).toBe(true);
  });
});
