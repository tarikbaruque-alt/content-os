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

/**
 * Catálogo de FORMATOS nomeados e realmente utilizáveis (não só Reel/Carrossel/
 * Stories). A IA recomenda um formato por peça, com objetivo e motivo; o usuário
 * pode trocar manualmente.
 */
export type FormatoDef = { key: string; nome: string; descricao: string; producao: string; superficie: string };
export const FORMATOS: FormatoDef[] = [
  { key: "talking_head", nome: "Talking Head", descricao: "Você falando direto para a câmera. Autoridade e clareza.", producao: "Mid-fi", superficie: "Reel" },
  { key: "lofi", nome: "Lo-fi", descricao: "Produção crua e espontânea. Aproxima e permite volume.", producao: "Lo-fi", superficie: "Reel" },
  { key: "midfi", nome: "Mid-fi", descricao: "Produção intermediária. Equilibra clareza e escala.", producao: "Mid-fi", superficie: "Reel" },
  { key: "highfi", nome: "High-fi", descricao: "Produção caprichada. Reforça valor e autoridade.", producao: "High-fi", superficie: "Vídeo" },
  { key: "tela_dividida", nome: "Tela Dividida", descricao: "Dois planos ao mesmo tempo (ex.: você + tela). Ensina e compara.", producao: "Mid-fi", superficie: "Reel" },
  { key: "react", nome: "React", descricao: "Reação/comentário a um conteúdo, print ou tendência.", producao: "Mid-fi", superficie: "Reel" },
  { key: "entrevista", nome: "Entrevista", descricao: "Perguntas e respostas com convidado ou cliente.", producao: "Mid-fi", superficie: "Vídeo" },
  { key: "duplo_personagem", nome: "Duplo Personagem", descricao: "Você interpreta dois lados de um diálogo. Ótimo p/ objeção.", producao: "Lo-fi", superficie: "Reel" },
  { key: "pov", nome: "POV", descricao: "Ponto de vista encenado do cotidiano da persona.", producao: "Lo-fi", superficie: "Reel" },
  { key: "vlog", nome: "Vlog", descricao: "Um dia/rotina em vídeo. Familiaridade e bastidor.", producao: "Lo-fi", superficie: "Stories" },
  { key: "bastidores", nome: "Bastidores", descricao: "O processo por trás da entrega. Humaniza e prova.", producao: "Lo-fi", superficie: "Stories" },
  { key: "tutorial", nome: "Passo a Passo / Tutorial", descricao: "Ensina a fazer algo em etapas. Salvável.", producao: "Mid-fi", superficie: "Carrossel" },
  { key: "storytelling", nome: "Storytelling", descricao: "Uma história com começo, tensão e desfecho.", producao: "Mid-fi", superficie: "Reel" },
  { key: "case", nome: "Case / Estudo de Caso", descricao: "Antes → processo → depois de um caso real (sem inventar).", producao: "Mid-fi", superficie: "Carrossel" },
  { key: "analise", nome: "Análise / Opinião", descricao: "Leitura fundamentada sobre um tema. Autoridade.", producao: "Mid-fi", superficie: "Reel" },
  { key: "curiosidade", nome: "Curiosidade / Quebra de Expectativa", descricao: "Abre um loop e surpreende. Retenção de topo.", producao: "Lo-fi", superficie: "Reel" },
  { key: "demonstracao", nome: "Demonstração", descricao: "Mostra o produto/serviço em ação. Desejo e prova.", producao: "Mid-fi", superficie: "Reel" },
  { key: "comparacao", nome: "Comparação", descricao: "X vs Y para dar clareza pela diferença.", producao: "Mid-fi", superficie: "Carrossel" },
  { key: "resposta_comentario", nome: "Resposta a Comentário", descricao: "Responde uma dúvida/comentário real da audiência.", producao: "Lo-fi", superficie: "Reel" },
  { key: "serie", nome: "Série / Quadro Recorrente", descricao: "Formato que se repete (ex.: “toda terça”). Cria hábito.", producao: "Mid-fi", superficie: "Reel" },
];
const FORMATO_BY_KEY = new Map(FORMATOS.map((f) => [f.key, f]));

// Formato nomeado + objetivo estratégico recomendado por função.
const FN_FORMATO: Record<string, { key: string; objetivo: string }> = {
  Descoberta: { key: "curiosidade", objetivo: "Ganhar atenção qualificada no topo" },
  Atenção: { key: "curiosidade", objetivo: "Parar o scroll e gerar identificação" },
  Identificação: { key: "pov", objetivo: "Fazer a persona se reconhecer" },
  Conscientização: { key: "analise", objetivo: "Quebrar uma crença equivocada" },
  Educação: { key: "tutorial", objetivo: "Ensinar e gerar reciprocidade" },
  Autoridade: { key: "analise", objetivo: "Ser visto como referência no tema" },
  Prova: { key: "case", objetivo: "Comprovar a promessa com evidência real" },
  "Experiência Própria": { key: "bastidores", objetivo: "Autoridade pela vivência real" },
  "Experiência Compartilhada": { key: "entrevista", objetivo: "Prova social e comunidade" },
  "Quebra de Objeção": { key: "duplo_personagem", objetivo: "Enfrentar a objeção de frente" },
  Diferenciação: { key: "comparacao", objetivo: "Tornar o diferencial evidente" },
  Consideração: { key: "comparacao", objetivo: "Ajudar a decidir com critério" },
  Desejo: { key: "demonstracao", objetivo: "Aumentar o desejo pela transformação" },
  Conversão: { key: "demonstracao", objetivo: "Converter atenção em ação" },
  Relacionamento: { key: "vlog", objetivo: "Aproximar e criar vínculo" },
  Rapport: { key: "bastidores", objetivo: "Gerar proximidade antes da venda" },
};

type Rec = Omit<FormatRecommendation, "justificativa" | "formato" | "objetivo">;

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
  const fn = FN_FORMATO[funcao];
  const def = fn ? FORMATO_BY_KEY.get(fn.key)! : FORMATO_BY_KEY.get("talking_head")!;
  const objetivo = fn ? fn.objetivo : `Servir à função ${funcao} no ${funil} de funil`;
  const justificativa =
    `Formato "${def.nome}" para ${funcao} (${funil}): ${def.descricao} ` +
    `Combina com ${base.estrutura} + ${base.narrativa} — ${PROD_WHY[base.producao]}, e ${superficie} entrega no ritmo certo desta etapa.`;
  return { formato: def.nome, objetivo, ...base, superficie, justificativa };
}
