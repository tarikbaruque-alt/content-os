import type { LlmProvider } from "../../core/llm/provider.js";
import type { Idea, StorySequence, StoryStep, VisualRef } from "../../pipeline/types.js";
import type { VisualRefProvider } from "../../core/integrations/visual-refs.js";
import { SearchLinkVisualProvider } from "../../core/integrations/visual-refs.js";
import { ANTI_AI_VOICE, lc, visualTerms, type CreativeContext } from "../creative/context.js";
import { recommendTriggers } from "../creative/triggers.js";
import { recommendDevices } from "../creative/devices.js";

/**
 * ENREDO — especialista em Sequência de Stories.
 *
 * A função principal é AQUECER a audiência e construir RELACIONAMENTO, com
 * progressão narrativa e emocional (Story 1 → 2 → 3…), nunca Stories isolados.
 * Lógica: Relacionamento → Familiaridade → Confiança → Autoridade → Desejo →
 * Conversão — sem transformar toda sequência em venda.
 *
 * Cada sequência define: objetivo → público → contexto → emoção → percepção
 * desejada → narrativa → fala/texto de cada Story → visual → interação → CTA.
 */

type Beat = { papel: string; fala: (c: CreativeContext, i: Idea) => string; visual: string; interacao: string };
type StoryTypeDef = {
  key: string;
  nome: string;
  objetivo: string;
  emocao: string;
  percepcao: (c: CreativeContext) => string;
  narrativa: string;
  progressao: string[];
  beats: Beat[];
};

const persona = (c: CreativeContext) => c.strategy.persona.replace(/^meu público (são|é)\s*/i, "").trim();

// ---- Interações reutilizáveis (recursos nativos de Stories) ----
const ENQUETE = "Enquete (sim/não) para gerar micro-compromisso.";
const CAIXA = "Caixa de perguntas: convida a audiência a mandar o caso dela.";
const QUIZ = "Quiz de 2 opções para testar a crença.";
const SLIDER = "Slider de emoji para medir identificação.";
const DESLIZE = "\"Desliza pra ver\" — mantém a retenção entre os Stories.";
const RESPOSTA = "Responder DMs/menções para aprofundar 1:1.";
const LINK = "Figurinha de link / \"chama no direct\" (só no fim).";

// ============ Biblioteca de tipos de sequência (16) ============
export const STORY_TYPES: StoryTypeDef[] = [
  {
    key: "bastidores", nome: "Bastidores", objetivo: "Humanizar a marca e gerar familiaridade", emocao: "pertencimento",
    percepcao: (c) => `De marca distante para "${lc(c.diferencial)}, gente como a gente".`,
    narrativa: "Mostrar o processo real por trás da entrega — aproximar antes de vender.",
    progressao: ["Relacionamento", "Familiaridade", "Confiança"],
    beats: [
      { papel: "Atração", fala: (c) => `Vem comigo ver como acontece o que ninguém vê: os bastidores de ${lc(c.diferencial)}.`, visual: "Câmera na mão, cena real do trabalho começando.", interacao: DESLIZE },
      { papel: "Processo", fala: (c) => `Cada detalhe aqui existe por um motivo — é o que garante ${lc(c.desejo)}.`, visual: "Close no processo, mãos trabalhando.", interacao: ENQUETE },
      { papel: "Valores", fala: (c) => `A gente cuida disso porque acredita que ${lc(c.desejo)} não pode ser deixado ao acaso.`, visual: "Rosto humano falando à câmera, tom próximo.", interacao: SLIDER },
      { papel: "Conexão", fala: (_c, i) => `É por isso que a gente faz o que faz. ${i.persona ? "" : ""}Se identifica?`, visual: "Foto/cena que resume a cultura da marca.", interacao: CAIXA },
      { papel: "Fechamento", fala: () => `Amanhã tem mais bastidor. Me segue pra acompanhar de perto.`, visual: "Convite leve, sem venda.", interacao: "Figurinha de \"seguir\"." },
    ],
  },
  {
    key: "rotina", nome: "Rotina", objetivo: "Criar familiaridade pela presença constante", emocao: "proximidade",
    percepcao: (c) => `De "não conheço" para "acompanho a rotina de ${persona(c).split(" ")[0] || "quem entende"}".`,
    narrativa: "Um dia com a marca/profissional — familiaridade que antecede a confiança.",
    progressao: ["Relacionamento", "Familiaridade"],
    beats: [
      { papel: "Abertura", fala: () => `Bom dia! Bora acompanhar um dia real por aqui?`, visual: "Selfie/câmera na mão, luz natural.", interacao: ENQUETE },
      { papel: "Rotina", fala: (c) => `Começo cuidando do que sustenta ${lc(c.diferencial)} — é rotina, não sorte.`, visual: "Sequência rápida de tarefas.", interacao: DESLIZE },
      { papel: "Detalhe humano", fala: () => `Pausa pro café ☕ — conta aí, como tá o seu dia?`, visual: "Momento leve, humaniza.", interacao: CAIXA },
      { papel: "Valor", fala: (c) => `Tudo isso pra que ${lc(c.desejo)} aconteça de verdade.`, visual: "Volta ao trabalho com propósito.", interacao: SLIDER },
      { papel: "Fechamento", fala: () => `Foi o dia de hoje. Me segue pra ver o de amanhã.`, visual: "Encerramento acolhedor.", interacao: "Figurinha de \"seguir\"." },
    ],
  },
  {
    key: "opiniao", nome: "Opinião / Posicionamento", objetivo: "Ocupar um lugar próprio na mente do público", emocao: "inspiração",
    percepcao: (c) => `De "mais um" para "${lc(c.diferencial)}".`,
    narrativa: "Um ponto de vista firme que separa a marca do genérico.",
    progressao: ["Confiança", "Autoridade"],
    beats: [
      { papel: "Provocação", fala: (c) => `Opinião impopular: ${c.objecao ? lc(c.objecao) : "o jeito comum"} está te atrasando.`, visual: "Texto forte na tela, fundo sóbrio.", interacao: QUIZ },
      { papel: "Argumento", fala: (c) => `Explico: enquanto todo mundo foca no óbvio, o que muda o jogo é ${lc(c.diferencial)}.`, visual: "Você falando à câmera, convicção.", interacao: ENQUETE },
      { papel: "Contraponto", fala: (c) => `Não é sobre ${c.objecao ? lc(c.objecao) : "fazer mais"} — é sobre ${lc(c.desejo)}.`, visual: "Antítese visual: dois lados na tela.", interacao: SLIDER },
      { papel: "Convite ao diálogo", fala: () => `Concorda ou discorda? Quero ouvir seu ponto.`, visual: "Tom aberto, convida debate.", interacao: CAIXA },
      { papel: "Fechamento", fala: () => `Se isso fez sentido, compartilha com quem precisa ouvir.`, visual: "Convite a compartilhar.", interacao: "Figurinha de compartilhar." },
    ],
  },
  {
    key: "storytelling_pessoal", nome: "Storytelling pessoal", objetivo: "Conexão profunda pela história por trás", emocao: "identificação",
    percepcao: () => `De marca sem rosto para "eu confio em quem está por trás".`,
    narrativa: "A história pessoal que explica o porquê da marca — vínculo antes de venda.",
    progressao: ["Relacionamento", "Confiança"],
    beats: [
      { papel: "Gancho", fala: () => `Vou te contar algo que quase ninguém sabe sobre como tudo começou.`, visual: "Rosto, luz suave, tom de confidência.", interacao: DESLIZE },
      { papel: "Conflito", fala: (c) => `Teve um momento em que ${lc(c.dor)} era a minha realidade também.`, visual: "Foto antiga / cena simbólica.", interacao: SLIDER },
      { papel: "Virada", fala: (c) => `O que mudou foi descobrir ${lc(c.diferencial)}. Aí nada mais foi igual.`, visual: "Transição visual antes→depois.", interacao: ENQUETE },
      { papel: "Sentido", fala: (c) => `Hoje faço isso pra que você não precise passar por ${lc(c.dor)} sozinho.`, visual: "Olhar para a câmera, propósito.", interacao: CAIXA },
      { papel: "Fechamento", fala: () => `Se você se identificou, me conta sua história também.`, visual: "Convite ao vínculo.", interacao: RESPOSTA },
    ],
  },
  {
    key: "experiencia_propria", nome: "Experiência própria", objetivo: "Autoridade pela vivência real", emocao: "confiança",
    percepcao: (c) => `De "será que entende?" para "${lc(c.diferencial)}, com vivência".`,
    narrativa: "Mostrar que a marca vive o que ensina — prova pela própria experiência.",
    progressao: ["Confiança", "Autoridade"],
    beats: [
      { papel: "Contexto", fala: () => `Deixa eu te mostrar uma coisa que aprendi na prática, não na teoria.`, visual: "Cena real de execução.", interacao: DESLIZE },
      { papel: "Vivência", fala: (c) => `Já passei por ${lc(c.dor)} e testei o que realmente funciona.`, visual: "Registro autêntico do processo.", interacao: ENQUETE },
      { papel: "Aprendizado", fala: (c) => `O que virou meu método: ${lc(c.diferencial)}.`, visual: "Você explicando com propriedade.", interacao: SLIDER },
      { papel: "Aplicação", fala: (c) => `É isso que sustenta ${lc(c.desejo)} — sem achismo.`, visual: "Demonstração concreta.", interacao: CAIXA },
      { papel: "Fechamento", fala: () => `Quer que eu detalhe algum ponto? Manda na caixinha.`, visual: "Abertura ao diálogo.", interacao: RESPOSTA },
    ],
  },
  {
    key: "experiencia_clientes", nome: "Experiência de clientes", objetivo: "Prova social e quebra de objeção", emocao: "segurança",
    percepcao: (c) => `De "${c.objecao ? lc(c.objecao) : "será que funciona?"}" para "com gente real, funciona".`,
    narrativa: "A experiência de quem já viveu — prova que reduz o risco percebido.",
    progressao: ["Confiança", "Desejo"],
    beats: [
      { papel: "Abertura", fala: () => `Olha o que aconteceu com quem confiou no processo (sem inventar nada).`, visual: "Print/registro real, com permissão.", interacao: DESLIZE },
      { papel: "Voz do cliente", fala: (c) => c.voc ? `Nas palavras dela: "${c.voc}".` : `O relato real de quem viveu a entrega.`, visual: "Depoimento em destaque, aspas grandes.", interacao: SLIDER },
      { papel: "Objeção", fala: (c) => `Antes, a dúvida era ${c.objecao ? lc(c.objecao) : "se valeria a pena"}.`, visual: "Contraste antes/depois.", interacao: QUIZ },
      { papel: "Virada", fala: (c) => `Depois, ${lc(c.desejo)} deixou de ser promessa.`, visual: "Resultado real, sem números inventados.", interacao: ENQUETE },
      { papel: "Convite", fala: () => `Tem uma dúvida parecida? Me chama que eu te explico com honestidade.`, visual: "Convite ao diálogo, sem pressão.", interacao: LINK },
    ],
  },
  {
    key: "identificacao", nome: "Identificação", objetivo: "Fazer a persona se reconhecer", emocao: "identificação",
    percepcao: (c) => `De "é só comigo?" para "eles me entendem".`,
    narrativa: "Espelhar o cotidiano da persona até ela pensar 'sou eu'.",
    progressao: ["Relacionamento", "Familiaridade"],
    beats: [
      { papel: "Espelho", fala: (c) => `Se você sente ${lc(c.dor)}, presta atenção nisso.`, visual: "Cena do cotidiano da persona.", interacao: ENQUETE },
      { papel: "Validação", fala: () => `Não é frescura, nem falta de esforço. É mais comum do que parece.`, visual: "Tom acolhedor, olhar para a câmera.", interacao: SLIDER },
      { papel: "Nome à dor", fala: (c) => `Isso tem nome — e reconhecer já é o primeiro passo pra ${lc(c.desejo)}.`, visual: "Texto que nomeia o sentimento.", interacao: QUIZ },
      { papel: "Pertencimento", fala: () => `Você não está sozinho nessa. Aqui é lugar de gente que entende.`, visual: "Comunidade, proximidade.", interacao: CAIXA },
      { papel: "Fechamento", fala: () => `Me segue — amanhã mostro por onde começar.`, visual: "Antecipação leve.", interacao: "Figurinha de \"seguir\"." },
    ],
  },
  {
    key: "perguntas", nome: "Perguntas / Caixinha", objetivo: "Ouvir a audiência e gerar conteúdo real", emocao: "proximidade",
    percepcao: () => `De monólogo para conversa: "eles me escutam".`,
    narrativa: "Abrir a caixinha, ouvir de verdade e responder — relacionamento de mão dupla.",
    progressao: ["Relacionamento", "Confiança"],
    beats: [
      { papel: "Convite", fala: (c) => `Bora conversar? Manda sua maior dúvida sobre ${lc(c.desejo)}.`, visual: "Caixinha em destaque, tom aberto.", interacao: CAIXA },
      { papel: "Escuta", fala: () => `Recebi várias — e todas fazem muito sentido.`, visual: "Prints das perguntas (anonimizadas).", interacao: DESLIZE },
      { papel: "Resposta 1", fala: (c) => `A mais comum foi sobre ${c.objecao ? lc(c.objecao) : "por onde começar"}. Respondo com honestidade.`, visual: "Você respondendo à câmera.", interacao: ENQUETE },
      { papel: "Resposta 2", fala: (c) => `A segunda: como ${lc(c.diferencial)} muda o resultado.`, visual: "Explicação clara, sem jargão.", interacao: SLIDER },
      { papel: "Fechamento", fala: () => `Ficou alguma dúvida? Manda que respondo depois.`, visual: "Continuidade da conversa.", interacao: RESPOSTA },
    ],
  },
  {
    key: "interacao", nome: "Interação / Engajamento", objetivo: "Ativar a audiência e o algoritmo", emocao: "curiosidade",
    percepcao: () => `De audiência passiva para participante ativa.`,
    narrativa: "Uma sequência que convida a tocar, votar e responder — micro-compromissos.",
    progressao: ["Relacionamento", "Familiaridade"],
    beats: [
      { papel: "Gancho", fala: (c) => `Teste rápido: você sabia a real sobre ${lc(c.dor)}?`, visual: "Pergunta grande na tela.", interacao: QUIZ },
      { papel: "Voto", fala: () => `Vota aí antes de eu contar a resposta 👇`, visual: "Enquete chamativa.", interacao: ENQUETE },
      { papel: "Revelação", fala: (c) => `A resposta surpreende: o segredo está em ${lc(c.diferencial)}.`, visual: "Reação, revelação visual.", interacao: SLIDER },
      { papel: "Desafio", fala: () => `Marca alguém que precisa ver isso.`, visual: "Convite a compartilhar.", interacao: "Figurinha de menção." },
      { papel: "Fechamento", fala: () => `Amanhã trago a parte 2. Ativa o \"não perder\".`, visual: "Antecipação.", interacao: "Figurinha de \"seguir\"." },
    ],
  },
  {
    key: "curiosidade", nome: "Curiosidade", objetivo: "Abrir loops e prender a atenção do topo", emocao: "curiosidade",
    percepcao: () => `De indiferença para "preciso saber o resto".`,
    narrativa: "Abrir um loop no Story 1 e só fechar no fim — retenção pura.",
    progressao: ["Relacionamento"],
    beats: [
      { papel: "Loop", fala: (c) => `Tem um detalhe sobre ${lc(c.dor)} que quase ninguém te conta. Desliza.`, visual: "Texto instigante, sem entregar tudo.", interacao: DESLIZE },
      { papel: "Tensão", fala: () => `Antes de revelar: esquece o que você já ouviu por aí.`, visual: "Suspense, ritmo controlado.", interacao: QUIZ },
      { papel: "Pista", fala: (c) => `A chave tem a ver com ${lc(c.diferencial)} — mas não do jeito óbvio.`, visual: "Pista parcial.", interacao: ENQUETE },
      { papel: "Revelação", fala: (c) => `Aqui está: é isso que destrava ${lc(c.desejo)}.`, visual: "Fechamento do loop, alívio.", interacao: SLIDER },
      { papel: "Fechamento", fala: () => `Quer que eu aprofunde? Me diz na caixinha.`, visual: "Ponte para o próximo conteúdo.", interacao: CAIXA },
    ],
  },
  {
    key: "educacao", nome: "Educação", objetivo: "Ensinar e gerar reciprocidade", emocao: "confiança",
    percepcao: (c) => `De "não sabia" para "aprendi com ${lc(c.diferencial)}".`,
    narrativa: "Ensinar algo útil de graça — autoridade que prepara a decisão.",
    progressao: ["Confiança", "Autoridade"],
    beats: [
      { papel: "Promessa", fala: (c) => `Em 4 Stories, você entende ${lc(c.desejo)} melhor que a maioria.`, visual: "Título-aula, tom didático.", interacao: DESLIZE },
      { papel: "Conceito", fala: (c) => `Primeiro: ${lc(c.dor)} quase nunca é o problema real.`, visual: "Explicação visual, um ponto só.", interacao: ENQUETE },
      { papel: "Método", fala: (c) => `O que resolve de verdade é ${lc(c.diferencial)}.`, visual: "Passo destacado.", interacao: QUIZ },
      { papel: "Aplicação", fala: () => `Como aplicar hoje mesmo, sem complicar.`, visual: "Exemplo prático.", interacao: SLIDER },
      { papel: "Fechamento", fala: () => `Salva esses Stories e me segue pra próxima aula.`, visual: "Convite a salvar.", interacao: "Figurinha de \"seguir\"." },
    ],
  },
  {
    key: "autoridade", nome: "Autoridade", objetivo: "Ser visto como referência no tema", emocao: "confiança",
    percepcao: (c) => `De "mais um" para "referência em ${lc(c.diferencial)}".`,
    narrativa: "Uma leitura afiada do tema que só quem domina o assunto faria.",
    progressao: ["Confiança", "Autoridade"],
    beats: [
      { papel: "Tese", fala: (c) => `A maioria erra em ${lc(c.dor)} porque olha para o lugar errado.`, visual: "Afirmação forte, tom seguro.", interacao: QUIZ },
      { papel: "Análise", fala: (c) => `Quem entende sabe: o que importa é ${lc(c.diferencial)}.`, visual: "Você analisando com propriedade.", interacao: ENQUETE },
      { papel: "Nuance", fala: (c) => `E tem um detalhe que muda tudo: ${c.posicionamento || "a coerência entre discurso e prática"}.`, visual: "Ponto fino, diferencia especialista.", interacao: SLIDER },
      { papel: "Prova de raciocínio", fala: (c) => `É por isso que ${lc(c.desejo)} não é sorte — é consequência.`, visual: "Encadeamento lógico.", interacao: CAIXA },
      { papel: "Fechamento", fala: () => `Se isso te fez pensar, me segue pra mais análises assim.`, visual: "Convite qualificado.", interacao: "Figurinha de \"seguir\"." },
    ],
  },
  {
    key: "antecipacao", nome: "Antecipação", objetivo: "Criar expectativa antes de um marco", emocao: "antecipação",
    percepcao: () => `De "não sabia que vinha" para "estou esperando".`,
    narrativa: "Construir expectativa real (sem escassez inventada) rumo a um lançamento/novidade.",
    progressao: ["Familiaridade", "Desejo"],
    beats: [
      { papel: "Teaser", fala: () => `Tem novidade chegando por aqui… e é sobre o que você mais pede.`, visual: "Teaser parcial, mistério.", interacao: DESLIZE },
      { papel: "Pista", fala: (c) => `Uma dica: tem tudo a ver com ${lc(c.desejo)}.`, visual: "Detalhe sem revelar tudo.", interacao: QUIZ },
      { papel: "Contexto", fala: (c) => `Nasceu de tanto ver ${persona(c).split(" ")[0] || "gente"} travar em ${lc(c.dor)}.`, visual: "Bastidor do porquê.", interacao: ENQUETE },
      { papel: "Compromisso", fala: () => `Ativa o \"não perder\" pra ser o primeiro a saber.`, visual: "Chamada para acompanhar.", interacao: "Lembrete/contagem." },
      { papel: "Fechamento", fala: () => `Em breve conto tudo. Fica de olho aqui.`, visual: "Expectativa mantida.", interacao: SLIDER },
    ],
  },
  {
    key: "prova", nome: "Prova", objetivo: "Comprovar a promessa sem inventar", emocao: "segurança",
    percepcao: (c) => `De "será?" para "tem base, dá pra confiar".`,
    narrativa: "Mostrar evidência real (processo, registro, relato) que sustenta a promessa.",
    progressao: ["Confiança", "Desejo"],
    beats: [
      { papel: "Contexto", fala: (c) => `Prometi que ${lc(c.desejo)} é possível. Agora mostro a base — sem inventar número.`, visual: "Tom honesto, registro real.", interacao: DESLIZE },
      { papel: "Evidência", fala: (c) => c.voc ? `Relato real: "${c.voc}".` : `O que a entrega concreta realmente sustenta.`, visual: "Depoimento/registro autêntico.", interacao: SLIDER },
      { papel: "Como", fala: (c) => `Isso acontece por causa de ${lc(c.diferencial)}.`, visual: "Ligação entre prova e método.", interacao: ENQUETE },
      { papel: "Transparência", fala: () => `O que eu não posso garantir também digo — confiança se constrói assim.`, visual: "Honestidade explícita.", interacao: CAIXA },
      { papel: "Fechamento", fala: () => `Quer entender se serve pra você? Me chama.`, visual: "Convite sem pressão.", interacao: LINK },
    ],
  },
  {
    key: "aquecimento", nome: "Aquecimento (pré-venda)", objetivo: "Preparar o desejo antes da oferta", emocao: "desejo",
    percepcao: (c) => `De "não preciso" para "quero ${lc(c.desejo)}".`,
    narrativa: "Elevar o desejo e o problema latente — aquecer sem ainda vender.",
    progressao: ["Confiança", "Desejo"],
    beats: [
      { papel: "Projeção", fala: (c) => `Imagina acordar e ${lc(c.desejo)} já ser a sua realidade.`, visual: "Cena aspiracional coerente com a marca.", interacao: SLIDER },
      { papel: "Custo do problema", fala: (c) => `Enquanto ${lc(c.dor)} continua, esse futuro fica adiado.`, visual: "Contraste com o presente.", interacao: ENQUETE },
      { papel: "Ponte", fala: (c) => `A ponte entre os dois é ${lc(c.diferencial)}.`, visual: "Caminho visual, esperança.", interacao: QUIZ },
      { papel: "Micro-compromisso", fala: () => `Se você quer isso de verdade, responde \"eu quero\".`, visual: "Convite a se comprometer.", interacao: CAIXA },
      { papel: "Fechamento", fala: () => `Amanhã eu mostro o próximo passo. Fica comigo.`, visual: "Antecipação da oferta.", interacao: "Figurinha de \"seguir\"." },
    ],
  },
  {
    key: "conversao", nome: "Conversão", objetivo: "Converter atenção em conversa/venda", emocao: "ambição",
    percepcao: (c) => `De "quero" para "é agora, com quem eu confio".`,
    narrativa: "O único momento em que a sequência convida à ação de forma direta — mas sem pressão falsa.",
    progressao: ["Desejo", "Conversão"],
    beats: [
      { papel: "Recap", fala: (c) => `Você viu que ${lc(c.desejo)} é possível e por quê. Bora ao próximo passo?`, visual: "Recapitulação rápida.", interacao: ENQUETE },
      { papel: "Oferta", fala: (c) => `${c.posicionamento || "A forma de fazer isso com a gente"} — direto e sem enrolação.`, visual: "Clareza sobre o que é oferecido.", interacao: SLIDER },
      { papel: "Quebra de objeção", fala: (c) => `Se a dúvida é ${c.objecao ? lc(c.objecao) : "se vale a pena"}, respondo com honestidade — nada de pressão.`, visual: "Objeção enfrentada de frente.", interacao: QUIZ },
      { papel: "Redução de risco", fala: () => `Qualquer dúvida, me chama antes de decidir. Sem compromisso.`, visual: "Segurança na decisão.", interacao: CAIXA },
      { papel: "CTA", fala: (_c, i) => `${i.cta}. É só tocar aqui 👇`, visual: "CTA claro, link em destaque.", interacao: LINK },
    ],
  },
];

const TYPE_BY_KEY = new Map(STORY_TYPES.map((t) => [t.key, t]));

/** Escolhe o tipo de sequência mais coerente com a função/funil da ideia. */
export function selectStoryType(idea: Idea): StoryTypeDef {
  const byFn: Record<string, string> = {
    Identificação: "identificacao",
    Conscientização: "curiosidade",
    Autoridade: "autoridade",
    Educação: "educacao",
    Relacionamento: "bastidores",
    Posicionamento: "opiniao",
    Diferenciação: "opiniao",
    Prova: "prova",
    "Quebra de Objeção": "experiencia_clientes",
    Desejo: "aquecimento",
    Conversão: "conversao",
  };
  const key = byFn[idea.funcao] ?? (idea.funil === "topo" ? "identificacao" : idea.funil === "fundo" ? "prova" : "bastidores");
  return TYPE_BY_KEY.get(key)!;
}

/** Constrói a sequência de Stories (determinística). */
export async function buildStorySequence(
  idea: Idea,
  ctx: CreativeContext,
  typeKey?: string,
  visual: VisualRefProvider = new SearchLinkVisualProvider(),
): Promise<StorySequence> {
  const def = (typeKey && TYPE_BY_KEY.get(typeKey)) || selectStoryType(idea);
  const stories: StoryStep[] = def.beats.map((b, i) => ({
    n: i + 1,
    papel: b.papel,
    fala: b.fala(ctx, idea),
    visual: b.visual,
    interacao: b.interacao,
  }));
  const refs: VisualRef[] = await visual.refs(visualTerms(ctx, [def.nome, idea.pilar.split(":")[0]!.trim()]));
  const emocaoPor = `A sequência "${def.nome}" trabalha ${def.progressao.join(" → ")}: a emoção "${def.emocao}" é escolhida para ${lc(def.objetivo)} — coerente com persona + Big Message + posicionamento, aquecendo antes de qualquer venda.`;
  return {
    ideaId: idea.id,
    tipo: def.nome,
    objetivo: def.objetivo,
    publico: ctx.strategy.persona,
    contexto: `Jornada ${lc(idea.jornada)} · funil ${idea.funil} · pilar ${idea.pilar.split(":")[0]} · tema ${idea.tema}.`,
    emocao: def.emocao,
    emocaoPor,
    percepcaoDesejada: def.percepcao(ctx),
    narrativa: def.narrativa,
    progressao: def.progressao,
    stories,
    cta: def.key === "conversao" ? idea.cta : "Responder / seguir (relacionamento, sem venda)",
    gatilhos: def.key === "conversao" || idea.funil === "fundo" ? ["Prova", "Redução de risco", "Reciprocidade"] : ["Identificação", "Proximidade", "Curiosidade", "Reciprocidade"],
    gatilhosRec: recommendTriggers(idea, ctx),
    elementosRec: recommendDevices(idea, ctx),
    referencias: refs,
  };
}

/** Lista dos tipos disponíveis (para o painel oferecer escolha). */
export function listStoryTypes(): { key: string; nome: string; objetivo: string }[] {
  return STORY_TYPES.map((t) => ({ key: t.key, nome: t.nome, objetivo: t.objetivo }));
}

// ---------------- Camada LLM (opcional, com fallback) ----------------

const SYSTEM = `Você é Enredo, especialista em SEQUÊNCIAS de Stories no Instagram (pt-BR).
Sua função principal é AQUECER a audiência e construir RELACIONAMENTO com progressão
narrativa (Story 1 → 2 → 3…), não Stories isolados. Lógica: Relacionamento →
Familiaridade → Confiança → Autoridade → Desejo → Conversão, SEM transformar tudo em venda.
REGRAS: nunca invente dados, provas, números, depoimentos, autoridade, urgência ou
escassez; use só o Content DNA. Cada Story tem fala + visual + interação nativa (enquete,
caixinha, quiz, slider).

${ANTI_AI_VOICE}
A "fala" de cada Story deve soar como alguém falando de verdade pra câmera — frase
curta, natural, do jeito que a persona/marca realmente fala (use o tom e o VoC do DNA).

Responda SOMENTE com JSON:
{"tipo":str,"objetivo":str,"contexto":str,"emocao":str,"emocaoPor":str,
 "percepcaoDesejada":str,"narrativa":str,"progressao":[str],
 "stories":[{"papel":str,"fala":str,"visual":str,"interacao":str}],
 "cta":str,"gatilhos":[str]}`;

export function buildStoryPrompt(idea: Idea, ctx: CreativeContext, base: StorySequence): string {
  const v = ctx.view;
  const list = (xs: string[]) => xs.map((x) => `- ${x}`).join("\n") || "- (não informado)";
  return [
    `CONTENT DNA (única fonte de verdade):`,
    `Persona: ${v.persona}`, `Tom: ${v.tom}`,
    `Dores:\n${list(v.dores)}`, `Desejos:\n${list(v.desejos)}`,
    `Objeções:\n${list(v.objecoes)}`, `Diferenciais:\n${list(v.diferenciais)}`,
    `Posicionamento:\n${list(v.posicionamento)}`, `VoC:\n${list(v.voc)}`,
    ``,
    `ESTRATÉGIA: Big Message: ${ctx.strategy.bigMessage} · Percepção: ${ctx.strategy.percepcao}`,
    ``,
    `SEQUÊNCIA: tipo "${base.tipo}" · objetivo ${base.objetivo} · progressão ${base.progressao.join(" → ")}`,
    `Função da peça: ${idea.funcao} (funil ${idea.funil}) · emoção-alvo: ${base.emocao}`,
    `Escreva ${base.stories.length} Stories em progressão real (cada um puxa o próximo).`,
    base.tipo.toLowerCase().includes("convers") ? `Só aqui pode haver CTA de venda direto.` : `NÃO transforme em venda: foco em relacionamento; CTA de conversa/seguir.`,
  ].join("\n");
}

export function parseStoryJson(text: string, base: StorySequence): StorySequence | null {
  const start = text.indexOf("{"), end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  let p: Record<string, unknown>;
  try {
    p = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
  const raw = Array.isArray(p.stories) ? p.stories : [];
  const stories: StoryStep[] = raw
    .map((o, i) => {
      const r = (o ?? {}) as Record<string, unknown>;
      const fala = str(r.fala);
      if (!fala) return null;
      return { n: i + 1, papel: str(r.papel) || `Story ${i + 1}`, fala, visual: str(r.visual) || base.stories[i]?.visual || "", interacao: str(r.interacao) || base.stories[i]?.interacao || "" };
    })
    .filter((x): x is StoryStep => x !== null);
  if (stories.length < 3) return null;
  return {
    ...base,
    tipo: str(p.tipo) || base.tipo,
    objetivo: str(p.objetivo) || base.objetivo,
    contexto: str(p.contexto) || base.contexto,
    emocao: str(p.emocao) || base.emocao,
    emocaoPor: str(p.emocaoPor) || base.emocaoPor,
    percepcaoDesejada: str(p.percepcaoDesejada) || base.percepcaoDesejada,
    narrativa: str(p.narrativa) || base.narrativa,
    progressao: arr(p.progressao) ?? base.progressao,
    stories,
    cta: str(p.cta) || base.cta,
    gatilhos: arr(p.gatilhos) ?? base.gatilhos,
  };
}
const str = (x: unknown): string => (typeof x === "string" ? x.trim() : "");
const arr = (x: unknown): string[] | undefined => {
  if (!Array.isArray(x)) return undefined;
  const o = x.filter((s): s is string => typeof s === "string" && s.trim().length > 0);
  return o.length ? o : undefined;
};

/** Versão com LLM real; cai na determinística em qualquer falha. */
export async function writeStorySequence(
  idea: Idea,
  ctx: CreativeContext,
  llm: LlmProvider,
  typeKey?: string,
  visual: VisualRefProvider = new SearchLinkVisualProvider(),
): Promise<StorySequence> {
  const base = await buildStorySequence(idea, ctx, typeKey, visual);
  if (llm.name === "mock") return base;
  try {
    const res = await llm.generate({ system: SYSTEM, messages: [{ role: "user", content: buildStoryPrompt(idea, ctx, base) }], maxTokens: 2200 });
    return parseStoryJson(res.text, base) ?? base;
  } catch {
    return base;
  }
}
