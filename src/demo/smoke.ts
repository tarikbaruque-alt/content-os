import { runPipeline } from "../pipeline/run.js";
import { createLlmProvider } from "../core/llm/index.js";
import { loadDotenv } from "../core/env.js";
import { PIPELINE_BRIEFING, PIPELINE_CLIENT, PIPELINE_SOURCE } from "./pipeline-client.js";

loadDotenv();

/**
 * `npm run smoke` — verificação ponta a ponta da V1.
 *
 * Roda o pipeline completo para o cliente-exemplo e confere as invariantes que
 * garantem que o sistema está de pé (DNA → Estratégia → Ideias → Produção →
 * Carrossel → Stories → Notion), incluindo o esqueleto estratégico. Sai com
 * código 1 se qualquer verificação falhar — serve para CI e para você.
 */

let failed = 0;
function check(label: string, ok: boolean, detail = "") {
  console.log(`  ${ok ? "✅" : "❌"} ${label}${detail ? " — " + detail : ""}`);
  if (!ok) failed++;
}

async function main() {
  const llm = createLlmProvider();
  console.log(`\n=== Content OS · Smoke test (provider=${llm.name}) ===\n`);
  const r = await runPipeline(PIPELINE_CLIENT, PIPELINE_BRIEFING, PIPELINE_SOURCE, {
    llm,
    total: 12,
    funnelMix: { topo: 45, meio: 35, fundo: 20 },
    minIdeas: 15,
  });

  console.log("Content DNA & Estratégia:");
  check("Content DNA estruturado (>8 registros)", r.dna.length > 8, `${r.dna.length} registros`);
  check("Estratégia com 15 caminhos + mix soma 100%", r.strategy.paths.length === 15 && r.strategy.mix.reduce((a, m) => a + m.pct, 0) === 100);
  check("Big Message e posicionamento presentes", r.strategy.bigMessage.length > 20 && r.strategy.posicionamento.length > 10);

  console.log("\nIdeias & esqueleto estratégico:");
  check("≥15 ideias", r.ideas.length >= 15, `${r.ideas.length}`);
  check("cada ideia tem Propósito + Big Message + formatRec", r.ideas.every((i) => i.proposito.length > 15 && i.bigMessage.length > 10 && !!i.formatRec.producao));
  check("bibliotecas expostas (16 gatilhos + 17 elementos)", r.libraries.gatilhos.length === 16 && r.libraries.elementos.length === 17);

  console.log("\nProdução (Rima · Mosaico · Enredo):");
  const items = r.calendar.items;
  check("calendário com conteúdos", items.length > 0, `${items.length} peças`);
  check("copy em CURTA/MÉDIA/LONGA (todas com hook+CTA)", items.every((it) => {
    const cv = it.content.copyVariants;
    return [cv.curta, cv.media, cv.longa].every((c) => c.startsWith(it.idea.hook) && c.includes(it.content.cta));
  }));
  check("gatilhos + elementos recomendados em cada peça", items.every((it) => it.content.gatilhosRec.length > 0 && it.content.elementosRec.length > 0));
  check("carrossel pronto (capa→…→CTA, ≥5 slides)", items.every((it) => it.carousel.slides.length >= 5 && it.carousel.slides[0]!.papel === "Capa"));
  check("sequência de Stories com progressão (≥4 stories)", items.every((it) => it.stories.stories.length >= 4 && it.stories.progressao.length > 0));

  console.log("\nSaída & governança:");
  check("Notion: 1 página por peça, com cadeia estratégica", r.notion.length === items.length && r.notion.every((p) => p.properties["Emoção"] && p.properties["Função estratégica"]));
  const kinds = new Set(r.performance.map((p) => p.kind));
  check("Performance distingue DATA/HYPOTHESIS/…/RECOMMENDATION", ["DATA", "HYPOTHESIS", "INTERPRETATION", "INSIGHT", "RECOMMENDATION"].every((k) => kinds.has(k as never)));
  check("Personalização (teste do concorrente)", /emoç|document|registr|foto|natural/i.test(r.strategy.bigMessage + " " + r.strategy.posicionamento));

  console.log(`\n---\n${failed === 0 ? "🎉 SMOKE OK — a V1 está de pé." : `❌ ${failed} verificação(ões) falharam.`}\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("Erro no smoke:", e);
  process.exit(1);
});
