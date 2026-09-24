import type { FormatGuide } from "./niche-formats.js";

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

/** Gatilho mental recomendado, com o PORQUÊ e guardrail quando exige evidência. */
export type TriggerRec = { key: string; nome: string; porque: string; guardrail?: string };
/** Elemento literário/narrativo recomendado, com o PORQUÊ. */
export type DeviceRec = { key: string; nome: string; porque: string };
/** Mesma copy em três extensões, todas com Hook + desenvolvimento + CTA. */
export type CopyVariants = { curta: string; media: string; longa: string };

/** Recomendação de formato por dimensões (não um único rótulo). */
export type FormatRecommendation = {
  formato: string; // formato nomeado da biblioteca (Talking Head, POV, Case…)
  objetivo: string; // objetivo estratégico que o formato serve
  producao: string; // Lo-fi / Mid-fi / High-fi
  estrutura: string; // talking head / react / tela dividida / duplo personagem / vlog / tutorial…
  narrativa: string; // storytelling / análise / contraponto / curiosidade…
  superficie: string; // Reel / Stories / Carrossel / Vídeo
  justificativa: string; // o motivo da escolha
};

export type Idea = {
  id: string;
  titulo: string;
  conceito: string;
  angulo: string;
  persona: string;
  dorDesejo: string;
  objetivo: string;
  /** Propósito: o "para quê" mais profundo da peça (por que ela existe). */
  proposito: string;
  /** Big Message desta peça (a principal mensagem a deixar). */
  bigMessage: string;
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
  /** Mesma copy em três extensões (Hook + desenvolvimento + CTA em cada). */
  copyVariants: CopyVariants;
  cta: string;
  gatilhos: string[];
  recursos: string[];
  /** Gatilhos recomendados com o porquê (a partir de gatilhos). */
  gatilhosRec: TriggerRec[];
  /** Elementos literários recomendados com o porquê. */
  elementosRec: DeviceRec[];
  emocao: string;
  emocaoPor: string;
  direcaoVisual: string;
};

/** Referência visual (nunca inventada): termo de busca + link real de busca. */
export type VisualRef = {
  fonte: "Pixabay" | "Pinterest" | "Sugestão";
  termo: string;
  url?: string;
  nota: string;
};

/** Um slide do carrossel (Mosaico). */
export type CarouselSlide = {
  n: number;
  papel: string; // Capa / Hook / Contexto / Desenvolvimento / Virada / Prova / Conclusão / CTA
  titulo: string; // texto grande do slide
  texto: string; // corpo do slide
  visual: string; // direção visual do slide
  imagem: string; // sugestão de imagem/referência (termo de busca)
};

/** Carrossel completo e pronto para produção (agente Mosaico). */
export type Carousel = {
  ideaId: string;
  estrutura: string; // Lista / Framework / Comparação / Case / Mito×Verdade / Passo a passo / Storytelling
  capaHeadline: string;
  capaSub: string;
  hook: string;
  slides: CarouselSlide[];
  copy: string; // legenda do post
  cta: string;
  gatilhos: string[];
  elementosLiterarios: string[];
  /** Gatilhos recomendados com o porquê. */
  gatilhosRec: TriggerRec[];
  /** Elementos literários recomendados com o porquê. */
  elementosRec: DeviceRec[];
  emocao: string;
  emocaoPor: string;
  direcaoVisual: string;
  referencias: VisualRef[];
};

/** Um Story dentro de uma sequência (agente Enredo). */
export type StoryStep = {
  n: number;
  papel: string; // Atração / Conexão / Curiosidade / Autoridade / Prova / Interação / Antecipação / CTA
  fala: string; // texto/fala do Story
  visual: string; // o que aparece na tela
  interacao: string; // enquete / caixa de perguntas / quiz / slider / "arrasta pra cima" / deslize
};

/** Sequência de Stories com progressão narrativa e emocional (agente Enredo). */
export type StorySequence = {
  ideaId: string;
  tipo: string; // bastidores / rotina / opinião / storytelling pessoal / prova / aquecimento / conversão…
  objetivo: string;
  publico: string;
  contexto: string;
  emocao: string;
  emocaoPor: string;
  percepcaoDesejada: string;
  narrativa: string; // arco da sequência em uma frase
  progressao: string[]; // Relacionamento → Familiaridade → Confiança → Autoridade → Desejo → Conversão
  stories: StoryStep[];
  cta: string;
  gatilhos: string[];
  /** Gatilhos recomendados com o porquê. */
  gatilhosRec: TriggerRec[];
  /** Elementos literários recomendados com o porquê. */
  elementosRec: DeviceRec[];
  referencias: VisualRef[];
};

export type CalendarItem = {
  data: string;
  idea: Idea;
  content: ProducedContent;
  /** Carrossel pronto para produção (agente Mosaico). */
  carousel: Carousel;
  /** Sequência de Stories pronta para produção (agente Enredo). */
  stories: StorySequence;
  status: string;
};
export type MonthlyCalendar = {
  total: number;
  mix: Record<FunnelStage, number>;
  items: CalendarItem[];
};

/** Item do calendário antes de anexar carrossel/Stories (saída de assembleCalendar). */
export type CalendarDraftItem = Omit<CalendarItem, "carousel" | "stories">;
export type MonthlyCalendarDraft = {
  total: number;
  mix: Record<FunnelStage, number>;
  items: CalendarDraftItem[];
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

/** Bibliotecas selecionáveis expostas ao painel (gatilhos + elementos + formatos). */
export type CreativeLibraries = {
  gatilhos: { key: string; nome: string; descricao: string; requerEvidencia?: boolean }[];
  elementos: { key: string; nome: string; descricao: string }[];
  formatos: { key: string; nome: string; descricao: string; producao: string; superficie: string }[];
};

export type PipelineResult = {
  /** Guia de formatos do nicho do cliente (Musa) — opções + orientação. */
  formatGuide: FormatGuide;
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
  /** Bibliotecas de gatilhos e elementos literários (para seleção no painel). */
  libraries: CreativeLibraries;
  warnings: string[];
};
