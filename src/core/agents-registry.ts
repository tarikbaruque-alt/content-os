/**
 * Registro dos agentes do Content OS. Fonte única de verdade sobre
 * nome próprio, função, classificação e status. Usado pelo orquestrador
 * (Maestro) e espelhado no painel.
 */
export type AgentStatus = "active" | "in_progress" | "planned";
export type AgentKind = "reasoning" | "retrieval" | "coordination";

export type AgentInfo = {
  key: string;
  order: number;
  /** Nome próprio (ex.: "Íris"). */
  name: string;
  /** Função (ex.: "Inteligência"). */
  role: string;
  kind: AgentKind;
  status: AgentStatus;
  summary: string;
};

export const AGENTS: AgentInfo[] = [
  { key: "intelligence", order: 1, name: "Íris", role: "Inteligência", kind: "reasoning", status: "active",
    summary: "Entende o cliente e estrutura o Content DNA (negócio, público, persona, dores, desejos, objeções, VoC, posicionamento, comunicação)." },
  { key: "strategy", order: 2, name: "Átlas", role: "Estratégia", kind: "reasoning", status: "planned",
    summary: "Transforma inteligência em estratégia: posicionamento, Big Message, objetivos, jornada, percepção desejada." },
  { key: "research", order: 3, name: "Radar", role: "Pesquisa", kind: "reasoning", status: "planned",
    summary: "Inteligência externa: nicho, concorrentes, tendências, palavras-chave, oportunidades — com fonte, URL e data." },
  { key: "editorial", order: 4, name: "Bússola", role: "Editorial", kind: "reasoning", status: "planned",
    summary: "Arquitetura editorial: pilares, territórios, temas, subtemas, clusters e tópicos." },
  { key: "ideas", order: 5, name: "Musa", role: "Ideias & Formatos", kind: "reasoning", status: "planned",
    summary: "Transforma oportunidades em ideias com ângulo, formato, hook e justificativa estratégica." },
  { key: "creative", order: 6, name: "Rima", role: "Estúdio Criativo", kind: "reasoning", status: "planned",
    summary: "Transforma estratégia e ideias em conteúdo: roteiros, headlines, hooks, copy, carrosséis, Stories, CTAs." },
  { key: "planning", order: 7, name: "Cronos", role: "Planejamento", kind: "reasoning", status: "planned",
    summary: "Calendário editorial, frequência, canais, produção, aprovação — do IDEA ao PUBLISHED." },
  { key: "performance", order: 8, name: "Pulso", role: "Performance", kind: "reasoning", status: "planned",
    summary: "Transforma dados em aprendizado: métrica → interpretação → insight → recomendação → próximo teste." },
  { key: "knowledge", order: 9, name: "Acervo", role: "Conhecimento", kind: "retrieval", status: "in_progress",
    summary: "Recupera apenas o conhecimento metodológico relevante da Knowledge Base para cada tarefa." },
  { key: "orchestrator", order: 10, name: "Maestro", role: "Orquestrador", kind: "coordination", status: "planned",
    summary: "Coordena o sistema: decide qual agente usar, o que recuperar, o que passar no handoff e quando pedir o humano." },
];

export function getAgent(key: string): AgentInfo | undefined {
  return AGENTS.find((a) => a.key === key);
}
