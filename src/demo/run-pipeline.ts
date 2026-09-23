import { writeFileSync } from "node:fs";
import { runPipeline } from "../pipeline/run.js";
import { createLlmProvider } from "../core/llm/index.js";
import { loadDotenv } from "../core/env.js";
import { PIPELINE_CLIENTS } from "./pipeline-client.js";

loadDotenv(); // lê o .env da raiz automaticamente

/**
 * Roda o Content OS ponta a ponta para todos os clientes fictícios (um por
 * nicho) e grava um mapa {clientId: PipelineResult} em
 * apps/web/generated-plan.json (para o painel mostrar dado real de TODOS os
 * clientes, não só de um).
 */
async function main() {
  const llm = createLlmProvider(); // usa Anthropic se configurado no .env, senão mock
  const out: Record<string, unknown> = {};

  for (const client of PIPELINE_CLIENTS) {
    const r = await runPipeline(client, client.briefing, client.source, {
      llm,
      total: 12,
      funnelMix: { topo: 45, meio: 35, fundo: 20 },
      minIdeas: 15,
    });
    out[client.id] = r;

    console.log(`\n=== Content OS · ${r.clientName} · provider=${r.provider} ===`);
    console.log(`Content DNA: ${r.dna.length} registros`);
    console.log(`Big Message: ${r.strategy.bigMessage}`);
    console.log(`Ideias: ${r.ideas.length} · Calendário: ${r.calendar.items.length} conteúdos`);
    const sample = r.calendar.items[0];
    if (sample) console.log(`Exemplo: ${sample.content.headline}`);
    if (r.warnings.length) console.log(`⚠️ ${r.warnings.join(" | ")}`);
  }

  const path = "apps/web/generated-plan.json";
  writeFileSync(path, JSON.stringify(out, null, 2), "utf8");
  console.log(`\n✅ Plano gerado para ${PIPELINE_CLIENTS.length} clientes, gravado em ${path}\n`);
}

main().catch((e) => {
  console.error("Erro no pipeline:", e);
  process.exit(1);
});
