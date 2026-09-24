import type { FormatRecommendation, FunnelStage } from "./types.js";
import type { NicheProfile } from "./niche-formats.js";

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
  { key: "mito_verdade", nome: "Mito × Verdade", descricao: "Derruba uma crença comum do nicho com a versão correta.", producao: "Lo-fi", superficie: "Reel" },
  { key: "antes_depois", nome: "Antes e Depois", descricao: "Mostra uma transformação real, com autorização e sem prometer resultado.", producao: "Mid-fi", superficie: "Carrossel" },
  { key: "tour", nome: "Tour / Ambiente", descricao: "Apresenta o espaço, o produto ou o lugar como se a pessoa estivesse lá.", producao: "Mid-fi", superficie: "Reel" },
  { key: "checklist", nome: "Checklist / Guia Salvável", descricao: "Lista prática para salvar e consultar depois.", producao: "Mid-fi", superficie: "Carrossel" },
  { key: "provador", nome: "Provador / Look do Dia", descricao: "Veste, combina e mostra o caimento real do produto.", producao: "Lo-fi", superficie: "Reel" },
  { key: "trend", nome: "Trend Adaptada", descricao: "Usa um áudio ou formato em alta, traduzido para o assunto da marca.", producao: "Lo-fi", superficie: "Reel" },
  { key: "live", nome: "Live / Aula Aberta", descricao: "Encontro ao vivo para ensinar, tirar dúvidas e aquecer para a oferta.", producao: "Mid-fi", superficie: "Live" },
];
export const FORMATO_BY_KEY = new Map(FORMATOS.map((f) => [f.key, f]));

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

/**
 * Formatos que servem a cada função, em ordem de preferência (o 1º é o padrão
 * de FN_FORMATO). Com um perfil de nicho, escolhe-se entre estes o que o nicho
 * mais favorece — a função continua mandando, o nicho desempata.
 */
export const FN_ALTERNATIVAS: Record<string, string[]> = {
  Descoberta: ["curiosidade", "trend", "pov", "mito_verdade"],
  Atenção: ["curiosidade", "trend", "pov"],
  Identificação: ["pov", "storytelling", "talking_head"],
  Conscientização: ["analise", "mito_verdade", "talking_head"],
  Educação: ["tutorial", "checklist", "tela_dividida"],
  Autoridade: ["analise", "talking_head", "react", "tela_dividida"],
  Prova: ["case", "antes_depois", "entrevista", "demonstracao"],
  "Experiência Própria": ["bastidores", "vlog", "storytelling"],
  "Experiência Compartilhada": ["entrevista", "case", "storytelling"],
  "Quebra de Objeção": ["duplo_personagem", "resposta_comentario", "talking_head"],
  Diferenciação: ["comparacao", "demonstracao", "bastidores"],
  Consideração: ["comparacao", "checklist", "tour"],
  Desejo: ["demonstracao", "tour", "provador", "antes_depois", "storytelling"],
  Conversão: ["demonstracao", "tour", "live"],
  Relacionamento: ["vlog", "bastidores", "resposta_comentario"],
  Rapport: ["bastidores", "vlog", "pov"],
};

/** Formatos que só fazem sentido quando o perfil do nicho os recomenda. */
const SO_SE_O_NICHO_PEDIR = new Set(["antes_depois", "provador", "tour", "trend", "live"]);

/** Escolhe, entre os formatos da função, o que o nicho mais favorece. */
function pickForNiche(funcao: string, niche?: NicheProfile): { key: string; porque?: string } | undefined {
  const alts = FN_ALTERNATIVAS[funcao];
  if (!alts || !niche) return undefined;
  // Segue a ordem da função (não a do nicho) para manter variedade entre peças:
  // primeiro carro-chefe/apoio do nicho, depois os pontuais.
  const evitar = new Set(niche.evitar.map((e) => e.key).filter(Boolean));
  const picks = new Map(niche.formatos.map((f) => [f.key, f]));
  const pick =
    alts.map((k) => picks.get(k)).find((f) => f && f.papel !== "Pontual") ??
    alts.map((k) => picks.get(k)).find((f) => f && !evitar.has(f.key));
  if (pick) return { key: pick.key, porque: pick.porque };
  // Sem formato do nicho para esta função: o primeiro que não seja arriscado
  // no nicho nem específico de outro nicho.
  const livre = alts.find((k) => !evitar.has(k) && !SO_SE_O_NICHO_PEDIR.has(k));
  return livre ? { key: livre } : undefined;
}

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
 * Se a ideia já sugere uma superfície, ela é respeitada. Com um perfil de
 * nicho, o formato nomeado passa a ser o que o nicho favorece dentre os que
 * servem à função (ver FN_ALTERNATIVAS).
 */
export function recommendFormat(
  funcao: string,
  funil: FunnelStage,
  surfaceHint?: string,
  niche?: NicheProfile,
): FormatRecommendation {
  const base = BY_FUNCTION[funcao] ?? BY_FUNNEL[funil];
  const superficie = surfaceHint || base.superficie;
  const fn = FN_FORMATO[funcao];
  const nichePick = pickForNiche(funcao, niche);
  const key = nichePick?.key ?? fn?.key ?? "talking_head";
  const def = FORMATO_BY_KEY.get(key)!;
  const objetivo = fn ? fn.objetivo : `Servir à função ${funcao} no ${funil} de funil`;
  const doNicho = nichePick?.porque ? ` No nicho ${niche!.nome}: ${nichePick.porque}` : "";
  const justificativa =
    `Formato "${def.nome}" para ${funcao} (${funil}): ${def.descricao} ` +
    `Combina com ${base.estrutura} + ${base.narrativa} — ${PROD_WHY[base.producao]}, e ${superficie} entrega no ritmo certo desta etapa.` +
    doNicho;
  return { formato: def.nome, objetivo, ...base, superficie, justificativa };
}
