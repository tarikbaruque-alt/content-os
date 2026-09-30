import type { Lead, Operacao } from "./types.js";
import type { RaioX, GargaloHit } from "./raiox.js";
import type { QualReport } from "./qualification.js";
import { validateOutbound } from "./guardrails.js";
import { ensureEnd, firstName } from "./context.js";

/** Perguntas de abertura para gerar conversa (nunca vender). */
export const OPENING_QUESTIONS = [
  "Hoje vocês produzem internamente ou alguém ajuda vocês nessa parte?",
  "Hoje existe alguma estratégia por trás dos conteúdos ou vocês vão produzindo conforme aparecem ideias?",
  "Você sente que o Instagram realmente ajuda a gerar oportunidades comerciais?",
  "Hoje quem cuida dessa parte de conteúdo?",
  "Vocês conseguem manter frequência ou acaba ficando difícil pela rotina?",
  "Existe alguma meta específica que vocês gostariam que o Instagram ajudasse a alcançar?",
];

type Piece = { observacao: string | null; oportunidade: string; base: string };

const P = (lead: Lead) => ({ nome: lead.profile.nome, tema: lead.profile.temaDominado?.trim() });

/** Cada peça só usa um FATO já registrado (avaliação, contagem, nota ou tema informado). */
const PIECES: Record<string, (lead: Lead, h: GargaloHit) => Piece> = {
  autoridade_nao_convertida: (l, h) => ({ observacao: P(l).tema ? `Percebi que você domina ${P(l).tema}.` : null, oportunidade: "Talvez exista uma oportunidade de transformar mais desse conhecimento em conteúdo.", base: h.evidencias[0] ?? "tema dominado informado" }),
  sem_estrategia: (l, h) => ({ observacao: `Vi que o perfil de ${P(l).nome} publica com regularidade.`, oportunidade: "Talvez exista espaço para deixar mais claro o objetivo por trás de cada conteúdo.", base: h.evidencias[0] ?? "" }),
  baixa_frequencia: (l, h) => ({ observacao: `Notei que o perfil de ${P(l).nome} tem publicado pouco nos últimos tempos.`, oportunidade: "Uma rotina mais previsível talvez ajudasse a manter o negócio na lembrança de quem acompanha.", base: h.evidencias[0] ?? "" }),
  pouco_comercial: (l, h) => ({ observacao: `Notei que o conteúdo de ${P(l).nome} informa bem, mas tem poucos convites claros para uma conversa.`, oportunidade: "Talvez haja espaço para conduzir melhor quem se interessa até o contato.", base: h.evidencias[0] ?? "" }),
  estetica_sem_valor: (l, h) => ({ observacao: `O perfil de ${P(l).nome} tem uma apresentação visual bem cuidada.`, oportunidade: "Talvez haja espaço para comunicar com mais clareza o valor do que vocês oferecem.", base: h.evidencias[0] ?? "" }),
  oferta_sem_desejo: (l, h) => ({ observacao: `O perfil de ${P(l).nome} apresenta com clareza o que oferece.`, oportunidade: "Talvez exista uma oportunidade de mostrar também o que muda para o cliente depois de trabalhar com vocês.", base: h.evidencias[0] ?? "" }),
  sem_prova_social: (l, h) => ({ observacao: `Notei que o perfil de ${P(l).nome} mostra pouco relatos e resultados de clientes.`, oportunidade: "Esses relatos, quando autorizados, podem ajudar bastante quem está decidindo.", base: h.evidencias[0] ?? "" }),
  bio_fraca: (l, h) => ({ observacao: `Olhando a bio de ${P(l).nome}, ela não deixa tão claro qual é o próximo passo para quem chega.`, oportunidade: "Um ajuste ali talvez ajude quem chega a entender o que fazer em seguida.", base: h.evidencias[0] ?? "" }),
  sem_humanizacao: (l, h) => ({ observacao: `Notei que o perfil de ${P(l).nome} mostra pouco as pessoas por trás do trabalho.`, oportunidade: "Talvez haja espaço para aproximar o público mostrando mais dessa parte.", base: h.evidencias[0] ?? "" }),
  reels_baixo: (l, h) => ({ observacao: `Notei que o perfil de ${P(l).nome} usa pouco Reels.`, oportunidade: "Talvez seja uma boa porta para o seu conhecimento chegar a quem ainda não conhece o trabalho.", base: h.evidencias[0] ?? "" }),
  stories_sem_estrategia: (l, h) => ({ observacao: `Notei que os Stories de ${P(l).nome} aparecem pouco.`, oportunidade: "Talvez exista espaço para usá-los de forma mais intencional com quem já acompanha.", base: h.evidencias[0] ?? "" }),
  carrossel_baixo: (l, h) => ({ observacao: `Notei que o perfil de ${P(l).nome} tem poucos carrosséis.`, oportunidade: "Talvez seja um bom formato para explicar com mais profundidade o que vocês sabem.", base: h.evidencias[0] ?? "" }),
  baixo_alcance: (l, h) => ({ observacao: `Notei que o conteúdo de ${P(l).nome} parece voltado mais a quem já conhece o negócio.`, oportunidade: "Talvez exista espaço para conteúdos pensados para quem ainda não conhece.", base: h.evidencias[0] ?? "" }),
  sem_posicionamento: (l, h) => ({ observacao: `Olhando o perfil de ${P(l).nome}, ainda não ficou totalmente claro para mim o que o diferencia.`, oportunidade: "Talvez haja uma oportunidade de deixar isso mais evidente para quem chega.", base: h.evidencias[0] ?? "" }),
  qualidade_baixa: (l, h) => ({ observacao: `Notei que a apresentação do perfil de ${P(l).nome} varia de um conteúdo para outro.`, oportunidade: "Talvez valha padronizar para que o perfil comunique o nível do serviço.", base: h.evidencias[0] ?? "" }),
  cabecalho_fraco: (l, h) => ({ observacao: `Olhando o topo do perfil de ${P(l).nome}, algumas partes podem não estar ajudando quem chega a entender o que fazer.`, oportunidade: "Pequenos ajustes ali talvez ajudem quem chega a seguir ou chamar.", base: h.evidencias[0] ?? "" }),
  pouco_encontravel: (l, h) => ({ observacao: `Notei que o nome do perfil de ${P(l).nome} não traz um termo de busca ligado à especialidade.`, oportunidade: "Talvez um ajuste ali facilite ser encontrado por quem procura o serviço.", base: h.evidencias[0] ?? "" }),
  institucional: (l, h) => ({ observacao: `Notei que boa parte dos posts de ${P(l).nome} fala da própria empresa.`, oportunidade: "Talvez haja espaço para equilibrar com conteúdos que resolvem dúvidas de quem ainda não conhece.", base: h.evidencias[0] ?? "" }),
  dependencia_indicacao: (l, h) => ({ observacao: `Você comentou que os clientes chegam principalmente por indicação.`, oportunidade: "Talvez o Instagram possa ser a vitrine em que quem foi indicado confere quem você é.", base: h.evidencias[0] ?? "" }),
};

export type Approach = {
  recusada?: false;
  modo: "gargalo" | "curiosidade";
  motivoReal: string;
  observacaoUsada: { texto: string; base: string };
  gargaloId: string | null;
  variantes: { rotulo: string; canal: "mensagem_curta" | "email"; assunto?: string; texto: string }[];
  perguntasAlternativas: string[];
  proximaSeResponder: string | null;
  avisos: string[];
};
export type ApproachRefusal = { recusada: true; motivo: string; proximoPasso: string };
export const isRefusal = (a: Approach | ApproachRefusal): a is ApproachRefusal => a.recusada === true;

/**
 * PRIMEIRA MENSAGEM — não vende gestão de redes sociais: gera conversa.
 * OBSERVAÇÃO REAL DO PERFIL + OPORTUNIDADE + PERGUNTA.
 * Sem um fato registrado para citar, RECUSA (não há motivo legítimo de contato).
 */
export function buildApproach(lead: Lead, raiox: RaioX, qual: QualReport, op: Operacao, opts: { gargaloId?: string } = {}): Approach | ApproachRefusal {
  const hits = raiox.gargalos;
  const chosen = (opts.gargaloId ? hits.find((h) => h.def.id === opts.gargaloId) : undefined) ?? hits.find((h) => PIECES[h.def.id]?.(lead, h).observacao) ;
  const nome = firstName(lead);
  const oi = nome ? `Oi, ${nome}!` : "Olá!";
  const tema = lead.profile.temaDominado?.trim();

  let piece: Piece | null = null;
  let pergunta = "";
  let gargaloId: string | null = null;
  let modo: Approach["modo"] = "gargalo";

  if (chosen) {
    piece = PIECES[chosen.def.id]!(lead, chosen);
    pergunta = chosen.def.pergunta;
    gargaloId = chosen.def.id;
  } else if (tema) {
    modo = "curiosidade";
    piece = { observacao: `Percebi que você domina ${tema}.`, oportunidade: "Fiquei curioso sobre como esse conhecimento aparece nos seus conteúdos.", base: "tema dominado informado por você" };
    pergunta = OPENING_QUESTIONS[3]!;
  }
  if (!piece?.observacao) {
    return {
      recusada: true,
      motivo: "Não há observação real registrada (com base nos dados do Raio-X) que sirva de motivo legítimo para o contato.",
      proximoPasso: "Preencha mais dimensões do Raio-X ou o campo 'tema que o perfil domina' e gere de novo. Sem um fato para citar, a mensagem viraria elogio genérico.",
    };
  }

  const obs = ensureEnd(piece.observacao);
  const opo = ensureEnd(piece.oportunidade);
  const A = `${oi} ${obs} ${opo} ${pergunta}`;
  const B = `${oi} ${obs} ${pergunta}`;
  const C = `${oi}\n\n${obs} ${opo}\n\n${pergunta}\n\nSe preferir, posso te mandar um pouco do que observei no perfil — sem pressa.`;
  const variantes: Approach["variantes"] = [
    { rotulo: "Direta (observação + oportunidade + pergunta)", canal: "mensagem_curta", texto: A },
    { rotulo: "Curta (observação + pergunta)", canal: "mensagem_curta", texto: B },
    { rotulo: "E-mail / mensagem longa", canal: "email", assunto: `Uma observação sobre o perfil de ${lead.profile.nome}`, texto: C },
  ];

  const avisos: string[] = [op.assinatura ? `Assinatura sugerida ao final: ${op.assinatura}` : "Ajuste ao seu estilo; sem elogios genéricos nem promessas. A 1ª mensagem gera conversa, não vende."];
  const allowed = [piece.observacao, ...lead.profile.notas.map((n) => n.texto), lead.profile.nome, lead.profile.bio ?? ""];
  for (const v of variantes) {
    const viol = validateOutbound(v.texto, op, { primeiraMensagem: true, extraAllowed: allowed });
    if (viol.length) avisos.push(`${v.rotulo}: ${viol.join("; ")}`);
    if (v.canal === "mensagem_curta" && v.texto.length > 430) avisos.push(`${v.rotulo}: ${v.texto.length} caracteres — encurte.`);
  }
  if (modo === "curiosidade") avisos.push("Sem gargalo identificado: mensagem de curiosidade, baseada só no tema que o perfil domina.");
  if (raiox.confianca === "baixa") avisos.push("Poucas dimensões avaliadas: confirme a observação olhando o perfil antes de enviar.");

  return {
    modo, gargaloId,
    motivoReal: `${piece.observacao}${piece.base ? ` (base: ${piece.base})` : ""}`,
    observacaoUsada: { texto: piece.observacao, base: piece.base || "dados do Raio-X" },
    variantes,
    perguntasAlternativas: OPENING_QUESTIONS.filter((q) => q !== pergunta),
    proximaSeResponder: qual.proximasPerguntas[0]?.pergunta ?? null,
    avisos,
  };
}
