import { writeFileSync } from "node:fs";
import { runPipeline } from "../pipeline/run.js";
import { PIPELINE_BRIEFING, PIPELINE_CLIENT, PIPELINE_SOURCE } from "./pipeline-client.js";

/**
 * Roda o Content OS ponta a ponta para o cliente fictício e:
 *  - imprime um resumo (revisão como estrategista sênior);
 *  - grava o plano gerado em apps/web/generated-plan.json (para o painel).
 */
async function main() {
  const r = await runPipeline(PIPELINE_CLIENT, PIPELINE_BRIEFING, PIPELINE_SOURCE, {
    total: 12,
    funnelMix: { topo: 45, meio: 35, fundo: 20 },
    minIdeas: 15,
  });

  console.log(`\n=== Content OS · Pipeline ponta a ponta · provider=${r.provider} ===\n`);
  console.log(`Cliente: ${r.clientName}`);
  console.log(`Content DNA: ${r.dna.length} registros`);
  console.log(`\nEstratégia:`);
  console.log(`  Posicionamento: ${r.strategy.posicionamento}`);
  console.log(`  Big Message:    ${r.strategy.bigMessage}`);
  console.log(`  Funções:        ${r.strategy.funcoes.join(", ")}`);
  console.log(`  Pilares:        ${r.strategy.pilares.map((p) => p.split(":")[0]).join(" · ")}`);
  console.log(`\nIdeias geradas: ${r.ideas.length}`);
  r.ideas.slice(0, 15).forEach((i, n) => console.log(`  ${n + 1}. [${i.funil}/${i.funcao}] ${i.titulo}`));
  console.log(`\nCalendário: ${r.calendar.items.length} conteúdos (topo ${r.calendar.mix.topo} · meio ${r.calendar.mix.meio} · fundo ${r.calendar.mix.fundo})`);
  const sample = r.calendar.items[0];
  if (sample) {
    console.log(`\nExemplo de conteúdo pronto — ${sample.content.headline}`);
    console.log(`  Emoção: ${sample.content.emocao} — ${sample.content.emocaoPor.slice(0, 90)}…`);
    (sample.content.roteiro ?? sample.content.slides ?? sample.content.stories ?? []).forEach((s) =>
      console.log(`  ${s.label}: ${s.text}`),
    );
    console.log(`  Copy: ${sample.content.copy.replace(/\n/g, " ")}`);
  }
  console.log(`\nNotion: ${r.notion.length} páginas prontas para sincronizar (payload gerado, sem chamada real).`);
  if (r.warnings.length) console.log(`\n⚠️ ${r.warnings.join(" | ")}`);

  const out = "apps/web/generated-plan.json";
  writeFileSync(out, JSON.stringify(r, null, 2), "utf8");
  console.log(`\n✅ Plano gerado gravado em ${out}\n`);
}

main().catch((e) => {
  console.error("Erro no pipeline:", e);
  process.exit(1);
});
