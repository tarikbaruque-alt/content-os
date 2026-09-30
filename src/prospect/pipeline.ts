import type { Lead, LeadStatus, Operacao } from "./types.js";
import type { RaioX } from "./raiox.js";
import type { QualReport } from "./qualification.js";
import { OPENING_QUESTIONS } from "./approach.js";
import { validateOutbound } from "./guardrails.js";
import { firstName } from "./context.js";

export const STAGE_ORDER = ["novo", "raiox", "abordado", "conversa", "qualificado", "pitch", "negociacao", "fechado"] as const satisfies readonly LeadStatus[];
export const STAGE_LABEL: Record<LeadStatus, string> = {
  novo: "Novo", raiox: "Raio-X feito", abordado: "Abordado", conversa: "Em conversa", qualificado: "Qualificado",
  pitch: "Pitch enviado", negociacao: "Negociação", fechado: "Fechado", perdido: "Perdido",
};

/** Padrão do sistema (ajustável em Minha operação): 2, 5 e 10 dias entre tentativas sem resposta. */
export const DEFAULT_CADENCIA = [2, 5, 10];
export const cadenciaOf = (op: Operacao): number[] => (op.cadenciaDias && op.cadenciaDias.length ? op.cadenciaDias : DEFAULT_CADENCIA);

const pad = (n: number) => String(n).padStart(2, "0");
export const dayStr = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return dayStr(new Date(y, m - 1, d + n));
}
export function daysBetween(a: string, b: string): number {
  const t = (s: string) => { const [y, m, d] = s.split("-").map(Number) as [number, number, number]; return Date.UTC(y, m - 1, d); };
  return Math.round((t(b) - t(a)) / 86400000);
}

/** Etapa mais avançada que o prospect já alcançou (perdido usa o histórico; sem histórico = desconhecido). */
export function reachedIndex(l: Lead): number {
  const idx = (s: LeadStatus) => (STAGE_ORDER as readonly string[]).indexOf(s);
  let best = idx(l.status);
  for (const h of l.historico ?? []) if (h.status) best = Math.max(best, idx(h.status));
  return best;
}

export type FunnelStage = { etapa: LeadStatus; rotulo: string; alcancaram: number; daAnterior: { n: number; d: number; pct: number | null } | null };
export type Funnel = { etapas: FunnelStage[]; perdidos: number; emAberto: number; total: number };

/** Funil com contagens reais. A % só aparece com base mínima (5) para não enganar com poucos casos. */
export function funnel(leads: Lead[]): Funnel {
  const reached = leads.map(reachedIndex);
  const etapas = STAGE_ORDER.map((etapa, i): FunnelStage => {
    const n = reached.filter((r) => r >= i).length;
    const prev = i === 0 ? null : reached.filter((r) => r >= i - 1).length;
    return { etapa, rotulo: STAGE_LABEL[etapa], alcancaram: n, daAnterior: prev == null ? null : { n, d: prev, pct: prev >= 5 ? Math.round((n / prev) * 100) : null } };
  });
  return { etapas, perdidos: leads.filter((l) => l.status === "perdido").length, emAberto: leads.filter((l) => l.status !== "perdido" && l.status !== "fechado").length, total: leads.length };
}

/** Muda a etapa registrando no histórico e (ao abordar) sugerindo o próximo contato. Muta e devolve o lead. */
export function applyStatus(lead: Lead, status: LeadStatus, op: Operacao, now: Date = new Date()): Lead {
  if (lead.status === status) return lead;
  lead.status = status;
  (lead.historico ??= []).push({ quando: now.toISOString(), evento: `Etapa: ${STAGE_LABEL[status]}`, status });
  if (status === "fechado" || status === "perdido") delete lead.proximoContato;
  else if (status === "abordado" && !lead.proximoContato) lead.proximoContato = addDays(dayStr(now), cadenciaOf(op)[0]!);
  return lead;
}

export const attempts = (l: Lead): number => (l.historico ?? []).filter((h) => h.evento === "contato").length;

/** Registra um follow-up enviado sem resposta e agenda o seguinte; acabando a cadência, sugere encerrar. */
export function registerContact(lead: Lead, op: Operacao, now: Date = new Date()): { proximo: string | null; esgotou: boolean } {
  (lead.historico ??= []).push({ quando: now.toISOString(), evento: "contato" });
  const cad = cadenciaOf(op);
  const n = attempts(lead);
  const dias = cad[n];
  if (dias == null) { delete lead.proximoContato; return { proximo: null, esgotou: true }; }
  lead.proximoContato = addDays(dayStr(now), dias);
  return { proximo: lead.proximoContato, esgotou: false };
}

export type Due = { estado: "atrasado" | "hoje"; dias: number };
export function dueState(lead: Lead, today: string): Due | null {
  if (!lead.proximoContato || lead.status === "fechado" || lead.status === "perdido") return null;
  const d = daysBetween(lead.proximoContato, today);
  return d > 0 ? { estado: "atrasado", dias: d } : d === 0 ? { estado: "hoje", dias: 0 } : null;
}

export type FollowUp = { situacao: string; rotulo: string; texto: string; avisos: string[] };

/**
 * Mensagens de follow-up educadas, que agregam algo em vez de cobrar. Nunca pressionam, nunca criam urgência,
 * e as de 1ª fase passam pela mesma validação da primeira mensagem (não vendem).
 */
export function followUps(lead: Lead, raiox: RaioX, qual: QualReport, op: Operacao): FollowUp[] {
  const nome = firstName(lead);
  const oi = nome ? `Oi, ${nome}!` : "Olá!";
  const perfil = lead.profile.nome;
  const q = qual.proximasPerguntas[0]?.pergunta ?? OPENING_QUESTIONS[3]!;
  const n = attempts(lead);
  const mk = (situacao: string, rotulo: string, texto: string, primeira: boolean): FollowUp => ({
    situacao, rotulo, texto,
    avisos: validateOutbound(texto, op, { primeiraMensagem: primeira, extraAllowed: [perfil, q] }),
  });
  const out: FollowUp[] = [];
  switch (lead.status) {
    case "abordado": {
      const all = [
        mk("Sem resposta · 1ª retomada", "Retomada leve", `${oi} Voltando aqui de leve sobre a minha mensagem anterior. Sem pressa, mas fiquei curioso: ${q}`, true),
        mk("Sem resposta · 2ª retomada", "Oferecer algo útil", `${oi} Fiz uma leitura rápida do perfil de ${perfil} e anotei algumas observações que talvez sejam úteis para você. Quer que eu te envie? Sem compromisso.`, true),
        mk("Sem resposta · encerramento", "Encerrar com educação", `${oi} Imagino que o momento não seja esse, e tudo bem. Vou encerrar por aqui; se um dia fizer sentido conversar sobre conteúdo, é só me chamar.`, true),
      ];
      const i = Math.min(n, 2);
      out.push(all[i]!);
      for (let k = 0; k < all.length; k++) if (k !== i) out.push({ ...all[k]!, rotulo: `${all[k]!.rotulo} (outra fase)` });
      break;
    }
    case "conversa":
    case "qualificado":
      out.push(mk("Ele(a) respondeu", "Seguir a conversa", `${oi} Obrigado por responder! ${q}`, false));
      break;
    case "pitch":
      out.push(mk("Pitch enviado · sem retorno", "Retomar depois do pitch", `${oi} Conseguiu olhar o que conversamos? Se ficou alguma dúvida, posso esclarecer — e se não fizer sentido agora, tudo bem também.`, false));
      break;
    case "negociacao":
      out.push(mk("Em negociação", "Entender a avaliação", `${oi} Queria saber como está a sua avaliação. Ficou alguma dúvida sobre escopo, etapas ou formato que eu possa esclarecer?`, false));
      break;
    default:
      break;
  }
  return out;
}
