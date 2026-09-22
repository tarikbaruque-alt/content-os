import { describe, it, expect, beforeAll } from "vitest";
import { runPipeline } from "../../src/pipeline/run.js";
import type { PipelineResult } from "../../src/pipeline/types.js";
import type { LlmProvider, LlmGenerateResult } from "../../src/core/llm/provider.js";
import {
  buildStorySequence,
  writeStorySequence,
  parseStoryJson,
  selectStoryType,
  listStoryTypes,
  STORY_TYPES,
} from "../../src/agents/stories/agent.js";
import { buildCreativeContext } from "../../src/agents/creative/context.js";
import { PIPELINE_BRIEFING, PIPELINE_CLIENT, PIPELINE_SOURCE } from "../../src/demo/pipeline-client.js";

class FakeProvider implements LlmProvider {
  readonly name = "fake";
  constructor(private readonly text: string, private readonly fail = false) {}
  async generate(): Promise<LlmGenerateResult> {
    if (this.fail) throw new Error("boom");
    return { text: this.text, provider: this.name };
  }
}

describe("Enredo — sequência de Stories especialista", () => {
  let r: PipelineResult;
  beforeAll(async () => {
    r = await runPipeline(PIPELINE_CLIENT, PIPELINE_BRIEFING, PIPELINE_SOURCE);
  });

  it("oferece uma biblioteca rica de tipos de sequência", () => {
    const keys = new Set(STORY_TYPES.map((t) => t.key));
    ["bastidores", "rotina", "opiniao", "storytelling_pessoal", "experiencia_clientes", "prova", "aquecimento", "conversao"].forEach((k) =>
      expect(keys.has(k)).toBe(true),
    );
    expect(STORY_TYPES.length).toBeGreaterThanOrEqual(14);
    expect(listStoryTypes().length).toBe(STORY_TYPES.length);
  });

  it("o pipeline anexa uma sequência com progressão (não Stories isolados)", () => {
    for (const it of r.calendar.items) {
      const seq = it.stories;
      expect(seq.stories.length).toBeGreaterThanOrEqual(4);
      // progressão narrativa: cada Story tem papel próprio (não repetição)
      const papeis = new Set(seq.stories.map((s) => s.papel));
      expect(papeis.size).toBeGreaterThanOrEqual(4);
      expect(seq.progressao.length).toBeGreaterThan(0);
      // cada Story define fala + visual + interação
      for (const s of seq.stories) {
        expect(s.fala.length).toBeGreaterThan(0);
        expect(s.visual.length).toBeGreaterThan(0);
        expect(s.interacao.length).toBeGreaterThan(0);
      }
      expect(seq.objetivo && seq.contexto && seq.emocaoPor && seq.percepcaoDesejada).toBeTruthy();
    }
  });

  it("relacionamento primeiro: sequências de topo/meio NÃO viram venda", async () => {
    const ctx = buildCreativeContext("X", r.dna, r.strategy, r.editorial, r.research);
    const ident = r.ideas.find((i) => i.funcao === "Identificação")!;
    const seq = await buildStorySequence(ident, ctx);
    expect(seq.progressao).toContain("Relacionamento");
    expect(seq.cta.toLowerCase()).not.toContain("compra");
    expect(seq.cta.toLowerCase()).toMatch(/relacionamento|seguir|responder/);
  });

  it("conversão é o único tipo com CTA de venda direto", async () => {
    const ctx = buildCreativeContext("X", r.dna, r.strategy, r.editorial, r.research);
    const conv = r.ideas.find((i) => i.funcao === "Conversão")!;
    const seq = await buildStorySequence(conv, ctx, "conversao");
    expect(seq.tipo).toBe("Conversão");
    expect(seq.progressao).toContain("Conversão");
  });

  it("seleciona o tipo coerente com a função da ideia", () => {
    const ident = r.ideas.find((i) => i.funcao === "Identificação")!;
    expect(selectStoryType(ident).key).toBe("identificacao");
    const aut = r.ideas.find((i) => i.funcao === "Autoridade")!;
    expect(selectStoryType(aut).key).toBe("autoridade");
  });

  it("usa o JSON do LLM quando válido e faz fallback quando não", async () => {
    const ctx = buildCreativeContext("X", r.dna, r.strategy, r.editorial, r.research);
    const idea = r.ideas[0]!;
    const json = JSON.stringify({
      tipo: "Bastidores",
      objetivo: "aproximar",
      contexto: "ctx",
      emocao: "pertencimento",
      emocaoPor: "porque humaniza",
      percepcaoDesejada: "gente como a gente",
      narrativa: "mostrar o processo",
      progressao: ["Relacionamento", "Familiaridade"],
      stories: [
        { papel: "Atração", fala: "vem comigo", visual: "cena", interacao: "enquete" },
        { papel: "Processo", fala: "olha isso", visual: "close", interacao: "slider" },
        { papel: "Conexão", fala: "se identifica?", visual: "rosto", interacao: "caixinha" },
        { papel: "Fecho", fala: "me segue", visual: "convite", interacao: "seguir" },
      ],
      cta: "seguir",
      gatilhos: ["Proximidade"],
    });
    const good = await writeStorySequence(idea, ctx, new FakeProvider(json));
    expect(good.stories.length).toBe(4);
    expect(good.tipo).toBe("Bastidores");

    const bad = await writeStorySequence(idea, ctx, new FakeProvider("nope"));
    expect(bad.stories.length).toBeGreaterThanOrEqual(4); // determinístico

    const baseSeq = await buildStorySequence(idea, ctx);
    expect(parseStoryJson(JSON.stringify({ stories: [{ fala: "só um" }] }), baseSeq)).toBeNull();
  });
});
