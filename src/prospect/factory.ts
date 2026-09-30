import type { IgProfile, Lead, Operacao } from "./types.js";
import { LEAD_STATUS, OPERACAO_VAZIA } from "./types.js";

export const newId = (): string => `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function newProfile(handle: string, nome?: string): IgProfile {
  const h = handle.replace(/^@/, "").trim().toLowerCase();
  return { id: newId(), handle: h, nome: nome?.trim() || h, nicho: "", dims: {}, header: {}, notas: [] };
}

export function newLead(handle: string, nome?: string): Lead {
  const now = new Date().toISOString();
  return { profile: newProfile(handle, nome), status: "novo", conversa: [], qual: {}, objetivos: [], doresConfirmadas: [], criadoEm: now, atualizadoEm: now };
}

/** Normaliza um objeto vindo do banco/backup (campos ausentes ganham padrão; lixo é ignorado). */
export function normalizeLead(x: unknown): Lead | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Partial<Lead>;
  const pr = o.profile as Partial<IgProfile> | undefined;
  if (!pr || typeof pr.handle !== "string") return null;
  return {
    profile: {
      ...pr, id: pr.id ?? newId(), handle: pr.handle, nome: pr.nome ?? pr.handle, nicho: pr.nicho ?? "",
      dims: pr.dims ?? {}, header: pr.header ?? {}, notas: Array.isArray(pr.notas) ? pr.notas : [],
    } as IgProfile,
    status: LEAD_STATUS.includes(o.status as never) ? (o.status as Lead["status"]) : "novo",
    conversa: Array.isArray(o.conversa) ? o.conversa : [],
    qual: o.qual ?? {},
    objetivos: Array.isArray(o.objetivos) ? o.objetivos : [],
    doresConfirmadas: Array.isArray(o.doresConfirmadas) ? o.doresConfirmadas : [],
    ...(o.criadoEm ? { criadoEm: o.criadoEm } : {}),
    ...(o.atualizadoEm ? { atualizadoEm: o.atualizadoEm } : {}),
  };
}

export function normalizeOperacao(x: unknown): Operacao {
  const o = (x && typeof x === "object" ? x : {}) as Partial<Operacao>;
  return {
    ...OPERACAO_VAZIA,
    ...o,
    nichosCustom: Array.isArray(o.nichosCustom) ? o.nichosCustom : [],
    catalogo: o.catalogo ?? {},
    diferenciais: Array.isArray(o.diferenciais) ? o.diferenciais : [],
    provas: Array.isArray(o.provas) ? o.provas : [],
    processo: Array.isArray(o.processo) ? o.processo : [],
    regras: o.regras ?? {},
  };
}
