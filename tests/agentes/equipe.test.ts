import { describe, it, expect } from "vitest";
import { convidar, trocarEmail, enviarAcesso, authAdminSupabase, type AuthAdmin, type Membros, type Papel } from "../../supabase/functions/_shared/equipe.ts";

const WS = "ws-1";
const UID_TARIK = "11111111-1111-1111-1111-111111111111";
function cenario(contas: Record<string, string> = {}) {
  const emails = { ...contas }; // email -> uid
  const tabela: Record<string, Papel> = {};
  const enviados: string[] = [];
  const a: AuthAdmin = {
    usuarioPorEmail: async (e) => emails[e] ?? null,
    convidar: async (e) => { const id = "22222222-2222-2222-2222-" + String(Object.keys(emails).length).padStart(12, "0"); emails[e] = id; enviados.push("convite " + e); return id; },
    trocarEmail: async (uid, e) => { for (const k in emails) if (emails[k] === uid) delete emails[k]; emails[e] = uid; },
    enviarAcesso: async (e) => { enviados.push("acesso " + e); },
    emailDe: async (uid) => Object.keys(emails).find((k) => emails[k] === uid) ?? null,
  };
  const m: Membros = { papelDe: async (_ws, uid) => tabela[uid] ?? null, adicionar: async (_ws, uid, p) => { tabela[uid] = p; } };
  return { a, m, tabela, enviados, emails };
}

describe("equipe pelo servidor", () => {
  it("convite de quem não tem conta: cria, manda o e-mail e entra com o papel pedido", async () => {
    const c = cenario();
    const r = await convidar(c.a, c.m, WS, "  Ana@Agencia.com ", "leitura", "https://painel");
    expect(r).toMatchObject({ ok: true, novo: true, papel: "leitura" });
    expect(c.enviados).toEqual(["convite ana@agencia.com"]);
    expect(Object.values(c.tabela)).toEqual(["leitura"]);
  });

  it("quem já tem conta entra sem novo convite; quem já é da equipe não entra duas vezes", async () => {
    const c = cenario({ "tarik@x.com": UID_TARIK });
    expect(await convidar(c.a, c.m, WS, "tarik@x.com", "editor", "")).toMatchObject({ ok: true, novo: false });
    expect(c.enviados).toEqual([]);
    expect(await convidar(c.a, c.m, WS, "tarik@x.com", "editor", "")).toEqual({ erro: "Essa pessoa já está na equipe." });
    expect(await convidar(c.a, c.m, WS, "sem-arroba", "editor", "")).toEqual({ erro: "Digite um e-mail válido." });
  });

  it("papel desconhecido vira editor, nunca dono por engano", async () => {
    const c = cenario();
    expect(await convidar(c.a, c.m, WS, "x@y.com", "admin", "")).toMatchObject({ papel: "editor" });
  });

  it("trocar o e-mail de quem está na equipe e reenviar o acesso para o e-mail novo", async () => {
    const c = cenario({ "tarik@contentos.app": UID_TARIK });
    c.tabela[UID_TARIK] = "dono";
    expect(await trocarEmail(c.a, c.m, WS, UID_TARIK, "Tarik@Gmail.com")).toMatchObject({ ok: true, email: "tarik@gmail.com" });
    expect(await enviarAcesso(c.a, c.m, WS, UID_TARIK, "https://painel")).toMatchObject({ ok: true, email: "tarik@gmail.com" });
    expect(c.enviados).toEqual(["acesso tarik@gmail.com"]);
  });

  it("não mexe em quem não é da equipe nem rouba e-mail de outra conta", async () => {
    const c = cenario({ "tarik@x.com": UID_TARIK, "outro@x.com": "33333333-3333-3333-3333-333333333333" });
    expect(await trocarEmail(c.a, c.m, WS, UID_TARIK, "novo@x.com")).toEqual({ erro: "Essa pessoa não está na equipe." });
    expect(await enviarAcesso(c.a, c.m, WS, "nao-e-uuid", "")).toEqual({ erro: "Essa pessoa não está na equipe." });
    c.tabela[UID_TARIK] = "editor";
    expect(await trocarEmail(c.a, c.m, WS, UID_TARIK, "outro@x.com")).toEqual({ erro: "Já existe outra conta com esse e-mail." });
  });

  it("fala com o Auth do Supabase nos endereços certos, com a chave de serviço", async () => {
    const pedidos: string[] = [];
    const f = (async (u: string, init: RequestInit) => {
      pedidos.push(`${init.method} ${u} ${(init.headers as any).apikey}`);
      return new Response(JSON.stringify({ id: "novo-id", email: "a@b.com" }), { status: 200 });
    }) as unknown as typeof fetch;
    const a = authAdminSupabase("https://p.supabase.co/", "sb_secret_x", async () => null, f);
    expect(await a.convidar("a@b.com", "https://painel.app")).toBe("novo-id");
    await a.enviarAcesso("a@b.com", "");
    await a.trocarEmail(UID_TARIK, "c@d.com");
    expect(pedidos).toEqual([
      "POST https://p.supabase.co/auth/v1/invite?redirect_to=https%3A%2F%2Fpainel.app sb_secret_x",
      "POST https://p.supabase.co/auth/v1/recover sb_secret_x",
      `PUT https://p.supabase.co/auth/v1/admin/users/${UID_TARIK} sb_secret_x`,
    ]);
  });
});
