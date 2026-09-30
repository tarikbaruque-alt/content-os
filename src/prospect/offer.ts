import type { ArgKey, Claim, Lead, Operacao, ServiceKey } from "./types.js";
import { ARGUMENTS } from "./catalog-arguments.js";
import { SERVICE_BY_KEY } from "./catalog-services.js";
import type { RaioX } from "./raiox.js";
import type { QualReport } from "./qualification.js";
import { nicheOf, serviceActive, ticketOf, fmtBRL, cap } from "./context.js";

// ---------------------------------------------------------------- argumentos
export type PickedArgument = { key: ArgKey; rotulo: string; tese: string; comoUsar: string; frases: string[]; motivo: string; score: number };

/** Escolhe argumentos conforme o problema REAL do prospect (gargalos observados + objetivos). */
export function pickArguments(raiox: RaioX, lead: Lead, qual: QualReport, n = 4): PickedArgument[] {
  const objs = new Set<string>(qual.objetivos.map((o) => o.key));
  const scored = ARGUMENTS.map((a) => {
    let score = 0;
    const why: string[] = [];
    for (const h of raiox.gargalos) {
      if (h.def.argumentos.includes(a.key)) { score += h.def.peso * 2; why.push(h.def.titulo); }
      else if (a.gargalos.includes(h.def.id)) { score += h.def.peso; why.push(h.def.titulo); }
    }
    for (const o of a.objetivos) if (objs.has(o)) { score += 2; why.push(`objetivo: ${o.replace(/_/g, " ")}`); }
    if (a.key === "tempo" && /interna|sozinh|mesm[oa]/i.test(Object.values(lead.qual).join(" "))) { score += 3; why.push("produz internamente"); }
    return { key: a.key, rotulo: a.rotulo, tese: a.tese, comoUsar: a.comoUsar, frases: a.frases, motivo: [...new Set(why)].slice(0, 2).join(" · ") || "sem sinal específico", score };
  });
  return scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, n);
}

// ------------------------------------------------------------- oferta recorrente
export type Indicacao = "sim" | "talvez" | "nao_evidenciado";
export type OfferPlan = {
  potencialRecorrente: "alto" | "medio" | "baixo" | "indefinido";
  motivoPotencial: string;
  contratoRecorrente: { key: ServiceKey; nome: string; frase: string; ticket: string | null };
  escada: { etapa: string; descricao: string; servicos: string[] }[];
  quandoOferecer: { key: ServiceKey; nome: string; indicado: Indicacao; motivo: string; ofertado: boolean; ticket: string | null }[];
};

const RECURRING_CORE = ["baixa_frequencia", "sem_estrategia", "autoridade_nao_convertida", "pouco_comercial", "institucional"];
const SUPPORT: Record<string, string[]> = {
  gestao_mensal_conteudo: RECURRING_CORE,
  planejamento_conteudo: ["sem_estrategia", "baixa_frequencia", "institucional"],
  estrategia_conteudo: ["sem_estrategia", "sem_posicionamento", "pouco_comercial", "dependencia_indicacao", "institucional", "baixo_alcance"],
  calendario_editorial: ["baixa_frequencia", "sem_estrategia"],
  copywriting: ["bio_fraca", "pouco_comercial", "oferta_sem_desejo", "estetica_sem_valor", "cabecalho_fraco"],
  roteiros_video: ["autoridade_nao_convertida", "reels_baixo", "sem_humanizacao", "baixo_alcance"],
  criacao_conteudo: ["qualidade_baixa", "baixa_frequencia", "autoridade_nao_convertida", "sem_prova_social"],
};

const fmtTicket = (op: Operacao, key: ServiceKey): string | null => {
  const t = ticketOf(op, key);
  return t ? `${fmtBRL(t.min)}–${fmtBRL(t.max)}${t.recorrente ? "/mês" : ""}` : null;
};

/**
 * Prioriza CONTRATOS MENSAIS. Nunca inventa valor: o ticket só aparece se você
 * o cadastrou. "Quando oferecer" mostra o que os sinais sustentam — como hipótese.
 */
export function recommendOffer(lead: Lead, raiox: RaioX, qual: QualReport, op: Operacao): OfferPlan {
  const ids = new Set(raiox.gargalos.map((h) => h.def.id));
  const core = RECURRING_CORE.filter((id) => ids.has(id));
  const potencial: OfferPlan["potencialRecorrente"] =
    raiox.avaliadas < 6 ? "indefinido" : raiox.gargalos.length >= 3 && core.length >= 1 ? "alto" : raiox.gargalos.length >= 1 ? "medio" : "baixo";
  const motivo =
    potencial === "indefinido" ? "Poucas dimensões avaliadas: complete o Raio-X para estimar o potencial."
    : potencial === "alto" ? `Vários gargalos de continuidade/estratégia (${core.length}) sugerem trabalho contínuo, e não um projeto pontual.`
    : potencial === "medio" ? "Há oportunidades, mas com menos sinais de necessidade contínua — vale validar na conversa."
    : "Sem gargalos evidentes nos dados informados.";

  const indic = (key: string): { i: Indicacao; motivo: string } => {
    const ss = SUPPORT[key] ?? [];
    const hit = ss.filter((s) => ids.has(s));
    if (key === "gestao_mensal_conteudo" && potencial === "alto") return { i: "sim", motivo: `Contrato recorrente é a prioridade: ${hit.length} gargalo(s) de continuidade/estratégia.` };
    if (hit.length >= 2) return { i: "sim", motivo: `Sustentado por ${hit.length} gargalos (hipóteses): ${hit.map((h) => raiox.gargalos.find((g) => g.def.id === h)!.def.titulo.replace(/\.$/, "")).slice(0, 2).join("; ")}.` };
    if (hit.length === 1) return { i: "talvez", motivo: `Um indício: ${raiox.gargalos.find((g) => g.def.id === hit[0])!.def.titulo.replace(/\.$/, "")}.` };
    return { i: "nao_evidenciado", motivo: "Sem sinal nos dados informados." };
  };

  const items: { key: ServiceKey }[] = [
    { key: "gestao_mensal_conteudo" }, { key: "planejamento_conteudo" }, { key: "estrategia_conteudo" }, { key: "calendario_editorial" },
    { key: "copywriting" }, { key: "roteiros_video" }, { key: "criacao_conteudo" }, { key: "analise_metricas" }, { key: "otimizacao_mensal" },
  ];
  const anyRecurring = items.slice(0, 7).some((x) => indic(x.key).i !== "nao_evidenciado");
  const quandoOferecer = items.map(({ key }) => {
    const svc = SERVICE_BY_KEY[key];
    const r = key === "analise_metricas" || key === "otimizacao_mensal"
      ? { i: (anyRecurring ? "talvez" : "nao_evidenciado") as Indicacao, motivo: anyRecurring ? "Entra depois do primeiro ciclo, para medir o que funcionou e ajustar." : "Depende de haver um trabalho contínuo em andamento." }
      : indic(key);
    return { key, nome: svc.nome, indicado: r.i, motivo: r.motivo, ofertado: serviceActive(op, key), ticket: fmtTicket(op, key) };
  });

  const topEntry = raiox.gargalos.flatMap((h) => h.def.servicos).filter((k, i, a) => a.indexOf(k) === i).map((k) => SERVICE_BY_KEY[k]).filter((s) => s.papel === "entrada" && serviceActive(op, s.key)).slice(0, 2);
  const expansao = raiox.gargalos.flatMap((h) => h.def.servicos).filter((k, i, a) => a.indexOf(k) === i).map((k) => SERVICE_BY_KEY[k]).filter((s) => s.papel === "expansao" && serviceActive(op, s.key)).slice(0, 3);
  const rec = SERVICE_BY_KEY.gestao_mensal_conteudo;

  return {
    potencialRecorrente: potencial, motivoPotencial: motivo,
    contratoRecorrente: { key: rec.key, nome: rec.nome, frase: rec.frase, ticket: fmtTicket(op, rec.key) },
    escada: [
      { etapa: "1 · Percepção de valor", descricao: "Mini auditoria de conteúdo, curta e visual, para mostrar o que foi observado antes de qualquer proposta.", servicos: ["Mini auditoria de conteúdo"] },
      { etapa: "2 · Porta de entrada", descricao: "Um começo de baixo atrito que gera clareza e prepara a continuidade.", servicos: topEntry.length ? topEntry.map((s) => s.nome) : [SERVICE_BY_KEY.estrategia_conteudo.nome] },
      { etapa: "3 · Contrato recorrente (prioridade)", descricao: "Operação mensal contínua: planejar, criar, publicar, medir e ajustar.", servicos: [rec.nome] },
      { etapa: "4 · Expansão", descricao: "Serviços que aprofundam o resultado quando o ciclo estiver rodando.", servicos: expansao.length ? expansao.map((s) => s.nome) : ["Análise de métricas", "Otimização mensal"] },
    ],
    quandoOferecer,
  };
}

// --------------------------------------------------------- por que precisaria de nós
export type WhyUs = {
  semBase: boolean;
  confianca: RaioX["confianca"];
  oportunidade: Claim | null;
  possivelProblema: Claim | null;
  oQueMelhorar: string[];
  servicoPrincipal: { key: ServiceKey; nome: string; motivo: string; frase: string } | null;
  servicosComplementares: string[];
  resultadoEstrategico: string | null;
  argumentoComercial: { rotulo: string; frase: string } | null;
  perguntaPrimeiro: string;
  contratoRecorrente: string;
  avisos: string[];
};

/** POR QUE ESTE PROSPECT PRECISARIA DE NÓS? — só com base nos dados disponíveis; sem base, diz que não sabe. */
export function whyUs(lead: Lead, raiox: RaioX, qual: QualReport, op: Operacao): WhyUs {
  const top = raiox.gargalos[0];
  const fallbackQ = qual.proximasPerguntas[0]?.pergunta ?? "Hoje quem cuida dessa parte de conteúdo?";
  if (!top) {
    return {
      semBase: true, confianca: raiox.confianca, oportunidade: null, possivelProblema: null, oQueMelhorar: [],
      servicoPrincipal: null, servicosComplementares: [], resultadoEstrategico: null, argumentoComercial: null,
      perguntaPrimeiro: fallbackQ, contratoRecorrente: "Sem base ainda para indicar um contrato.",
      avisos: [raiox.avaliadas < 6 ? "Ainda não há base para dizer por que este prospect precisaria de nós: avalie mais dimensões no Raio-X." : "Nenhum gargalo foi identificado nos dados informados: pode ser um perfil bem resolvido — vale investigar com perguntas antes de abordar."],
    };
  }
  const ev = top.evidencias.slice(0, 2).join(" | ");
  // 1º serviço ATIVO que responde ao gargalo mais forte; se nenhum, tenta os gargalos seguintes.
  let escolhido: { hit: (typeof raiox.gargalos)[number]; key: ServiceKey } | null = null;
  for (const h of raiox.gargalos) {
    const k = h.def.servicos.find((x) => serviceActive(op, x));
    if (k) { escolhido = { hit: h, key: k }; break; }
  }
  const svc = escolhido ? SERVICE_BY_KEY[escolhido.key] : null;
  const args = pickArguments(raiox, lead, qual, 1)[0];
  const compl = raiox.gargalos.slice(0, 4).flatMap((h) => h.def.servicos).filter((k, i, a) => a.indexOf(k) === i && k !== escolhido?.key && serviceActive(op, k)).slice(0, 3).map((k) => SERVICE_BY_KEY[k].nome);
  const avisos: string[] = [];
  if (raiox.confianca === "baixa") avisos.push("Confiança baixa: poucas dimensões avaliadas. Trate tudo abaixo como hipótese a validar.");
  if (!svc) avisos.push("Todos os serviços que respondem aos gargalos encontrados estão desativados em 'Minha operação': ative algum para receber uma recomendação.");
  else if (escolhido && escolhido.hit !== top) avisos.push(`Os serviços que respondem ao gargalo mais forte estão desativados; a recomendação usa outro gargalo (${escolhido.hit.def.titulo.replace(/\.$/, "")}).`);

  return {
    semBase: false, confianca: raiox.confianca,
    oportunidade: { texto: cap(top.def.oportunidade) + ".", certeza: "HIPOTESE", evidencia: ev },
    possivelProblema: { texto: `${cap(top.def.titulo.replace(/\.$/, ""))} — ${top.def.impacto}.`, certeza: top.certeza, evidencia: ev },
    oQueMelhorar: raiox.gargalos.slice(0, 3).map((h) => cap(h.def.melhoria) + "."),
    servicoPrincipal: svc && escolhido ? { key: svc.key, nome: svc.nome, motivo: `Responde a um gargalo observado (${escolhido.hit.def.titulo.replace(/\.$/, "")}).`, frase: svc.frase } : null,
    servicosComplementares: compl,
    resultadoEstrategico: svc ? `${cap(svc.beneficio)} → ${svc.impacto} → ${svc.valorComercial}.` : null,
    argumentoComercial: args ? { rotulo: args.rotulo, frase: args.frases[0]! } : null,
    perguntaPrimeiro: top.def.pergunta,
    contratoRecorrente: `Transformar em ${SERVICE_BY_KEY.gestao_mensal_conteudo.nome.toLowerCase()} depois da porta de entrada.`,
    avisos,
  };
}

// ------------------------------------------------------------------ pontuação
export type ScoreLevel = "forte" | "regular" | "fraca" | "ausente" | "desconhecido";
export type LeadScore = {
  prioridade: "ALTA" | "MEDIA" | "BAIXA" | "INDEFINIDA";
  pontuacao: number;
  criterios: { criterio: string; nivel: ScoreLevel; peso: number; evidencia: string }[];
  avisos: string[];
};
const FACTOR: Record<ScoreLevel, number> = { forte: 1, regular: 0.6, fraca: 0.25, ausente: 0, desconhecido: 0.4 };

/** Prioridade do prospect pelos 6 critérios que você definiu. Desconhecido nunca vira "bom": pesa pouco e é sinalizado. */
export function scoreLead(lead: Lead, raiox: RaioX, qual: QualReport, op: Operacao): LeadScore {
  const p = lead.profile;
  const crit: LeadScore["criterios"] = [];
  const nota = (n?: { nota: string; obs?: string }): { nivel: ScoreLevel; ev: string } =>
    n && n.nota !== "nao_avaliado" ? { nivel: n.nota as ScoreLevel, ev: n.obs ? `"${n.obs}"` : "avaliação informada" } : { nivel: "desconhecido", ev: "não informado" };

  const neg = nota(p.negocio);
  crit.push({ criterio: "Tem um bom negócio", nivel: neg.nivel, peso: 20, evidencia: neg.ev });

  const cap0 = nota(p.capacidade);
  let capNivel = cap0.nivel; let capEv = cap0.ev;
  if (capNivel === "desconhecido") {
    const inv = qual.campos.find((c) => c.key === "investeEmMidia" && c.status === "identificado");
    const orc = qual.campos.find((c) => c.key === "orcamento" && c.status === "identificado");
    if (inv || orc) { capNivel = "regular"; capEv = `citado na conversa: ${(orc ?? inv)!.valor}`; }
  }
  crit.push({ criterio: "Capacidade de investimento", nivel: capNivel, peso: 25, evidencia: capEv });

  const niche = nicheOf(lead, op);
  const dep = niche ? (niche.dependeDe.length >= 2 ? "forte" : niche.dependeDe.length === 1 ? "regular" : "fraca") : "desconhecido";
  crit.push({ criterio: "Depende de imagem, autoridade ou aquisição digital", nivel: dep as ScoreLevel, peso: 15, evidencia: niche ? `perfil típico do nicho "${niche.nome}" (hipótese de partida): ${niche.dependeDe.join(", ") || "nenhuma"}` : "nicho fora do catálogo — cadastre em Minha operação" });

  const n = raiox.gargalos.length;
  const sub: ScoreLevel = raiox.avaliadas < 5 ? "desconhecido" : n >= 4 ? "forte" : n >= 2 ? "regular" : n === 1 ? "fraca" : "ausente";
  crit.push({ criterio: "Subaproveita as redes sociais", nivel: sub, peso: 20, evidencia: raiox.avaliadas < 5 ? "poucas dimensões avaliadas" : `${n} gargalo(s) possível(is) identificado(s)` });

  const dif = qual.campos.find((c) => c.key === "principalDificuldade" && c.status === "identificado");
  const prod = qual.campos.find((c) => c.key === "produzInternamente" && c.status === "identificado");
  const difNivel: ScoreLevel = dif ? "forte" : prod ? "regular" : "desconhecido";
  crit.push({ criterio: "Tem dificuldade em produzir conteúdo", nivel: difNivel, peso: 10, evidencia: dif ? `dito pelo lead: ${dif.valor}` : prod ? `produz internamente: ${prod.valor}` : "ainda não perguntado" });

  const offer = recommendOffer(lead, raiox, qual, op);
  const rec: ScoreLevel = ({ alto: "forte", medio: "regular", baixo: "fraca", indefinido: "desconhecido" } as const)[offer.potencialRecorrente];
  crit.push({ criterio: "Pode se beneficiar de uma operação recorrente", nivel: rec, peso: 10, evidencia: offer.motivoPotencial });

  const pontos = Math.round(crit.reduce((a, c) => a + c.peso * FACTOR[c.nivel], 0));
  const avisos: string[] = [];
  const desconhecidos = crit.filter((c) => c.nivel === "desconhecido").map((c) => c.criterio);
  if (desconhecidos.length) avisos.push(`Sem informação sobre: ${desconhecidos.join("; ")}.`);
  const capFraca = capNivel === "fraca" || capNivel === "ausente";
  let prioridade: LeadScore["prioridade"] = raiox.avaliadas < 5 ? "INDEFINIDA" : pontos >= 70 && !capFraca ? "ALTA" : pontos >= 45 ? "MEDIA" : "BAIXA";
  if (pontos >= 70 && capFraca) avisos.push("Pontuação alta, mas a capacidade de investimento é fraca: prioridade limitada a MÉDIA.");
  return { prioridade, pontuacao: pontos, criterios: crit, avisos };
}

