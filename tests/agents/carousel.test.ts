import { describe, it, expect, beforeAll } from "vitest";
import { runPipeline } from "../../src/pipeline/run.js";
import type { PipelineResult } from "../../src/pipeline/types.js";
import type { LlmProvider, LlmGenerateResult } from "../../src/core/llm/provider.js";
import { buildCarousel, writeCarousel, parseCarouselJson } from "../../src/agents/carousel/agent.js";
import { buildCreativeContext } from "../../src/agents/creative/context.js";
import { SearchLinkVisualProvider } from "../../src/core/integrations/visual-refs.js";
import { PIPELINE_BRIEFING, PIPELINE_CLIENT, PIPELINE_SOURCE } from "../../src/demo/pipeline-client.js";

class FakeProvider implements LlmProvider {
  readonly name = "fake";
  constructor(private readonly text: string, private readonly fail = false) {}
  async generate(): Promise<LlmGenerateResult> {
    if (this.fail) throw new Error("boom");
    return { text: this.text, provider: this.name };
  }
}

describe("Mosaico — carrossel especialista", () => {
  let r: PipelineResult;
  beforeAll(async () => {
    r = await runPipeline(PIPELINE_CLIENT, PIPELINE_BRIEFING, PIPELINE_SOURCE);
  });

  it("o pipeline anexa um carrossel completo a cada peça", () => {
    for (const it of r.calendar.items) {
      expect(it.carousel.slides.length).toBeGreaterThanOrEqual(5);
      expect(it.carousel.capaHeadline.length).toBeGreaterThan(0);
      expect(it.carousel.slides[0]!.papel).toBe("Capa");
      expect(it.carousel.slides[it.carousel.slides.length - 1]!.papel).toBe("CTA");
      expect(it.carousel.elementosLiterarios.length).toBeGreaterThan(0);
      expect(it.carousel.emocaoPor.length).toBeGreaterThan(10);
    }
  });

  it("a estrutura muda conforme a função (não é template fixo)", async () => {
    const ctx = buildCreativeContext("X", r.dna, r.strategy, r.editorial, r.research);
    const prova = r.ideas.find((i) => i.funcao === "Prova")!;
    const educ = r.ideas.find((i) => i.funcao === "Educação")!;
    const cProva = await buildCarousel(prova, ctx);
    const cEduc = await buildCarousel(educ, ctx);
    expect(cProva.estrutura).not.toBe(cEduc.estrutura);
  });

  it("as referências visuais são links reais de busca (nunca inventadas)", async () => {
    const ctx = buildCreativeContext("X", r.dna, r.strategy, r.editorial, r.research);
    const c = await buildCarousel(r.ideas[0]!, ctx, new SearchLinkVisualProvider());
    expect(c.referencias.length).toBeGreaterThan(0);
    expect(c.referencias.some((ref) => (ref.url ?? "").includes("pinterest.com/search"))).toBe(true);
  });

  it("usa o JSON do LLM quando válido", async () => {
    const ctx = buildCreativeContext("X", r.dna, r.strategy, r.editorial, r.research);
    const idea = r.ideas[0]!;
    const json = JSON.stringify({
      capaHeadline: "Capa premium de verdade",
      hook: "Hook forte",
      estrutura: "Framework",
      slides: [
        { papel: "Capa", titulo: "Capa", texto: "abre", visual: "v", imagem: "i" },
        { papel: "Meio", titulo: "Desenvolve", texto: "corpo", visual: "v", imagem: "i" },
        { papel: "CTA", titulo: "Chama", texto: "fecha", visual: "v", imagem: "i" },
      ],
      copy: "Uma legenda publicável e ancorada no DNA do cliente.",
      cta: "Salvar",
      gatilhos: ["Prova"],
      elementosLiterarios: ["Metáfora"],
      emocao: "confiança",
      emocaoPor: "porque sustenta a decisão",
      direcaoVisual: "limpo",
    });
    const c = await writeCarousel(idea, ctx, new FakeProvider(json));
    expect(c.capaHeadline).toBe("Capa premium de verdade");
    expect(c.slides.length).toBe(3);
  });

  it("faz fallback determinístico com JSON inválido ou erro de rede", async () => {
    const ctx = buildCreativeContext("X", r.dna, r.strategy, r.editorial, r.research);
    const idea = r.ideas[0]!;
    const bad = await writeCarousel(idea, ctx, new FakeProvider("não sei"));
    expect(bad.slides.length).toBeGreaterThanOrEqual(5); // veio do determinístico
    const err = await writeCarousel(idea, ctx, new FakeProvider("", true));
    expect(err.slides.length).toBeGreaterThanOrEqual(5);
  });

  it("parseCarouselJson rejeita carrossel raso (guardrail de qualidade)", async () => {
    const ctx = buildCreativeContext("X", r.dna, r.strategy, r.editorial, r.research);
    const base = await buildCarousel(r.ideas[0]!, ctx);
    expect(parseCarouselJson(JSON.stringify({ slides: [{ titulo: "só um" }], copy: "x" }), base)).toBeNull();
  });
});
