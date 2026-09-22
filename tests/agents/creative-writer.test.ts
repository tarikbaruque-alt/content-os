import { describe, it, expect, beforeAll } from "vitest";
import { runPipeline } from "../../src/pipeline/run.js";
import type { PipelineResult } from "../../src/pipeline/types.js";
import type { LlmProvider, LlmGenerateResult } from "../../src/core/llm/provider.js";
import { writeContent, parseWriterJson, extractJson } from "../../src/agents/creative/writer.js";
import { PIPELINE_BRIEFING, PIPELINE_CLIENT, PIPELINE_SOURCE } from "../../src/demo/pipeline-client.js";

/** Provider falso: devolve o texto configurado, com name != "mock". */
class FakeProvider implements LlmProvider {
  readonly name = "fake";
  constructor(private readonly text: string, private readonly fail = false) {}
  async generate(): Promise<LlmGenerateResult> {
    if (this.fail) throw new Error("boom");
    return { text: this.text, provider: this.name };
  }
}

describe("Rima — redação com LLM (fallback seguro)", () => {
  let r: PipelineResult;
  beforeAll(async () => {
    r = await runPipeline(PIPELINE_CLIENT, PIPELINE_BRIEFING, PIPELINE_SOURCE);
  });

  it("extractJson pega o objeto mesmo com cercas/ruído", () => {
    expect(extractJson("```json\n{\"a\":1}\n```")).toBe('{"a":1}');
    expect(extractJson("sem json aqui")).toBeNull();
  });

  it("usa a resposta do LLM quando é JSON válido e completo", async () => {
    const idea = r.ideas[0]!;
    const json = JSON.stringify({
      headline: "Você registra momentos — ou só tira fotos?",
      roteiro: [
        { label: "Hook", text: "Você registra momentos — ou só tira fotos?" },
        { label: "CTA", text: "Me chama no direct." },
      ],
      copy: "Um texto de verdade, publicável, ancorado no que a cliente valoriza: emoção real e naturalidade.",
      cta: "Me chama no direct",
      gatilhos: ["Identificação", "Contraste"],
      recursos: ["Open loop"],
      emocao: "identificação",
      emocaoPor: "A persona quer se ver na foto; a identificação sustenta o próximo passo.",
      direcaoVisual: "Luz natural, cortes no ritmo da fala.",
    });
    const content = await writeContent(idea, r.dna, r.strategy, new FakeProvider(json));
    expect(content.headline).toContain("registra momentos");
    expect(content.copy.length).toBeGreaterThan(20);
    expect(content.emocaoPor.length).toBeGreaterThan(10);
    expect(content.roteiro && content.roteiro.length).toBeGreaterThan(0);
  });

  it("faz fallback determinístico se o JSON for inválido", async () => {
    const idea = r.ideas[0]!;
    const content = await writeContent(idea, r.dna, r.strategy, new FakeProvider("desculpa, não consigo"));
    // volta ao produtor determinístico (headline = hook da ideia)
    expect(content.headline).toBe(idea.hook);
    expect(content.copy.length).toBeGreaterThan(10);
  });

  it("faz fallback se o provider lançar erro (rede/API)", async () => {
    const idea = r.ideas[0]!;
    const content = await writeContent(idea, r.dna, r.strategy, new FakeProvider("", true));
    expect(content.headline).toBe(idea.hook);
  });

  it("parseWriterJson rejeita resposta sem copy mínima (guardrail de qualidade)", () => {
    const idea = r.ideas[0]!;
    const fallback = { ...r.calendar.items[0]!.content };
    const bad = JSON.stringify({ headline: "ok", copy: "curto" });
    expect(parseWriterJson(bad, idea, fallback)).toBeNull();
  });
});
