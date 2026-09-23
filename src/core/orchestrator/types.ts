import type { LlmProvider } from "../llm/provider.js";
import type { KnowledgeRetriever } from "../knowledge/retriever.js";
import type { ContentDnaStore } from "../content-dna/store.js";
import type { Trace, TraceSummary } from "../observability.js";

/** Dependências compartilhadas injetadas nos agentes (testável). */
export type AgentContext = {
  llm: LlmProvider;
  knowledge: KnowledgeRetriever;
  store: ContentDnaStore;
};

/** Resultado padronizado de qualquer agente. */
export type AgentResult<O> = {
  output: O;
  trace: TraceSummary;
  warnings: string[];
  /** Saída que altera memória estratégica precisa de aprovação humana. */
  needsHumanApproval: boolean;
};

export type AgentRunner<I, O> = (
  input: I,
  ctx: AgentContext,
  trace: Trace,
) => Promise<{ output: O; warnings: string[]; needsHumanApproval: boolean }>;
