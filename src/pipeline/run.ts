import { MockLlmProvider } from "../core/llm/mock.js";
import type { LlmProvider } from "../core/llm/provider.js";
import { KnowledgeRetriever } from "../core/knowledge/retriever.js";
import { InMemoryContentDnaStore } from "../core/content-dna/store.js";
import { Trace } from "../core/observability.js";
import { runIntelligenceAgent } from "../agents/intelligence/agent.js";
import { writeContent } from "../agents/creative/writer.js";
import type { FunnelStage } from "../core/planning/distribution.js";
import {
  assembleCalendar,
  buildEditorial,
  deriveResearch,
  deriveStrategy,
  generateIdeas,
  seedPerformance,
  toNotionPages,
} from "./stages.js";
import type { Dna, PipelineResult } from "./types.js";

export type PipelineOptions = {
  llm?: LlmProvider;
  knowledge?: KnowledgeRetriever;
  total?: number;
  funnelMix?: Record<FunnelStage, number>;
  minIdeas?: number;
};

/**
 * Roda o Content OS ponta a ponta para um cliente, compartilhando contexto
 * entre as etapas (não são chatbots isolados): a saída da Íris alimenta a
 * Estratégia, que alimenta Editorial → Ideias → Produção → Calendário → Notion.
 */
export async function runPipeline(
  client: { id: string; name: string },
  briefing: string,
  source: string,
  opts: PipelineOptions = {},
): Promise<PipelineResult> {
  const llm = opts.llm ?? new MockLlmProvider();
  const knowledge = opts.knowledge ?? new KnowledgeRetriever();
  const store = new InMemoryContentDnaStore();
  const trace = new Trace("Maestro", client.id);

  // 1. Content DNA (Íris) — com guardrails reais.
  const iris = await runIntelligenceAgent(
    { clientId: client.id, rawInputs: [{ type: "interview", content: briefing, source }] },
    { llm, knowledge, store },
    trace,
  );
  const dna: Dna = iris.output.suggestions.map((s) => ({
    section: s.section,
    field: s.field,
    value: s.value,
    state: s.state,
    source: s.provenance.source,
  }));

  // 2..8 — etapas encadeadas
  const strategy = deriveStrategy(dna);
  const research = deriveResearch(dna);
  const editorial = buildEditorial(strategy);
  const ideas = generateIdeas(dna, strategy, opts.minIdeas ?? 15);
  const mix = opts.funnelMix ?? { topo: 45, meio: 35, fundo: 20 };
  const calendar = assembleCalendar(ideas, dna, opts.total ?? 12, mix);

  // Produção criativa: com provider REAL (Rima/Anthropic), reescreve cada peça
  // em prosa publicável ancorada no DNA. Com mock, mantém o determinístico.
  if (llm.name !== "mock") {
    for (const item of calendar.items) {
      item.content = await writeContent(item.idea, dna, strategy, llm);
    }
  }

  const notion = toNotionPages(calendar, client.name);
  const performance = seedPerformance(strategy);

  const warnings = [...iris.warnings];
  if (ideas.length < 15) warnings.push("Menos de 15 ideias geradas.");

  return {
    clientId: client.id,
    clientName: client.name,
    generatedAt: new Date().toISOString(),
    provider: llm.name,
    dna,
    strategy,
    research,
    editorial,
    ideas,
    calendar,
    notion,
    performance,
    warnings,
  };
}
