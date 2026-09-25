/**
 * Instala e atualiza o Content OS num projeto Supabase. Pode rodar quantas
 * vezes quiser: cada passo confere o que já existe antes de mexer.
 *
 *   npm run supabase:setup                 # migrations + segredos + função + agenda + KB
 *   npm run supabase:setup -- migrations   # só um passo (migrations|segredos|funcao|agenda|kb|auth)
 *
 * Lê .env.supabase.local (fora do Git) e o .env:
 *   SUPABASE_ACCESS_TOKEN  token pessoal (sbp_…) da conta dona do projeto
 *   SUPABASE_PROJECT_REF   id do projeto
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   ANTHROPIC_API_KEY      (opcional aqui: sem ela os agentes ficam instalados e desligados)
 *   AGENT_MODEL, AGENT_ORCAMENTO_USD_MES, PAINEL_URL (opcionais)
 */
import { appendFileSync, existsSync, readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { backendSupabase } from "../supabase/functions/_shared/supabase.ts";
import { trechosDoMarkdown } from "../supabase/functions/_shared/kb.ts";

function carregarEnv(arquivo: string) {
  if (!existsSync(arquivo)) return;
  for (const l of readFileSync(arquivo, "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2]!.replace(/^["']|["']$/g, "");
  }
}
carregarEnv(".env.supabase.local");
carregarEnv(".env");

const env = (k: string, obrig = true) => {
  const v = process.env[k];
  if (!v && obrig) throw new Error(`Falta ${k} (em .env.supabase.local ou .env).`);
  return v ?? "";
};
const TOKEN = env("SUPABASE_ACCESS_TOKEN");
const REF = env("SUPABASE_PROJECT_REF");
const API = `https://api.supabase.com/v1/projects/${REF}`;

async function mgmt(caminho: string, init: RequestInit = {}) {
  const r = await fetch(API + caminho, { ...init, headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", ...(init.headers as any) } });
  const t = await r.text();
  if (!r.ok) throw new Error(`Management API ${r.status} ${caminho}: ${t.slice(0, 400)}`);
  return t ? JSON.parse(t) : null;
}
const sql = (query: string) => mgmt("/database/query", { method: "POST", body: JSON.stringify({ query }) });
const lit = (s: string) => `'${s.replace(/'/g, "''")}'`;

async function migrations() {
  await sql("create schema if not exists ops; create table if not exists ops.migracoes (nome text primary key, aplicada_em timestamptz not null default now()); revoke all on schema ops from public, anon, authenticated;");
  const feitas = new Set(((await sql("select nome from ops.migracoes")) as { nome: string }[]).map((x) => x.nome));
  for (const f of readdirSync("supabase/migrations").sort()) {
    if (feitas.has(f)) { console.log(`  = ${f}`); continue; }
    await sql(`begin;\n${readFileSync(`supabase/migrations/${f}`, "utf8")}\ninsert into ops.migracoes (nome) values (${lit(f)});\ncommit;`);
    console.log(`  + ${f}`);
  }
}

/** Segredo que a agenda (pg_cron) manda para a função. Gerado uma vez e guardado no .env.supabase.local. */
function cronSecret(): string {
  if (process.env.CRON_SECRET) return process.env.CRON_SECRET;
  const v = randomBytes(24).toString("hex");
  appendFileSync(".env.supabase.local", `
CRON_SECRET=${v}
`);
  process.env.CRON_SECRET = v;
  return v;
}

async function segredos() {
  const novos = [{ name: "CRON_SECRET", value: cronSecret() }];
  for (const k of ["ANTHROPIC_API_KEY", "ANTHROPIC_WORKSPACE_ID", "AGENT_MODEL", "AGENT_ORCAMENTO_USD_MES"]) if (process.env[k]) novos.push({ name: k, value: process.env[k]! });
  await mgmt("/secrets", { method: "POST", body: JSON.stringify(novos) });
  const temChave = ((await mgmt("/secrets")) as { name: string }[]).some((x) => x.name === "ANTHROPIC_API_KEY");
  console.log(`  segredos: ${novos.map((x) => x.name).join(", ")}${temChave ? "" : "  (ANTHROPIC_API_KEY ainda não: os agentes ficam instalados e respondem 'sem chave')"}`);
}

function funcao() {
  // CLI oficial via npx; --use-api empacota no servidor do Supabase (não precisa de Docker).
  execFileSync(process.platform === "win32" ? "npx.cmd" : "npx", ["--yes", "supabase@2", "functions", "deploy", "agentes", "--project-ref", REF, "--use-api", "--no-verify-jwt"], {
    stdio: "inherit", env: { ...process.env, SUPABASE_ACCESS_TOKEN: TOKEN }, shell: process.platform === "win32",
  });
}

async function agenda() {
  // O segredo do cron fica no Vault do Postgres e também na função (CRON_SECRET).
  const seg = cronSecret();
  const url = `https://${REF}.supabase.co/functions/v1/agentes`;
  await sql(`
    create extension if not exists pg_cron;
    create extension if not exists pg_net;
    do $v$ declare i uuid; begin
      select id into i from vault.secrets where name = 'cos_cron_secret';
      if i is null then perform vault.create_secret(${lit(seg)}, 'cos_cron_secret');
      else perform vault.update_secret(i, ${lit(seg)}); end if;
    end $v$;
    select cron.unschedule('cos-agentes-batida') where exists (select 1 from cron.job where jobname = 'cos-agentes-batida');
    select cron.schedule('cos-agentes-batida', '5 * * * *', $$
      select net.http_post(
        url := ${lit(url)},
        headers := jsonb_build_object('Content-Type', 'application/json',
          'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cos_cron_secret')),
        body := '{"op":"batida"}'::jsonb,
        timeout_milliseconds := 5000);
    $$);`);
  console.log("  agenda: batida de hora em hora (minuto 5) -> " + url);
}

async function kb() {
  const b = backendSupabase(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
  const arquivos = [
    ...readdirSync("foundation/knowledge-base/pilares").map((f) => `foundation/knowledge-base/pilares/${f}`),
    "foundation/creative-doctrine.md", "foundation/editorial-architecture.md", "foundation/formats.md", "foundation/content-model.md",
  ].filter((f) => f.endsWith(".md") && existsSync(f));
  // proposals/ são anotações de como a KB foi montada, não método: ficam fora da busca.
  await b.apagarKB(null, "knowledge-base/proposals/01-instagram-organico.md");
  let n = 0;
  for (const f of arquivos) {
    const trechos = trechosDoMarkdown(f.replace(/^foundation\//, ""), readFileSync(f, "utf8"));
    await b.apagarKB(null, trechos[0]?.fonte ?? f);
    await b.inserirKB(null, trechos);
    n += trechos.length;
  }
  console.log(`  KB: ${arquivos.length} arquivos, ${n} trechos`);
}

async function auth() {
  const painel = process.env.PAINEL_URL;
  if (!painel) { console.log("  auth: defina PAINEL_URL (endereço do painel publicado) para liberar o login por link."); return; }
  await mgmt("/config/auth", { method: "PATCH", body: JSON.stringify({ site_url: painel, uri_allow_list: `${painel},${painel}/**,http://localhost:3000/**` }) });
  console.log(`  auth: login liberado para ${painel}`);
}

const passos: Record<string, () => unknown> = { migrations, segredos, funcao, agenda, kb, auth };
const pedidos = process.argv.slice(2).filter((a) => passos[a]);
for (const p of pedidos.length ? pedidos : Object.keys(passos)) {
  console.log(`▶ ${p}`);
  await passos[p]!();
}
console.log("✅ pronto");
