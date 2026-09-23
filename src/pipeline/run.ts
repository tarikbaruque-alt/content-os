import { MockLlmProvider } from "../core/llm/mock.js";
import type { LlmProvider } from "../core/llm/provider.js";
import { KnowledgeRetriever } from "../core/knowledge/retriever.js";
import { InMemoryContentDnaStore } from "../core/content-dna/store.js";
import { Trace } from "../core/observability.js";
import { runIntelligenceAgent } from "../agents/intelligence/agent.js";
import { writeContent } from "../agents/creative/writer.js";
import { buildCreativeContext } from "../agents/creative/context.js";
import { buildCarousel, writeCarousel } from "../agents/carousel/agent.js";
import { buildStorySequence, writeStorySequence } from "../agents/stories/agent.js";
import { createVisualRefProvider, type VisualRefProvider } from "../core/integrations/visual-refs.js";
import { GATILHOS } from "../agents/creative/triggers.js";
import { ELEMENTOS } from "../agents/creative/devices.js";
import { FORMATOS } from "./formats.js";
import { mapWithConcurrency } from "../core/concurrency.js";
import type { CalendarItem, MonthlyCalendar } from "./types.js";
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
  /** Provedor de referências visuais (Pixabay/links). Default: pelo ambiente. */
  visual?: VisualRefProvider;
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

  // Contexto criativo completo para os especialistas (Rima, Mosaico, Enredo).
  const ctx = buildCreativeContext(client.name, dna, strategy, editorial, research);
  const draft = assembleCalendar(ideas, dna, opts.total ?? 12, mix, ctx);
  const visual = opts.visual ?? createVisualRefProvider();
  const real = llm.name !== "mock";

  // Produção criativa: com provider REAL, cada peça vira prosa publicável +
  // carrossel (Mosaico) + sequência de Stories (Enredo). Com mock, tudo é
  // determinístico (offline, testável) — o contrato é o mesmo.
  // Paraleliza: os 3 especialistas de cada peça não dependem um do outro, e
  // várias peças podem ser produzidas ao mesmo tempo (limite de concorrência
  // para não estourar rate limit da API) — com IA real isso é ~10x mais rápido
  // que gerar peça a peça, especialista a especialista, em série.
  const items = await mapWithConcurrency(draft.items, 4, async (it) => {
    const [content, carousel, stories] = await Promise.all([
      real ? writeContent(it.idea, ctx, llm) : Promise.resolve(it.content),
      real ? writeCarousel(it.idea, ctx, llm, visual) : buildCarousel(it.idea, ctx, visual),
      real ? writeStorySequence(it.idea, ctx, llm, undefined, visual) : buildStorySequence(it.idea, ctx, undefined, visual),
    ]);
    const full: CalendarItem = { ...it, content, carousel, stories };
    return full;
  });
  const calendar: MonthlyCalendar = { total: draft.total, mix: draft.mix, items };

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
    libraries: {
      gatilhos: GATILHOS,
      elementos: ELEMENTOS,
      formatos: FORMATOS.map((f) => ({ key: f.key, nome: f.nome, descricao: f.descricao, producao: f.producao, superficie: f.superficie })),
    },
    warnings,
  };
}
