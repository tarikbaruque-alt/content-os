import type { Lead, ObjetivoKey, QualKey } from "./types.js";
import { QUAL_KEYS } from "./types.js";

export const QUAL_LABEL: Record<QualKey, string> = {
  quemProduz: "Quem produz conteúdo hoje",
  frequencia: "Frequência de conteúdo",
  estrutura: "Estrutura atual",
  temSocialMedia: "Tem social media",
  temDesigner: "Tem designer",
  temVideomaker: "Tem videomaker",
  produzInternamente: "Produz internamente",
  principalDificuldade: "Principal dificuldade",
  objetivoInstagram: "Objetivo com o Instagram",
  usaConteudoParaAquisicao: "Usa conteúdo para aquisição",
  investeEmMidia: "Investe em mídia paga",
  ticketNegocio: "Ticket do negócio",
  volumeClientes: "Volume de clientes",
  urgencia: "Urgência",
  orcamento: "Orçamento",
  tomadorDecisao: "Tomador de decisão",
};

export const OBJETIVO_LABEL: Record<ObjetivoKey, string> = {
  gerar_leads: "Gerar leads",
  vender: "Vender",
  aumentar_autoridade: "Aumentar autoridade",
  melhorar_posicionamento: "Melhorar posicionamento",
  construir_marca: "Construir marca",
  aumentar_reconhecimento: "Aumentar reconhecimento",
  atrair_clientes_melhores: "Atrair clientes melhores",
  criar_comunidade: "Criar comunidade",
  profissionalizar_presenca: "Profissionalizar presença digital",
};

type QDef = { padroes: RegExp[]; pergunta: string; finalidade: string; critico: boolean; prioridade: number };

/** Perguntas curtas e naturais. Cada uma existe por um motivo comercial explícito. */
export const QUAL_DEFS: Record<QualKey, QDef> = {
  quemProduz: { padroes: [/(eu|a gente|n[oó]s|minha equipe|nossa equipe|a secret[aá]ria|meu s[oó]cio|um freelancer|uma ag[eê]ncia) (mesm[oa] )?(faz|fazemos|fa[cç]o|produz|produzimos|posta|postamos|cuida|cuidamos)/i],
    pergunta: "Hoje quem cuida dessa parte de conteúdo?", finalidade: "Saber quem executa hoje: define se complementamos, substituímos ou montamos do zero.", critico: true, prioridade: 1 },
  frequencia: { padroes: [/(posto|postamos|publico|publicamos)\b.{0,25}(vez|dia|semana|m[eê]s)/i, /todo dia|toda semana|de vez em quando|quando d[aá]|sem frequ[eê]ncia/i],
    pergunta: "Vocês conseguem manter frequência ou acaba ficando difícil pela rotina?", finalidade: "Confirmar (ou refutar) a hipótese de baixa constância.", critico: false, prioridade: 3 },
  estrutura: { padroes: [/(equipe|estrutura|time) (de )?(marketing|conte[uú]do)/i, /n[aã]o (temos|tenho) (estrutura|equipe)/i],
    pergunta: "Como funciona hoje a estrutura de conteúdo: quem planeja, quem produz e quem publica?", finalidade: "Mapear o fluxo atual para desenhar o que entra e o que fica com eles.", critico: false, prioridade: 4 },
  temSocialMedia: { padroes: [/social media/i, /(tenho|temos) (algu[eé]m|uma pessoa) (que )?(cuida|posta)/i, /n[aã]o (tenho|temos) social/i],
    pergunta: "Vocês têm alguém que cuida das redes hoje, ou já tiveram?", finalidade: "Antecipar a objeção 'já tenho quem poste' / 'já tentei social media'.", critico: false, prioridade: 5 },
  temDesigner: { padroes: [/designer/i, /(quem )?faz as artes/i],
    pergunta: "As artes ficam com quem: um designer, vocês mesmos ou ferramentas prontas?", finalidade: "Saber se o visual tem responsável e qual a qualidade de partida.", critico: false, prioridade: 7 },
  temVideomaker: { padroes: [/videomaker|editor de v[ií]deo|filmmaker/i],
    pergunta: "Para vídeos, vocês contam com alguém que grave e edite?", finalidade: "Definir o formato de vídeo viável e quem executa a gravação.", critico: false, prioridade: 7 },
  produzInternamente: { padroes: [/internamente/i, /(eu|a gente) mesm[oa] (fa[cç]o|fazemos|produzo)/i, /(fazemos|fa[cç]o) (tudo )?(aqui|sozinh[oa])/i],
    pergunta: "Hoje vocês produzem internamente ou alguém ajuda vocês nessa parte?", finalidade: "Identificar se há custo de tempo interno a aliviar (argumento de TEMPO).", critico: false, prioridade: 2 },
  principalDificuldade: { padroes: [/(dificuldade|maior problema|o que (mais )?(pesa|trava)|n[aã]o consigo|falta de)/i],
    pergunta: "Qual é a maior dificuldade hoje com o conteúdo: ideia, tempo, constância ou resultado?", finalidade: "Descobrir a dor real, com as palavras do lead, antes de propor solução.", critico: true, prioridade: 1 },
  objetivoInstagram: { padroes: [/(quero|queremos|meu objetivo|nosso objetivo|a meta|minha meta)\b.{0,50}(cliente|lead|vend|autoridade|marca|seguidor|posicion|agenda|reconhec)/i],
    pergunta: "Existe alguma meta específica que vocês gostariam que o Instagram ajudasse a alcançar?", finalidade: "Fixar o objetivo para ancorar estratégia, valor e critério de sucesso.", critico: true, prioridade: 2 },
  usaConteudoParaAquisicao: { padroes: [/instagram (me )?(traz|gera|d[aá])/i, /(clientes?|pacientes?) (v[eê]m|chegam) (pelo|do) instagram/i, /(s[oó]|somente|apenas) (por |de )?indica[cç][aã]o/i],
    pergunta: "Você sente que o Instagram realmente ajuda a gerar oportunidades comerciais?", finalidade: "Entender o papel do Instagram na aquisição hoje (base do argumento de AQUISIÇÃO).", critico: true, prioridade: 3 },
  investeEmMidia: { padroes: [/an[uú]ncios?|tr[aá]fego pago|impulsion|meta ads|invisto em/i],
    pergunta: "Vocês investem em anúncios hoje?", finalidade: "Medir maturidade e capacidade de investimento (e se há tráfego sem conteúdo à altura).", critico: false, prioridade: 6 },
  ticketNegocio: { padroes: [/ticket/i, /(cada|um) (cliente|paciente|projeto|consulta|pedido) (vale|custa|rende)/i],
    pergunta: "Em média, quanto vale para o negócio conquistar um cliente novo?", finalidade: "Dimensionar o valor de um cliente novo para justificar o investimento (informado por ele).", critico: false, prioridade: 6 },
  volumeClientes: { padroes: [/\d+\s*(clientes?|pacientes?|pedidos?|atendimentos?)\s*(por|ao|\/)\s*(m[eê]s|semana|dia)/i],
    pergunta: "Mais ou menos quantos clientes novos vocês atendem por mês?", finalidade: "Entender a escala e a capacidade de atender mais demanda.", critico: false, prioridade: 6 },
  urgencia: { padroes: [/urgente|logo\b|at[eé] (o )?(m[eê]s|semana|dia)|antes d[eo]|prazo|lan[cç]amento|inaugura/i],
    pergunta: "Existe alguma data ou momento que faz isso ser prioridade agora?", finalidade: "Identificar prazo real (sem criar urgência artificial).", critico: false, prioridade: 5 },
  orcamento: { padroes: [/or[cç]amento|verba|invest(ir|imento)|R\$\s?\d/i],
    pergunta: "Vocês já têm uma faixa de investimento pensada para essa parte?", finalidade: "Alinhar expectativa de investimento antes do pitch.", critico: true, prioridade: 7 },
  tomadorDecisao: { padroes: [/eu decido|decis[aã]o [eé] minha|sou (o |a )?(dono|dona|s[oó]cio|respons[aá]vel)|preciso (falar|conversar) com|meu s[oó]cio (decide|participa)/i],
    pergunta: "Quem participa da decisão de contratar apoio nessa área?", finalidade: "Confirmar se falamos com quem decide e quem mais precisa ser convencido.", critico: true, prioridade: 6 },
};

const OBJ_PATTERNS: Record<ObjetivoKey, RegExp> = {
  gerar_leads: /\bleads?\b|contatos?\b|agendamentos?|clientes novos|novos clientes/i,
  vender: /\bvender\b|\bvendas?\b/i,
  aumentar_autoridade: /autoridade|refer[eê]ncia (na|no|em) |ser reconhecid[oa] como/i,
  melhorar_posicionamento: /posicionamento|me diferenciar|nos diferenciar|diferencia[cç][aã]o/i,
  construir_marca: /construir (a |uma )?marca|marca forte|branding/i,
  aumentar_reconhecimento: /reconhecimento|ser (mais )?conhecid[oa]|visibilidade/i,
  atrair_clientes_melhores: /clientes? (melhores|certos|qualificados|ideais)|p[uú]blico (certo|qualificado)/i,
  criar_comunidade: /comunidade|engajar o p[uú]blico|proximidade com (o )?p[uú]blico/i,
  profissionalizar_presenca: /profissionalizar|mais profissional|organizar o perfil/i,
};

export type QualField = { key: QualKey; rotulo: string; status: "identificado" | "lacuna"; valor?: string; origem?: "informado" | "conversa" };
export type QualReport = {
  campos: QualField[];
  objetivos: { key: ObjetivoKey; rotulo: string; origem: "informado" | "conversa" }[];
  qualificacaoPct: number;
  criticosEmFalta: QualKey[];
  qualificada: boolean;
  proximasPerguntas: { campo: QualKey; pergunta: string; finalidade: string }[];
  estruturaAtual: string[];
};

const snip = (s: string, n = 140) => (s.replace(/\s+/g, " ").trim().length <= n ? s.replace(/\s+/g, " ").trim() : `${s.replace(/\s+/g, " ").trim().slice(0, n - 1)}…`);

/**
 * Agente de qualificação: só considera o que o LEAD escreveu e o que VOCÊ
 * registrou como resposta dele. Nada é presumido.
 */
export function analyzeQualification(lead: Lead): QualReport {
  const texts = lead.conversa.filter((m) => m.autor === "lead").map((m) => m.texto);
  const campos: QualField[] = QUAL_KEYS.map((key) => {
    const manual = lead.qual[key]?.trim();
    if (manual) return { key, rotulo: QUAL_LABEL[key], status: "identificado", valor: snip(manual), origem: "informado" as const };
    const hit = texts.find((t) => QUAL_DEFS[key].padroes.some((re) => re.test(t)));
    return hit
      ? { key, rotulo: QUAL_LABEL[key], status: "identificado" as const, valor: snip(hit), origem: "conversa" as const }
      : { key, rotulo: QUAL_LABEL[key], status: "lacuna" as const };
  });

  const objetivos: QualReport["objetivos"] = [];
  const seen = new Set<ObjetivoKey>();
  for (const k of lead.objetivos) { seen.add(k); objetivos.push({ key: k, rotulo: OBJETIVO_LABEL[k], origem: "informado" }); }
  for (const [k, re] of Object.entries(OBJ_PATTERNS) as [ObjetivoKey, RegExp][]) {
    if (!seen.has(k) && texts.some((t) => re.test(t))) { seen.add(k); objetivos.push({ key: k, rotulo: OBJETIVO_LABEL[k], origem: "conversa" }); }
  }

  const criticos = QUAL_KEYS.filter((k) => QUAL_DEFS[k].critico);
  const emFalta = criticos.filter((k) => campos.find((c) => c.key === k)?.status === "lacuna");
  const hasObj = objetivos.length > 0;
  const criticosEmFalta = hasObj ? emFalta.filter((k) => k !== "objetivoInstagram") : emFalta;
  const identificados = campos.filter((c) => c.status === "identificado").length + (hasObj && campos.find((c) => c.key === "objetivoInstagram")?.status === "lacuna" ? 1 : 0);

  const proximasPerguntas = campos
    .filter((c) => c.status === "lacuna" && !(c.key === "objetivoInstagram" && hasObj))
    .sort((a, b) => QUAL_DEFS[a.key].prioridade - QUAL_DEFS[b.key].prioridade)
    .slice(0, 5)
    .map((c) => ({ campo: c.key, pergunta: QUAL_DEFS[c.key].pergunta, finalidade: QUAL_DEFS[c.key].finalidade }));

  const estrutura = campos.filter((c) => ["quemProduz", "frequencia", "estrutura", "temSocialMedia", "temDesigner", "temVideomaker", "produzInternamente"].includes(c.key) && c.status === "identificado");

  return {
    campos, objetivos,
    qualificacaoPct: Math.round((identificados / QUAL_KEYS.length) * 100),
    criticosEmFalta, qualificada: criticosEmFalta.length === 0,
    proximasPerguntas,
    estruturaAtual: estrutura.map((c) => `${c.rotulo}: ${c.valor}`),
  };
}
