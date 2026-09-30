import type { CommercialContext, FirstApproach, FirstApproachRefusal, Lead, LeadSignal } from "./types.js";
import { AREA_INSIGHTS } from "./knowledge.js";
import { validateOutboundText } from "./guardrails.js";
import { ensureEnd, firstName, lc, needGaps } from "./util.js";

const MAX_LEN = 420;

/**
 * PRIMEIRA ABORDAGEM — não vende: gera curiosidade e conversa.
 * Lógica: OBSERVAÇÃO REAL + OPORTUNIDADE + PERGUNTA.
 * Sem observação real registrada, NÃO há motivo legítimo de contato → recusa.
 */
export function buildFirstApproach(ctx: CommercialContext, lead: Lead): FirstApproach | FirstApproachRefusal {
  const candidatos = needGaps(lead).filter((s) => AREA_INSIGHTS[s.area] && s.observacao.trim() && s.fonte.trim());

  const sinal = candidatos[0];
  if (!sinal) {
    return {
      leadId: lead.id,
      recusada: true,
      motivo: "Não há observação real registrada (com fonte) que sirva de motivo legítimo para o contato.",
      proximoPasso: "Registre ao menos uma observação factual sobre o site, Instagram, oferta ou conteúdo do lead e gere a abordagem novamente.",
    };
  }
  const insight = AREA_INSIGHTS[sinal.area]!;
  const nome = firstName(lead);
  const oi = nome ? `Oi, ${nome}!` : "Olá!";
  const obs = ensureEnd(sinal.observacao);

  const A = `${oi} ${obs} ${insight.oportunidadeCurta} ${insight.perguntaAbordagem}`;
  const B = `${oi} Estava dando uma olhada em ${lead.nome} e notei que ${lc(obs)} Pode ser só a minha impressão, mas ${insight.problema}. Como vocês enxergam isso hoje?`;
  const C = `${oi}\n\n${obs} ${insight.oportunidadeCurta}\n\n${insight.pergunta}\n\nSe fizer sentido, conversamos por alguns minutos — se não, tudo bem também.`;

  const variantes: FirstApproach["variantes"] = [
    { canal: "mensagem_curta", texto: A },
    { canal: "mensagem_curta", texto: B },
    { canal: "email", assunto: `Uma observação sobre ${sinal.area === "site" ? "o site" : "a presença"} de ${lead.nome}`, texto: C },
  ];

  const avisos: string[] = ["Ajuste ao seu estilo e inclua sua apresentação curta, se quiser — sem elogios genéricos nem promessas."];
  for (const v of variantes) {
    const violacoes = validateOutboundText(v.texto, ctx, [sinal.observacao]);
    if (violacoes.length) avisos.push(`Variante ${v.canal}: ${violacoes.join("; ")}`);
    if (v.canal === "mensagem_curta" && v.texto.length > MAX_LEN) avisos.push(`Mensagem longa (${v.texto.length} caracteres): encurte a observação.`);
  }
  if (sinal.avaliacao === "fraca") avisos.push("A observação indica ponto fraco (não ausência): mantenha o tom de pergunta, não de crítica.");

  return {
    leadId: lead.id,
    motivoReal: `${insight.rotulo}: ${sinal.observacao} (fonte: ${sinal.fonte})`,
    observacaoUsada: sinal as LeadSignal,
    variantes,
    avisos,
  };
}

export const isRefusal = (r: FirstApproach | FirstApproachRefusal): r is FirstApproachRefusal => "recusada" in r;
