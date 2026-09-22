/**
 * Contratos do pipeline ponta a ponta do Content OS.
 * Cliente → Content DNA → Estratégia → Pesquisa → Editorial → Ideias →
 * Produção → Calendário → (Notion) → Performance.
 */
export type FunnelStage = "topo" | "meio" | "fundo";

export type DnaEntry = {
  section: string;
  field: string;
  value: string;
  state: string;
  source: string;
};
export type Dna = DnaEntry[];

/** Um caminho estratégico possível para o cliente (arquétipo especializado). */
export type StrategyPath = {
  key: string;
  nome: string;
  quando: string;
  porque: string;
  objetivo: string;
  publico: string;
  problemaOportunidade: string;
  bigMessage: string;
  percepcao: string;
  emocoes: string[];
  jornada: string;
  funil: FunnelStage;
  funcoes: string[];
  pilares: string[];
  tiposConteudo: string[];
  metricas: string[];
  relevancia: number; // 0–100, quão indicado para este cliente
};

/** Item do mix estratégico recomendado (soma 100%). */
export type MixItem = { key: string; nome: string; pct: number };

export type StrategyArchitecture = {
  posicionamento: string;
  bigMessage: string;
  persona: string;
  dores: string[];
  desejos: string[];
  objecoes: string[];
  voc: string[];
  diferenciais: string[];
  objetivos: string[];
  jornada: string[];
  funil: FunnelStage[];
  percepcao: string;
  emocoes: string[];
  pilares: string[];
  funcoes: string[];
  /** Caminhos estratégicos possíveis, ranqueados por relevância ao cliente. */
  paths: StrategyPath[];
  /** Mix recomendado (ex.: 40% Autoridade + 25% Rapport + ...). */
  mix: MixItem[];
};

export type ResearchOpportunity = {
  tipo: string;
  insight: string;
  origem: string;
  data: string;
  relevancia: string;
};

export type EditorialNode = {
  pilar: string;
  territorio: string;
  temas: { tema: string; subtemas: string[]; topicos: string[] }[];
};
export type EditorialArchitecture = EditorialNode[];

/** Recomendação de formato por dimensões (não um único rótulo). */
export type FormatRecommendation = {
  producao: string; // Lo-fi / Mid-fi / High-fi
  estrutura: string; // talking head / react / tela dividida / duplo personagem / vlog / tutorial…
  narrativa: string; // storytelling / análise / contraponto / curiosidade…
  superficie: string; // Reel / Stories / Carrossel / Vídeo
  justificativa: string;
};

export type Idea = {
  id: string;
  titulo: string;
  conceito: string;
  angulo: string;
  persona: string;
  dorDesejo: string;
  objetivo: string;
  funcao: string;
  funil: FunnelStage;
  jornada: string;
  emocao: string;
  percepcao: string;
  pilar: string;
  tema: string;
  subtema: string;
  surface: string;
  format: string;
  formatRec: FormatRecommendation;
  hook: string;
  cta: string;
  justificativa: string;
};

export type RoteiroStep = { label: string; text: string };

export type ProducedContent = {
  ideaId: string;
  headline: string;
  kind: "reel" | "carrossel" | "stories" | "outro";
  roteiro?: RoteiroStep[];
  slides?: RoteiroStep[];
  stories?: RoteiroStep[];
  copy: string;
  cta: string;
  gatilhos: string[];
  recursos: string[];
  emocao: string;
  emocaoPor: string;
  direcaoVisual: string;
};

export type CalendarItem = {
  data: string;
  idea: Idea;
  content: ProducedContent;
  status: string;
};
export type MonthlyCalendar = {
  total: number;
  mix: Record<FunnelStage, number>;
  items: CalendarItem[];
};

export type PerformanceRow = {
  kind: "DATA" | "HYPOTHESIS" | "INTERPRETATION" | "INSIGHT" | "RECOMMENDATION";
  text: string;
};

export type NotionPage = {
  title: string;
  properties: Record<string, string>;
  bodyPreview: string;
};

export type PipelineResult = {
  clientId: string;
  clientName: string;
  generatedAt: string;
  provider: string;
  dna: Dna;
  strategy: StrategyArchitecture;
  research: ResearchOpportunity[];
  editorial: EditorialArchitecture;
  ideas: Idea[];
  calendar: MonthlyCalendar;
  notion: NotionPage[];
  performance: PerformanceRow[];
  warnings: string[];
};
