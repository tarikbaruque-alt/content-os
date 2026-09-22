import type { FormatRecommendation, FunnelStage } from "./types.js";

/**
 * Biblioteca de formatos organizada por DIMENSÕES (não uma lista solta de 50
 * tipos de Reel). O formato é recomendado a partir da estratégia (função +
 * funil), com justificativa — nunca aleatório. É repertório: a IA pode propor
 * combinações novas quando o contexto pedir.
 */
export const FORMAT_LIBRARY = {
  producao: ["Lo-fi", "Mid-fi", "High-fi"],
  estrutura: [
    "Talking head", "Entrevista", "React", "Tela dividida", "Duplo personagem",
    "POV", "Vlog", "Bastidores", "Tutorial", "Passo a passo", "Demonstração",
    "Case", "Depoimento", "FAQ", "UGC", "Desafio", "Oferta",
  ],
  narrativa: [
    "Storytelling", "Curiosidade", "Tensão", "Polêmica/Contraponto", "Análise",
    "Transformação", "Mito × Verdade", "Erro comum", "Problema-Solução",
    "Comparação", "Antes e depois", "Lista", "Ranking", "Opinião fundamentada",
  ],
  objetivo: [
    "Atenção", "Identificação", "Rapport", "Autoridade", "Educação", "Prova",
    "Quebra de Objeção", "Diferenciação", "Desejo", "Conversão", "Relacionamento",
  ],
  superficie: ["Reel", "Stories", "Carrossel", "Vídeo", "Imagem"],
} as const;

type Rec = Omit<FormatRecommendation, "justificativa">;

const BY_FUNCTION: Record<string, Rec> = {
  Identificação: { producao: "Lo-fi", estrutura: "POV", narrativa: "Erro comum", superficie: "Reel" },
  Atenção: { producao: "Lo-fi", estrutura: "POV", narrativa: "Curiosidade", superficie: "Reel" },
  Descoberta: { producao: "Lo-fi", estrutura: "POV", narrativa: "Curiosidade", superficie: "Reel" },
  Conscientização: { producao: "Mid-fi", estrutura: "Talking head", narrativa: "Mito × Verdade", superficie: "Reel" },
  Autoridade: { producao: "Mid-fi", estrutura: "React", narrativa: "Análise", superficie: "Reel" },
  Educação: { producao: "Mid-fi", estrutura: "Tela dividida", narrativa: "Problema-Solução", superficie: "Carrossel" },
  Prova: { producao: "Mid-fi", estrutura: "Case", narrativa: "Antes e depois", superficie: "Carrossel" },
  "Quebra de Objeção": { producao: "Mid-fi", estrutura: "Duplo personagem", narrativa: "Polêmica/Contraponto", superficie: "Reel" },
  Diferenciação: { producao: "High-fi", estrutura: "Demonstração", narrativa: "Comparação", superficie: "Reel" },
  Posicionamento: { producao: "High-fi", estrutura: "Talking head", narrativa: "Opinião fundamentada", superficie: "Reel" },
  Desejo: { producao: "High-fi", estrutura: "POV", narrativa: "Transformação", superficie: "Reel" },
  Conversão: { producao: "Mid-fi", estrutura: "Demonstração", narrativa: "Problema-Solução", superficie: "Stories" },
  Venda: { producao: "Mid-fi", estrutura: "Oferta", narrativa: "Problema-Solução", superficie: "Stories" },
  Relacionamento: { producao: "Lo-fi", estrutura: "Vlog", narrativa: "Storytelling", superficie: "Stories" },
  Rapport: { producao: "Lo-fi", estrutura: "Bastidores", narrativa: "Storytelling", superficie: "Stories" },
  Comunidade: { producao: "Lo-fi", estrutura: "UGC", narrativa: "Transformação", superficie: "Stories" },
};

const BY_FUNNEL: Record<FunnelStage, Rec> = {
  topo: { producao: "Lo-fi", estrutura: "POV", narrativa: "Curiosidade", superficie: "Reel" },
  meio: { producao: "Mid-fi", estrutura: "Tutorial", narrativa: "Análise", superficie: "Carrossel" },
  fundo: { producao: "Mid-fi", estrutura: "Demonstração", narrativa: "Problema-Solução", superficie: "Stories" },
};

const PROD_WHY: Record<string, string> = {
  "Lo-fi": "baixa produção aumenta identificação e permite volume",
  "Mid-fi": "produção média equilibra clareza e escala",
  "High-fi": "alta produção reforça percepção de valor e autoridade",
};

/**
 * Recomenda a combinação de formato para uma função estratégica + etapa de funil.
 * Se a ideia já sugere uma superfície, ela é respeitada.
 */
export function recommendFormat(
  funcao: string,
  funil: FunnelStage,
  surfaceHint?: string,
): FormatRecommendation {
  const base = BY_FUNCTION[funcao] ?? BY_FUNNEL[funil];
  const superficie = surfaceHint || base.superficie;
  const justificativa =
    `${funcao} em ${funil} de funil pede ${base.estrutura} + ${base.narrativa}: ` +
    `${PROD_WHY[base.producao]}, e ${superficie} entrega o formato no ritmo certo dessa etapa.`;
  return { ...base, superficie, justificativa };
}
