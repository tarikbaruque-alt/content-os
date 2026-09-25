import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { unaccent } from "@electric-sql/pglite/contrib/unaccent";

/**
 * As migrations do Supabase rodam aqui num Postgres de verdade (PGlite), com o
 * esqueleto mínimo do que o Supabase fornece (schema auth, auth.uid(), papéis).
 * Prova o que importa: um workspace não enxerga o outro, o navegador não
 * escreve em propostas/execuções, e os eventos viram tarefa na fila sem duplicar.
 */
const SUPABASE_STUB = `
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public, auth to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
`;
const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
let db: PGlite;

async function como<T>(user: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(user ? `set role authenticated; select set_config('request.jwt.claim.sub', '${user}', false);` : "set role anon;");
  try { return await fn(); } finally { await db.exec("reset role; select set_config('request.jwt.claim.sub', '', false);"); }
}
const um = async (sql: string, p: unknown[] = []) => (await db.query<Record<string, any>>(sql, p)).rows[0];

describe("migrations do Supabase", () => {
  beforeAll(async () => {
    db = new PGlite({ extensions: { unaccent } });
    await db.exec(SUPABASE_STUB);
    for (const f of readdirSync("supabase/migrations").sort()) await db.exec(readFileSync(`supabase/migrations/${f}`, "utf8"));
    await db.exec(`insert into auth.users values ('${A}', 'tarik@x.com'), ('${B}', 'outro@y.com');`);
  }, 60_000);

  it("primeiro acesso cria o workspace; chamar de novo não cria outro", async () => {
    const ws1 = await como(A, () => um("select public.criar_workspace('Agência') as id"));
    const ws2 = await como(A, () => um("select public.criar_workspace('Outra') as id"));
    expect(ws1!.id).toBe(ws2!.id);
    expect((await um("select papel from public.membros where user_id = $1", [A]))!.papel).toBe("dono");
  });

  it("um workspace não lê nem escreve nos docs do outro", async () => {
    const wsA = (await um("select workspace_id from public.membros where user_id = $1", [A]))!.workspace_id;
    await como(A, () => db.query("insert into public.docs (workspace_id, path, data) values ($1, 'cos_clients/cli-1', '{\"name\":\"Cliente A\"}')", [wsA]));
    await como(B, () => um("select public.criar_workspace('Intruso')"));
    const visto = await como(B, () => db.query("select * from public.docs"));
    expect(visto.rows).toHaveLength(0);
    await expect(como(B, () => db.query("insert into public.docs (workspace_id, path, data) values ($1, 'cos_clients/x', '{}')", [wsA]))).rejects.toThrow(/row-level security/);
    const upd = await como(B, () => db.query("update public.docs set data = '{}' where path = 'cos_clients/cli-1'"));
    expect(upd.affectedRows).toBe(0);
    expect(await como(null, () => db.query("select * from public.docs").then((r) => r.rows.length, () => -1))).toBe(-1);
  });

  it("coleção do painel sai da coluna parent (cos_calendar/cli/items)", async () => {
    const wsA = (await um("select workspace_id from public.membros where user_id = $1", [A]))!.workspace_id;
    await como(A, () => db.query("insert into public.docs (workspace_id, path, data) values ($1, 'cos_calendar/cli-1/items/cal-1', '{\"status\":\"PLANNED\"}'), ($1, 'cos_calendar/cli-1/items/cal-2', '{}')", [wsA]));
    const r = await como(A, () => db.query("select path from public.docs where parent = 'cos_calendar/cli-1/items' order by path"));
    expect(r.rows.map((x: any) => x.path)).toEqual(["cos_calendar/cli-1/items/cal-1", "cos_calendar/cli-1/items/cal-2"]);
  });

  it("o navegador não escreve em propostas, execuções, fila nem KB", async () => {
    const wsA = (await um("select workspace_id from public.membros where user_id = $1", [A]))!.workspace_id;
    for (const sql of [
      "insert into public.proposals (workspace_id, agente, tipo, titulo, payload) values ($1, 'radar', 'pesquisa', 't', '{}')",
      "insert into public.agent_runs (workspace_id, agente, gatilho) values ($1, 'radar', 'x')",
      "insert into public.agent_tasks (workspace_id, agente, gatilho) values ($1, 'radar', 'x')",
      "insert into public.knowledge_chunks (workspace_id, fonte, titulo, texto) values ($1, 'f', 't', 'x')",
    ]) await expect(como(A, () => db.query(sql, [wsA]))).rejects.toThrow(/permission denied/);
    await expect(como(A, () => db.query("select public.enfileirar($1, 'c', 'radar', 'x', '0'::interval)", [wsA]))).rejects.toThrow(/permission denied/);
  });

  it("briefing e resultado viram tarefa, sem duplicar enquanto está pendente", async () => {
    const wsA = (await um("select workspace_id from public.membros where user_id = $1", [A]))!.workspace_id;
    await como(A, async () => {
      await db.query("update public.docs set data = data || '{\"briefing\":\"Atendo mulheres de 30 a 45\"}' where path = 'cos_clients/cli-1'");
      await db.query("update public.docs set data = data || '{\"briefing\":\"Atendo mulheres de 30 a 50\"}' where path = 'cos_clients/cli-1'");
      await db.query("update public.docs set data = data || '{\"metrics\":{\"alcance\":100}}' where path = 'cos_calendar/cli-1/items/cal-1'");
      await db.query("insert into public.docs (workspace_id, path, data) values ($1, 'cos_strategy/cli-1', '{\"bigMessage\":\"x\"}')", [wsA]);
    });
    const t = await db.query<any>("select agente, client_id, gatilho from public.agent_tasks where status = 'pendente' order by agente");
    expect(t.rows).toEqual([
      { agente: "bussola", client_id: "cli-1", gatilho: "estratégia nova" },
      { agente: "iris", client_id: "cli-1", gatilho: "briefing novo" },
      { agente: "pulso", client_id: "cli-1", gatilho: "resultado novo" },
    ]);
  });

  it("convite vira membro no login", async () => {
    const wsA = (await um("select workspace_id from public.membros where user_id = $1", [A]))!.workspace_id;
    const C = "00000000-0000-0000-0000-00000000000c";
    await db.exec(`insert into auth.users values ('${C}', 'Nicacio@Z.com')`);
    await como(A, () => db.query("insert into public.convites (workspace_id, email) values ($1, 'nicacio@z.com')", [wsA]));
    expect((await como(C, () => um("select public.aceitar_convites() as n")))!.n).toBe(1);
    const r = await como(C, () => db.query("select path from public.docs where path = 'cos_clients/cli-1'"));
    expect(r.rows).toHaveLength(1);
  });

  it("busca da Knowledge Base em português acha por radical e respeita o workspace", async () => {
    const wsA = (await um("select workspace_id from public.membros where user_id = $1", [A]))!.workspace_id;
    await db.query(`insert into public.knowledge_chunks (workspace_id, fonte, titulo, secao, texto, agentes) values
      (null, 'pilares/criacao-alto-valor.md', 'Criação de alto valor', 'Ganchos', 'Ganchos canônicos prendem a atenção nos primeiros segundos do Reel.', '{estudio}'),
      (null, 'pilares/trafego-pago.md', 'Tráfego pago', 'Meta', 'Campanhas pagas no gerenciador de anúncios.', '{}'),
      ($1, 'upload/segredo.md', 'Material da equipe', null, 'Gancho interno da agência.', '{}'),
      (null, 'pilares/planejamento-cadencia.md', 'Planejamento', 'F7 — Frequência de impacto', 'Postar com frequência constante por semana gera impacto acumulado.', '{}'),
      (null, 'pilares/estrategia-marca.md', 'Estratégia de marca', 'Propósito', 'O propósito orienta a marca e a semana de trabalho.', '{}')`, [wsA]);
    const r = await como(B, () => db.query<any>("select fonte from public.kb_buscar((select workspace_id from public.membros where user_id = $1), 'como criar um gancho para reels', 'estudio', 5)", [B]));
    expect(r.rows[0].fonte).toBe("pilares/criacao-alto-valor.md");
    expect(r.rows.map((x: any) => x.fonte)).not.toContain("upload/segredo.md");
    // Casar mais palavras (e no título da seção) tem que ganhar de casar uma palavra solta.
    const f = await como(A, () => db.query<any>("select secao, rank from public.kb_buscar(gen_random_uuid(), 'frequência ideal de postagem por semana', null, 3)"));
    expect(f.rows[0].secao).toBe("F7 — Frequência de impacto");
    expect(f.rows[0].rank).toBeGreaterThan(0);
  });
  it("briefing por link: a equipe cria o link e lê as respostas; resposta só entra pelo servidor", async () => {
    const wsA = (await um("select workspace_id from public.membros where user_id = $1", [A]))!.workspace_id;
    const link = await como(A, () => um("insert into public.briefing_links (workspace_id, cliente_nome, criado_por) values ($1, 'Ana', $2) returning token", [wsA, A]));
    expect(link!.token).toMatch(/^[0-9a-f]{32}$/);
    // Outra equipe não vê o link, não cria link no workspace alheio.
    expect((await como(B, () => db.query("select * from public.briefing_links"))).rows).toHaveLength(0);
    await expect(como(B, () => db.query("insert into public.briefing_links (workspace_id, criado_por) values ($1, $2)", [wsA, B]))).rejects.toThrow(/row-level security/);
    // Ninguém do navegador insere resposta: nem a equipe, nem o visitante anônimo.
    await expect(como(A, () => db.query("insert into public.briefings (workspace_id, token, respostas) values ($1, $2, '{}')", [wsA, link!.token]))).rejects.toThrow(/permission denied/);
    await expect(como(null, () => db.query("insert into public.briefings (workspace_id, token, respostas) values ($1, $2, '{}')", [wsA, link!.token]))).rejects.toThrow(/permission denied/);
    await expect(como(null, () => db.query("select * from public.briefing_links"))).rejects.toThrow(/permission denied/);
    // O servidor grava; a equipe dona lê e marca como importado; a outra não enxerga.
    await db.query("insert into public.briefings (workspace_id, token, respostas) values ($1, $2, '{\"name\":\"Ana Doces\"}')", [wsA, link!.token]);
    const lidos = await como(A, () => db.query<any>("select respostas->>'name' as n from public.briefings"));
    expect(lidos.rows.map((r) => r.n)).toEqual(["Ana Doces"]);
    expect((await como(B, () => db.query("select * from public.briefings"))).rows).toHaveLength(0);
    const upd = await como(A, () => db.query("update public.briefings set status = 'importado', client_id = 'ana' where workspace_id = $1", [wsA]));
    expect(upd.affectedRows).toBe(1);
  });
});
