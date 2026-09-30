import type {
  Claim, CommercialContext, DimensionLevel, Lead, LeadAssessment, LeadDimension, Priority,
  ServiceOffer, SignalRating, TicketRange,
} from "./types.js";
import { AREA_INSIGHTS, NEED_AREAS } from "./knowledge.js";
import { fmtBRL, findService, needGaps, norm, worstSignalByArea } from "./util.js";

const AREA_LABEL: Record<string, string> = {
  presenca_digital: "Presença digital", oferta: "Oferta", posicionamento: "Posicionamento",
  conteudo: "Conteúdo", site: "Site", conversao: "Conversão",
};

const INV_SCORE: Record<DimensionLevel, number> = { forte: 30, regular: 20, fraca: 8, ausente: 0, desconhecido: 10 };
const MAT_SCORE: Record<DimensionLevel, number> = { forte: 10, regular: 6, fraca: 2, ausente: 0, desconhecido: 4 };

/** Melhor serviço do catálogo para a lacuna mais grave (primeira categoria que existir no catálogo). */
export function pickBestService(ctx: CommercialContext, lead: Lead): { servico: ServiceOffer; motivo: string; angulo: string } | null {
  for (const gap of needGaps(lead)) {
    const insight = AREA_INSIGHTS[gap.area];
    if (!insight) continue;
    for (const cat of insight.categorias) {
      const s = findService(ctx, cat);
      if (s) {
        return {
          servico: s,
          angulo: insight.angulo,
          motivo: `Responde à lacuna observada em ${insight.rotulo.toLowerCase()} ("${gap.observacao.replace(/\.$/, "")}", fonte: ${gap.fonte}).`,
        };
      }
    }
  }
  return null;
}

export function ticketFor(service: ServiceOffer | undefined): TicketRange | null {
  if (!service || service.ticketMin == null || service.ticketMax == null) return null;
  return {
    minimo: service.ticketMin,
    maximo: service.ticketMax,
    periodicidade: service.recorrente ? "mensal" : "unico",
    origem: `faixa cadastrada para o serviço "${service.nome}"`,
  };
}

/**
 * AGENTE DE PROSPECÇÃO — avalia um lead SOMENTE com as observações registradas.
 * Área sem observação = "desconhecido" (nunca assume). Tudo que é inferência sai
 * marcado como HIPOTESE, com a observação que a originou.
 */
export function assessLead(ctx: CommercialContext, lead: Lead): LeadAssessment {
  const by = worstSignalByArea(lead);
  const lvl = (area: Parameters<typeof by.get>[0]): { nivel: DimensionLevel; evidencia?: string } => {
    const s = by.get(area);
    return s ? { nivel: s.avaliacao as SignalRating, evidencia: `${s.observacao} (${s.fonte})` } : { nivel: "desconhecido" };
  };

  const prioritarios = ctx.agencia.nichosPrioritarios ?? [];
  const nichoEmLista = prioritarios.some((n) => norm(n) === norm(lead.nicho));
  const dimensoes: LeadDimension[] = [
    {
      dimensao: "Nicho",
      nivel: prioritarios.length ? (nichoEmLista ? "forte" : "regular") : "desconhecido",
      evidencia: prioritarios.length ? (nichoEmLista ? "nicho está entre os prioritários cadastrados" : "nicho fora da lista de prioritários") : undefined,
    },
  ];
  for (const a of NEED_AREAS) dimensoes.push({ dimensao: AREA_LABEL[a] ?? a, ...lvl(a) });

  const inv = lvl("investimento");
  const invNivel: DimensionLevel = inv.nivel === "desconhecido" && lead.orcamentoInformado ? "regular" : inv.nivel;
  dimensoes.push({
    dimensao: "Capacidade de investimento",
    nivel: invNivel,
    evidencia: inv.evidencia ?? (lead.orcamentoInformado ? `orçamento informado pelo lead: ${lead.orcamentoInformado}` : undefined),
  });
  const mat = lvl("maturidade");
  dimensoes.push({ dimensao: "Maturidade do negócio", ...mat });

  const gaps = needGaps(lead);
  const knownNeed = NEED_AREAS.filter((a) => by.has(a)).length;
  dimensoes.push({
    dimensao: "Necessidade aparente",
    nivel: gaps.length >= 3 ? "forte" : gaps.length >= 1 ? "regular" : knownNeed >= 2 ? "fraca" : "desconhecido",
    evidencia: gaps.length ? `${gaps.length} lacuna(s) observada(s)` : undefined,
  });

  const best = pickBestService(ctx, lead);
  const recurringFit = gaps.some((g) => ["conteudo", "presenca_digital"].includes(g.area)) && ctx.servicos.some((s) => s.recorrente);
  dimensoes.push({
    dimensao: "Potencial de recorrência",
    nivel: recurringFit ? "forte" : ctx.servicos.some((s) => s.recorrente) && gaps.length ? "regular" : "desconhecido",
    evidencia: recurringFit ? "lacunas de conteúdo/presença + serviço recorrente no catálogo" : undefined,
  });
  const ticket = ticketFor(best?.servico);
  dimensoes.push({
    dimensao: "Potencial de ticket",
    nivel: ticket ? "regular" : "desconhecido",
    evidencia: ticket ? ticket.origem : "sem faixa de ticket cadastrada para o serviço recomendado",
  });

  // ---- pontuação (0–100): necessidade 40 + capacidade 30 + maturidade 10 + fit 20
  const need = Math.min(40, gaps.length * 10);
  const fit = prioritarios.length ? (nichoEmLista ? 20 : 8) : 10;
  const pontuacao = need + INV_SCORE[invNivel] + MAT_SCORE[mat.nivel] + fit;
  const prioridade: Priority = knownNeed < 2 ? "INDEFINIDA" : pontuacao >= 65 ? "ALTA" : pontuacao >= 40 ? "MEDIA" : "BAIXA";

  const motivoDeInteresse: Claim[] = gaps.map((g) => ({
    texto: g.observacao, certeza: "OBSERVADO", evidencia: `${g.fonte}`,
  }));
  if (nichoEmLista) motivoDeInteresse.push({ texto: `O nicho (${lead.nicho}) está entre os prioritários da operação.`, certeza: "OBSERVADO", evidencia: "cadastro de nichos prioritários" });

  const possiveisProblemas: Claim[] = gaps.flatMap((g) => {
    const i = AREA_INSIGHTS[g.area];
    return i ? [{ texto: cap1(i.problema), certeza: "HIPOTESE" as const, evidencia: `${g.observacao} (${g.fonte})` }] : [];
  });
  const possiveisOportunidades: Claim[] = gaps.flatMap((g) => {
    const i = AREA_INSIGHTS[g.area];
    return i ? [{ texto: cap1(i.oportunidade), certeza: "HIPOTESE" as const, evidencia: `${g.observacao} (${g.fonte})` }] : [];
  });

  const lacunas: string[] = [];
  if (knownNeed < 2) lacunas.push("Poucas observações registradas (menos de 2 áreas): prioridade indefinida até coletar mais sinais.");
  if (invNivel === "desconhecido") lacunas.push("Capacidade de investimento desconhecida: registrar sinais (estrutura, anúncios, equipe) ou perguntar.");
  if (mat.nivel === "desconhecido") lacunas.push("Maturidade do negócio desconhecida.");
  if (best && !ticket) lacunas.push(`Sem faixa de ticket cadastrada para "${best.servico.nome}": o sistema não estima valor.`);
  if (!best && gaps.length) lacunas.push("Nenhum serviço do catálogo cobre as lacunas observadas.");
  for (const a of NEED_AREAS) if (!by.has(a)) lacunas.push(`Sem observação sobre: ${(AREA_LABEL[a] ?? a).toLowerCase()}.`);

  return {
    prioridade, pontuacao, dimensoes, motivoDeInteresse, possiveisProblemas, possiveisOportunidades,
    melhorServico: best ? { servico: best.servico, motivo: best.motivo } : null,
    melhorAngulo: best?.angulo ?? null,
    possivelTicket: ticket,
    lacunas,
  };
}

const cap1 = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
export { fmtBRL };
