import { createLlmProvider } from "../core/llm/index.js";
import { KnowledgeRetriever } from "../core/knowledge/retriever.js";
import { FileContentDnaStore } from "../core/content-dna/file-store.js";
import { Orchestrator } from "../core/orchestrator/orchestrator.js";
import { loadDotenv } from "../core/env.js";

loadDotenv(); // lê o .env da raiz automaticamente
import { ingestSuggestions } from "../core/content-dna/governance.js";
import { runIntelligenceAgent } from "../agents/intelligence/index.js";
import type { IntelligenceInput, IntelligenceOutput } from "../agents/intelligence/schema.js";
import { MEMORY_STATES } from "../core/schema.js";
import { SAMPLE_CLIENTS } from "./sample-clients.js";

/**
 * Demo do agente Inteligência (Íris) rodando em 3 clientes de nichos distintos.
 * Usa o provider definido no ambiente (default: mock). Persiste as sugestões
 * como PENDENTES no Content DNA (store em arquivos ./data).
 */
async function main() {
  const store = new FileContentDnaStore();
  const ctx = {
    llm: createLlmProvider(),
    knowledge: new KnowledgeRetriever(),
    store,
  };
  const maestro = new Orchestrator(ctx);
  maestro.register<IntelligenceInput, IntelligenceOutput>("intelligence", runIntelligenceAgent);

  console.log(`\n=== Content OS · Agente Inteligência (Íris) · provider=${ctx.llm.name} ===\n`);

  for (const sample of SAMPLE_CLIENTS) {
    await store.upsertClient(sample.client);
    const result = await maestro.run<IntelligenceInput, IntelligenceOutput>(
      "intelligence",
      sample.client.id,
      sample.input,
    );

    const bySection = new Map<string, typeof result.output.suggestions>();
    for (const s of result.output.suggestions) {
      const list = bySection.get(s.section) ?? [];
      list.push(s);
      bySection.set(s.section, list);
    }

    console.log(`\n############################################################`);
    console.log(`# ${sample.client.name}  (${sample.client.niche})`);
    console.log(`############################################################`);
    console.log(`Sugestões: ${result.output.suggestions.length} | precisa aprovação: ${result.needsHumanApproval}`);
    console.log(`Estados: ${MEMORY_STATES.map((st) => `${st}=${result.output.suggestions.filter((s) => s.state === st).length}`).join("  ")}`);
    if (result.warnings.length) console.log(`Guardrails: ${result.warnings.join(" | ")}`);

    for (const [section, list] of bySection) {
      console.log(`\n  ▸ ${section}`);
      for (const s of list) {
        console.log(`    [${s.state}] ${s.field}: ${s.value}`);
        console.log(`        ↳ fonte: ${s.provenance.source} (conf. ${s.provenance.confidence})`);
      }
    }

    // Ingestão como PENDENTE (nada é aprovado automaticamente).
    const ingest = await ingestSuggestions(store, result.output);
    console.log(`\n  → ${ingest.entries.length} registros pendentes gravados no Content DNA (rebaixados: ${ingest.downgraded}).`);
    console.log(`  → trace: ${result.trace.steps.length} passos, ${result.trace.durationMs}ms`);
  }

  console.log(`\n✅ Demo concluída. Dados persistidos em ./data/clients/*.json\n`);
}

main().catch((err) => {
  console.error("Erro na demo:", err);
  process.exit(1);
});
