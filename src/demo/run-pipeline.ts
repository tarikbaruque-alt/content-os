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
const OUT_PATH = "apps/web/generated-plan.json";

/** Grava o que já foi gerado até agora — nunca perde progresso por causa de
 * uma falha num cliente seguinte (ex.: rate limit, créditos, rede). */
function save(out: Record<string, unknown>) {
  writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), "utf8");
}

async function main() {
  const llm = createLlmProvider(); // usa Anthropic se configurado no .env, senão mock
  const out: Record<string, unknown> = {};
  let failed = 0;

  for (const client of PIPELINE_CLIENTS) {
    try {
      const r = await runPipeline(client, client.briefing, client.source, {
        llm,
        total: 12,
        funnelMix: { topo: 45, meio: 35, fundo: 20 },
        minIdeas: 15,
      });
      out[client.id] = r;
      save(out); // grava a cada cliente concluído — progresso nunca se perde

      console.log(`\n=== Content OS · ${r.clientName} · provider=${r.provider} ===`);
      console.log(`Content DNA: ${r.dna.length} registros`);
      console.log(`Big Message: ${r.strategy.bigMessage}`);
      console.log(`Ideias: ${r.ideas.length} · Calendário: ${r.calendar.items.length} conteúdos`);
      const sample = r.calendar.items[0];
      if (sample) console.log(`Exemplo: ${sample.content.headline}`);
      if (r.warnings.length) console.log(`⚠️ ${r.warnings.join(" | ")}`);
    } catch (e) {
      failed++;
      console.error(`\n❌ Falhou para ${client.name}: ${e instanceof Error ? e.message : e}`);
    }
  }

  console.log(
    `\n✅ Plano gerado para ${Object.keys(out).length}/${PIPELINE_CLIENTS.length} clientes, gravado em ${OUT_PATH}`,
  );
  if (failed) {
    console.log(`⚠️ ${failed} cliente(s) falharam — rode de novo depois para completar (progresso já salvo).`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error("Erro no pipeline:", e);
  process.exit(1);
});
