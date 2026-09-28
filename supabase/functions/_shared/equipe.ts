/**
 * Equipe do workspace pelo servidor. O convite cria a conta e o Supabase manda o
 * e-mail com o link para a pessoa criar a senha: funciona com o cadastro público
 * desligado (antes o convidado precisava "Criar conta" sozinho). O dono também
 * corrige o e-mail de alguém (conta criada com e-mail errado não recebe nada) e
 * reenvia o link de acesso. Só o dono chama estas operações: agentes/index.ts confere.
 */
export type Papel = "dono" | "editor" | "leitura";
export const PAPEIS: Papel[] = ["dono", "editor", "leitura"];
export const emailValido = (e: unknown): e is string =>
  typeof e === "string" && e.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
const uidValido = (u: unknown): u is string => typeof u === "string" && /^[0-9a-f-]{36}$/i.test(u);

export type AuthAdmin = {
  usuarioPorEmail(email: string): Promise<string | null>;
  /** Cria a conta e manda o e-mail de convite; devolve o id da conta nova. */
  convidar(email: string, voltarPara: string): Promise<string>;
  trocarEmail(uid: string, email: string): Promise<void>;
  /** Manda o e-mail com o link para definir uma senha nova. */
  enviarAcesso(email: string, voltarPara: string): Promise<void>;
  emailDe(uid: string): Promise<string | null>;
};
export type Membros = {
  papelDe(ws: string, uid: string): Promise<Papel | null>;
  adicionar(ws: string, uid: string, papel: Papel): Promise<void>;
};
export type Resultado = { ok: true; [k: string]: unknown } | { erro: string };

export async function convidar(a: AuthAdmin, m: Membros, ws: string, email: unknown, papel: unknown, voltarPara: string): Promise<Resultado> {
  if (!emailValido(email)) return { erro: "Digite um e-mail válido." };
  const p: Papel = PAPEIS.includes(papel as Papel) ? (papel as Papel) : "editor";
  const e = email.trim().toLowerCase();
  let uid = await a.usuarioPorEmail(e);
  if (uid && (await m.papelDe(ws, uid))) return { erro: "Essa pessoa já está na equipe." };
  const novo = !uid;
  if (!uid) uid = await a.convidar(e, voltarPara);
  await m.adicionar(ws, uid, p);
  return { ok: true, novo, papel: p };
}

export async function trocarEmail(a: AuthAdmin, m: Membros, ws: string, uid: unknown, email: unknown): Promise<Resultado> {
  if (!uidValido(uid) || !(await m.papelDe(ws, uid))) return { erro: "Essa pessoa não está na equipe." };
  if (!emailValido(email)) return { erro: "Digite um e-mail válido." };
  const e = email.trim().toLowerCase();
  const outro = await a.usuarioPorEmail(e);
  if (outro && outro !== uid) return { erro: "Já existe outra conta com esse e-mail." };
  await a.trocarEmail(uid, e);
  return { ok: true, email: e };
}

export async function enviarAcesso(a: AuthAdmin, m: Membros, ws: string, uid: unknown, voltarPara: string): Promise<Resultado> {
  if (!uidValido(uid) || !(await m.papelDe(ws, uid))) return { erro: "Essa pessoa não está na equipe." };
  const e = await a.emailDe(uid);
  if (!e) return { erro: "Essa conta não tem e-mail." };
  await a.enviarAcesso(e, voltarPara);
  return { ok: true, email: e };
}

/** Auth do Supabase com a chave de serviço (GoTrue: /invite, /recover, /admin/users). */
export function authAdminSupabase(url: string, chaveServico: string, rest: (caminho: string, init?: RequestInit) => Promise<any>, f: typeof fetch = fetch): AuthAdmin {
  const base = url.replace(/\/$/, "") + "/auth/v1";
  const h: Record<string, string> = { apikey: chaveServico, "Content-Type": "application/json" };
  if (chaveServico.startsWith("eyJ")) h.Authorization = `Bearer ${chaveServico}`;
  async function auth(caminho: string, init: RequestInit): Promise<any> {
    const r = await f(base + caminho, { ...init, headers: h });
    const txt = await r.text();
    if (!r.ok) throw new Error(`Auth ${r.status}: ${txt.slice(0, 200)}`);
    return txt ? JSON.parse(txt) : null;
  }
  const volta = (u: string) => (u ? `?redirect_to=${encodeURIComponent(u)}` : "");
  return {
    usuarioPorEmail: async (e) => (await rest(`/rpc/usuario_por_email`, { method: "POST", body: JSON.stringify({ e }) })) ?? null,
    convidar: async (e, v) => (await auth(`/invite${volta(v)}`, { method: "POST", body: JSON.stringify({ email: e }) })).id,
    trocarEmail: async (uid, e) => { await auth(`/admin/users/${uid}`, { method: "PUT", body: JSON.stringify({ email: e, email_confirm: true }) }); },
    enviarAcesso: async (e, v) => { await auth(`/recover${volta(v)}`, { method: "POST", body: JSON.stringify({ email: e }) }); },
    emailDe: async (uid) => (await auth(`/admin/users/${uid}`, { method: "GET" }))?.email ?? null,
  };
}
