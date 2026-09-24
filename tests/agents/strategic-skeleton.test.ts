import { describe, it, expect, beforeAll } from "vitest";
import { runPipeline } from "../../src/pipeline/run.js";
import type { PipelineResult } from "../../src/pipeline/types.js";
import { GATILHOS, recommendTriggers } from "../../src/agents/creative/triggers.js";
import { ELEMENTOS, recommendDevices } from "../../src/agents/creative/devices.js";
import { buildCreativeContext } from "../../src/agents/creative/context.js";
import { PIPELINE_BRIEFING, PIPELINE_CLIENT, PIPELINE_SOURCE } from "../../src/demo/pipeline-client.js";

describe("Esqueleto estratégico — gatilhos, elementos, copy, propósito, Big Message", () => {
  let r: PipelineResult;
  let ctx: ReturnType<typeof buildCreativeContext>;
  beforeAll(async () => {
    r = await runPipeline(PIPELINE_CLIENT, PIPELINE_BRIEFING, PIPELINE_SOURCE);
    ctx = buildCreativeContext(r.clientName, r.dna, r.strategy, r.editorial, r.research);
  });

  it("biblioteca de gatilhos cobre a lista pedida, incluindo urgência/escassez reais", () => {
    const keys = new Set(GATILHOS.map((g) => g.key));
    ["curiosidade", "identificacao", "autoridade", "prova", "especificidade", "contraste", "pertencimento", "antecipacao", "reciprocidade", "compromisso", "novidade", "familiaridade", "reducao_risco", "aversao_perda", "urgencia", "escassez"].forEach((k) =>
      expect(keys.has(k)).toBe(true),
    );
    // guardrail: os que exigem evidência estão marcados
    const need = GATILHOS.filter((g) => g.requerEvidencia).map((g) => g.key);
    expect(need).toEqual(expect.arrayContaining(["autoridade", "prova", "urgencia", "escassez"]));
  });

  it("biblioteca de elementos literários cobre a lista pedida", () => {
    const keys = new Set(ELEMENTOS.map((d) => d.key));
    ["storytelling", "metafora", "analogia", "contraste", "paradoxo", "antitese", "repeticao", "ritmo", "ironia", "suspense", "tensao", "conflito", "dialogo", "pergunta_retorica", "open_loop", "quebra_expectativa", "revelacao"].forEach((k) =>
      expect(keys.has(k)).toBe(true),
    );
  });

  it("recomenda gatilhos com o PORQUÊ e guardrail quando exige evidência", () => {
    const prova = r.ideas.find((i) => i.funcao === "Prova")!;
    const recs = recommendTriggers(prova, ctx);
    expect(recs.length).toBeGreaterThanOrEqual(3);
    recs.forEach((t) => expect(t.porque.length).toBeGreaterThan(8));
    const provaRec = recs.find((t) => t.key === "prova");
    if (provaRec) expect(provaRec.guardrail).toBeTruthy(); // nunca inventar
  });

  it("recomenda elementos com o PORQUÊ, coerentes com emoção/formato", () => {
    const recs = recommendDevices(r.ideas[0]!, ctx);
    expect(recs.length).toBeGreaterThanOrEqual(3);
    recs.forEach((d) => expect(d.porque.length).toBeGreaterThan(8));
  });

  it("cada ideia carrega Propósito + Big Message reais", () => {
    for (const i of r.ideas) {
      expect(i.proposito.length).toBeGreaterThan(15);
      expect(i.bigMessage).toBe(r.strategy.bigMessage);
    }
  });

  it("cada conteúdo tem copy CURTA/MÉDIA/LONGA, todas com Hook + CTA", () => {
    for (const it of r.calendar.items) {
      const cv = it.content.copyVariants;
      expect(cv.curta.length).toBeGreaterThan(10);
      expect(cv.media.length).toBeGreaterThan(cv.curta.length - 1);
      expect(cv.longa.length).toBeGreaterThan(cv.media.length);
      // hook e cta presentes em cada variante
      [cv.curta, cv.media, cv.longa].forEach((c) => {
        expect(c.startsWith(it.idea.hook)).toBe(true);
        expect(c.includes(it.content.cta)).toBe(true);
      });
      // recomendações estruturadas presentes
      expect(it.content.gatilhosRec.length).toBeGreaterThan(0);
      expect(it.content.elementosRec.length).toBeGreaterThan(0);
    }
  });

  it("roteiro de Reel segue Hook → Desenvolvimento → Retenção/Tensão → Payoff → CTA", () => {
    const reel = r.calendar.items.find((it) => it.content.roteiro);
    expect(reel).toBeTruthy();
    const labels = reel!.content.roteiro!.map((s) => s.label);
    expect(labels).toEqual(["Hook", "Desenvolvimento", "Retenção/Tensão", "Payoff", "CTA"]);
  });

  it("carrossel e Stories também carregam gatilhos + elementos recomendados", () => {
    for (const it of r.calendar.items) {
      expect(it.carousel.gatilhosRec.length).toBeGreaterThan(0);
      expect(it.carousel.elementosRec.length).toBeGreaterThan(0);
      expect(it.stories.gatilhosRec.length).toBeGreaterThan(0);
      expect(it.stories.elementosRec.length).toBeGreaterThan(0);
    }
  });

  it("as bibliotecas são expostas no resultado (para seleção no painel)", () => {
    expect(r.libraries.gatilhos.length).toBe(GATILHOS.length);
    expect(r.libraries.elementos.length).toBe(ELEMENTOS.length);
  });
});

describe("Rascunho (sem IA) nunca se passa por texto final", () => {
  it("peças determinísticas saem marcadas como rascunho, sem meta-texto interno na copy", async () => {
    const { runPipeline } = await import("../../src/pipeline/run.js");
    const { PIPELINE_CLIENTS } = await import("../../src/demo/pipeline-client.js");
    const c = PIPELINE_CLIENTS[0]!;
    const r = await runPipeline(c, c.briefing, c.source, { total: 4 });
    for (const it of r.calendar.items) {
      expect(it.content.origem).toBe("rascunho");
      expect(it.carousel.origem).toBe("rascunho");
      const texto = [it.content.copyVariants.curta, it.content.copyVariants.media, it.content.copyVariants.longa, ...(it.content.roteiro ?? []).map((s) => s.text)].join(" ");
      expect(texto).not.toMatch(/ancorado no Content DNA|através de|sem inventar\)/);
    }
    expect(r.notion.every((p) => p.properties.Origem === "Rascunho (sem IA)" && p.bodyPreview.startsWith("⚠️ RASCUNHO"))).toBe(true);
    expect(r.warnings.some((w) => w.includes("RASCUNHO"))).toBe(true);
  });
});
