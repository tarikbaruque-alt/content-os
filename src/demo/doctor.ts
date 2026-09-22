import { createNotionSyncFromEnv } from "../core/integrations/notion-sync.js";
import { DEFAULT_ANTHROPIC_MODEL } from "../core/llm/anthropic.js";

/**
 * `npm run doctor` — diagnóstico das integrações do Content OS.
 *
 * Não escreve nada em lugar nenhum (Notion: só lê o schema; Anthropic: um
 * ping mínimo). Diz, em português claro, o que está OK e o que falta —
 * incluindo dicas de liberação de rede quando a conexão é bloqueada.
 */

type Check = { label: string; ok: boolean; detail: string; fix?: string };

const OK = "✅";
const NO = "❌";
const WARN = "⚠️";

function net(err: unknown): { blocked: boolean; msg: string } {
  const msg = err instanceof Error ? err.message : String(err);
  const blocked = /fetch failed|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|CONNECT|403|407|tunnel|network|TLS|certificate/i.test(msg);
  return { blocked, msg };
}

async function checkAnthropic(env: NodeJS.ProcessEnv): Promise<Check[]> {
  const checks: Check[] = [];
  const provider = (env.CONTENT_OS_LLM_PROVIDER ?? "mock").toLowerCase();
  const key = env.ANTHROPIC_API_KEY;
  const model = env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL;

  if (provider !== "anthropic") {
    checks.push({
      label: "Provider de IA",
      ok: false,
      detail: `CONTENT_OS_LLM_PROVIDER=${provider} → a Rima usa o modo determinístico (sem IA real).`,
      fix: "Defina CONTENT_OS_LLM_PROVIDER=anthropic para ligar a redação com IA.",
    });
    return checks;
  }
  checks.push({ label: "Provider de IA", ok: true, detail: `anthropic · modelo ${model}` });

  if (!key) {
    checks.push({
      label: "ANTHROPIC_API_KEY",
      ok: false,
      detail: "Não encontrada no ambiente.",
      fix: "Cadastre ANTHROPIC_API_KEY (console.anthropic.com) como credencial do ambiente.",
    });
    return checks;
  }
  checks.push({ label: "ANTHROPIC_API_KEY", ok: true, detail: `presente (…${key.slice(-4)})` });

  // Ping mínimo à Messages API.
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 8, messages: [{ role: "user", content: "ping" }] }),
    });
    if (res.ok) {
      checks.push({ label: "Conexão Anthropic", ok: true, detail: `${model} respondeu (HTTP ${res.status}).` });
    } else {
      const body = await res.text();
      checks.push({
        label: "Conexão Anthropic",
        ok: false,
        detail: `HTTP ${res.status}: ${body.slice(0, 160)}`,
        fix: res.status === 401 ? "Chave inválida/expirada — gere outra." : res.status === 404 ? `Modelo "${model}" não encontrado — confira ANTHROPIC_MODEL.` : "Verifique a chave e o modelo.",
      });
    }
  } catch (e) {
    const { blocked, msg } = net(e);
    checks.push({
      label: "Conexão Anthropic",
      ok: false,
      detail: msg.slice(0, 160),
      fix: blocked ? "Libere o host api.anthropic.com na política de rede do ambiente." : "Falha de rede ao chamar a API.",
    });
  }
  return checks;
}

async function checkNotion(env: NodeJS.ProcessEnv): Promise<Check[]> {
  const checks: Check[] = [];
  const key = env.NOTION_API_KEY;
  const db = env.NOTION_DATABASE_ID;

  if (!key) checks.push({ label: "NOTION_API_KEY", ok: false, detail: "Ausente.", fix: "Crie uma integração interna em notion.so/my-integrations e cadastre o token." });
  else checks.push({ label: "NOTION_API_KEY", ok: true, detail: `presente (${key.slice(0, 4)}…)` });

  if (!db) checks.push({ label: "NOTION_DATABASE_ID", ok: false, detail: "Ausente.", fix: "Copie os 32 caracteres do ID da URL do database." });
  else checks.push({ label: "NOTION_DATABASE_ID", ok: true, detail: `${db.slice(0, 8)}…` });

  const target = createNotionSyncFromEnv(env);
  if (!target) return checks;

  try {
    const schema = await target.fetchSchema();
    const props = Object.entries(schema.props);
    checks.push({
      label: "Conexão Notion (schema)",
      ok: true,
      detail: `Database lido: ${props.length} propriedades · title="${schema.titleProp || "?"}".`,
    });
    // Cobertura das propriedades que o sync sabe preencher.
    const wanted = ["Cliente", "Plataforma", "Formato", "Pilar", "Objetivo", "Funil", "Função estratégica", "Emoção", "CTA", "Status"];
    const names = new Set(props.map(([n]) => n.toLowerCase()));
    const missing = wanted.filter((w) => !names.has(w.toLowerCase()));
    if (!schema.titleProp) {
      checks.push({ label: "Coluna de título", ok: false, detail: "O database não tem propriedade do tipo title.", fix: "Toda página precisa de uma coluna title (ex.: Nome)." });
    }
    checks.push({
      label: "Cobertura de colunas",
      ok: missing.length === 0,
      detail: missing.length ? `Faltam (serão ignoradas): ${missing.join(", ")}` : "Todas as colunas da cadeia estratégica existem.",
      fix: missing.length ? "Opcional: crie essas colunas no database para não perder contexto." : undefined,
    });
  } catch (e) {
    const { blocked, msg } = net(e);
    const notShared = /404|Could not find|object_not_found/i.test(msg);
    checks.push({
      label: "Conexão Notion (schema)",
      ok: false,
      detail: msg.slice(0, 160),
      fix: blocked
        ? "Libere o host api.notion.com na política de rede do ambiente."
        : notShared
          ? "Conecte a integração ao database (••• → Connections) e confira o Database ID."
          : "Verifique token, ID e o compartilhamento do database.",
    });
  }
  return checks;
}

function print(title: string, checks: Check[]): boolean {
  console.log(`\n${title}`);
  let allOk = true;
  for (const c of checks) {
    const icon = c.ok ? OK : c.fix ? NO : WARN;
    if (!c.ok) allOk = false;
    console.log(`  ${icon} ${c.label}: ${c.detail}`);
    if (!c.ok && c.fix) console.log(`     → ${c.fix}`);
  }
  return allOk;
}

async function main() {
  console.log("=== Content OS · Doctor (diagnóstico de integrações) ===");
  const anthropic = await checkAnthropic(process.env);
  const notion = await checkNotion(process.env);
  const a = print("Anthropic (Rima — redação com IA):", anthropic);
  const n = print("Notion (sincronização):", notion);

  console.log("\n---");
  console.log(`Rima com IA real:   ${a ? OK + " pronta" : NO + " ainda não — veja acima"}`);
  console.log(`Notion sync:        ${n ? OK + " pronto (rode: npm run notion:sync)" : NO + " ainda não — veja acima"}`);
  if (a && n) console.log("\n🎉 Tudo conectado. Rode `npm run pipeline` (gera com IA) e depois `npm run notion:sync -- --authorize`.");
  else console.log("\nConfigure os itens marcados e rode `npm run doctor` de novo.");
}

main().catch((e) => {
  console.error("Erro no doctor:", e);
  process.exit(1);
});
