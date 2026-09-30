import type { Lead, Operacao, ServiceKey } from "./types.js";
import { NICHES, type Niche } from "./catalog-core.js";
import { SERVICE_BY_KEY } from "./catalog-services.js";

export const norm = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
export const lc = (s: string): string => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
export const cap = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
export const ensureEnd = (s: string): string => (/[.!?…]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);
export const fmtBRL = (n: number): string => `R$ ${n.toLocaleString("pt-BR")}`;

export function allNiches(op: Operacao): Niche[] {
  return [...NICHES, ...op.nichosCustom.map((n) => ({ key: n.key, nome: n.nome, dependeDe: n.dependeDe, custom: true }))];
}

/** Nicho do lead: pela chave/nome cadastrado; se for texto livre, devolve null (sem chute). */
export function nicheOf(lead: Lead, op: Operacao): Niche | null {
  const n = norm(lead.profile.nicho);
  return allNiches(op).find((x) => norm(x.key) === n || norm(x.nome) === n) ?? null;
}
export const nicheName = (lead: Lead, op: Operacao): string => nicheOf(lead, op)?.nome ?? lead.profile.nicho;

/** Serviço ofertado por você? (padrão: sim, salvo desativado no catálogo). */
export const serviceActive = (op: Operacao, key: ServiceKey): boolean => op.catalogo[key]?.ativo !== false;

export function ticketOf(op: Operacao, key: ServiceKey): { min: number; max: number; recorrente: boolean } | null {
  const t = op.catalogo[key];
  if (!t || t.ticketMin == null || t.ticketMax == null) return null;
  return { min: t.ticketMin, max: t.ticketMax, recorrente: SERVICE_BY_KEY[key].recorrente };
}

export function firstName(lead: Lead): string | null {
  const n = (lead.profile.contato ?? "").trim().split(/\s+/)[0];
  return n || null;
}
