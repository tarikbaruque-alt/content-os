import { runPipeline } from "../pipeline/run.js";
import { createLlmProvider } from "../core/llm/index.js";
import { createNotionSyncFromEnv, mapPage, parseDatabaseSchema } from "../core/integrations/notion-sync.js";
import type { NotionDbSchema } from "../core/integrations/notion-sync.js";
import { loadDotenv } from "../core/env.js";
import { PIPELINE_BRIEFING, PIPELINE_CLIENT, PIPELINE_SOURCE } from "./pipeline-client.js";

loadDotenv(); // lê o .env da raiz automaticamente

/**
 * CLI de sincronização com o Notion.
 *
 *   npm run notion:sync            → DRY-RUN (mostra o que SERIA criado)
 *   npm run notion:sync -- --authorize   → cria de verdade (exige credenciais)
 *
 * GUARDRAIL: sem --authorize (ou NOTION_SYNC_AUTHORIZE=1), NADA é enviado.
 * Sem NOTION_API_KEY/NOTION_DATABASE_ID, roda um dry-run LOCAL (sem rede),
 * usando um schema de exemplo, só para você ver o mapeamento.
 */
async function main() {
  const authorize = process.argv.includes("--authorize") || process.env.NOTION_SYNC_AUTHORIZE === "1";
  const llm = createLlmProvider();
  const r = await runPipeline(PIPELINE_CLIENT, PIPELINE_BRIEFING, PIPELINE_SOURCE, {
    llm,
    total: 12,
    funnelMix: { topo: 45, meio: 35, fundo: 20 },
    minIdeas: 15,
  });

  console.log(`\n=== Content OS · Notion Sync · provider=${r.provider} ===`);
  console.log(`Cliente: ${r.clientName} — ${r.notion.length} páginas candidatas.\n`);

  const target = createNotionSyncFromEnv();
  if (!target) {
    console.log("ℹ️  Sem NOTION_API_KEY/NOTION_DATABASE_ID no ambiente — DRY-RUN LOCAL (sem rede).");
    const schema: NotionDbSchema = SAMPLE_SCHEMA;
    r.notion.slice(0, 3).forEach((p, i) => {
      const m = mapPage(p, schema);
      console.log(`\n[${i + 1}] ${m.title}`);
      console.log(`   Mapeadas: ${m.mappedKeys.join(", ") || "—"}`);
      console.log(`   Ignoradas (fora do schema/tipo): ${m.skippedKeys.join(", ") || "—"}`);
      console.log(`   Blocos de corpo: ${m.children.length}`);
    });
    console.log(`\nPara sincronizar de verdade: configure as credenciais e rode com --authorize.`);
    return;
  }

  const outcome = await target.sync(r.notion, { authorize });
  if (outcome.dryRun) {
    console.log("🔒 DRY-RUN (não autorizado): nada foi criado no Notion.");
    console.log(`   Database: ${outcome.plan.databaseId}`);
    if (outcome.plan.unmatchedProps.length)
      console.log(`   ⚠️ Propriedades sem correspondência no schema: ${outcome.plan.unmatchedProps.join(", ")}`);
    outcome.plan.pages.slice(0, 3).forEach((m, i) => {
      console.log(`\n[${i + 1}] ${m.title}`);
      console.log(`   Mapeadas: ${m.mappedKeys.join(", ") || "—"}`);
      console.log(`   Ignoradas: ${m.skippedKeys.join(", ") || "—"}`);
    });
    console.log(`\nRode novamente com --authorize para criar as ${outcome.plan.pages.length} páginas.`);
  } else {
    console.log(`✅ Sincronizado: ${outcome.created.length} páginas criadas.`);
    outcome.created.slice(0, 5).forEach((c) => console.log(`   • ${c.title} ${c.url ?? c.id}`));
    if (outcome.errors.length) {
      console.log(`\n⚠️ ${outcome.errors.length} erros:`);
      outcome.errors.slice(0, 5).forEach((e) => console.log(`   • ${e.title}: ${e.error}`));
    }
  }
}

// Schema de exemplo só para o dry-run local (não é o schema real do usuário).
const SAMPLE_SCHEMA = parseDatabaseSchema({
  id: "sample",
  properties: {
    Nome: { type: "title" },
    Cliente: { type: "rich_text" },
    Data: { type: "rich_text" },
    Tema: { type: "rich_text" },
    Plataforma: { type: "select" },
    Formato: { type: "select" },
    Pilar: { type: "select" },
    Persona: { type: "rich_text" },
    Objetivo: { type: "rich_text" },
    Funil: { type: "select" },
    "Função estratégica": { type: "select" },
    "Big Message": { type: "rich_text" },
    Emoção: { type: "select" },
    Headline: { type: "rich_text" },
    CTA: { type: "rich_text" },
    Status: { type: "status" },
  },
});

main().catch((e) => {
  console.error("Erro na sincronização:", e);
  process.exit(1);
});
