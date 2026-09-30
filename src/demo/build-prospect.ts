import { build } from "esbuild";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Monta a Mesa de Prospecção em um único HTML (é publicada como Artifact).
 * O motor (src/prospect, testado) é empacotado como window.MesaEngine e as
 * telas (apps/prospect/src) rodam em cima dele.
 *   index.html → fragmento para publicar no Artifact (o envelope é adicionado na publicação)
 *   app.html   → documento completo para abrir direto no navegador
 */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SRC = join(ROOT, "apps", "prospect", "src");

const RESET = `:root{color-scheme:light}html,body{margin:0}body{font:14px system-ui,sans-serif;background:#fafaf9}img{max-width:100%}[hidden]{display:none!important}`;

export async function buildProspect(): Promise<{ fragment: string; standalone: string }> {
  const files = readdirSync(SRC).sort();
  const read = (f: string) => readFileSync(join(SRC, f), "utf8");
  const head = read(files.find((f) => f.startsWith("00-"))!);
  const css = read(files.find((f) => f.startsWith("10-"))!);
  const body = read(files.find((f) => f.startsWith("20-"))!);
  const ui = files.filter((f) => /^(3|4|9)\d-.*\.js$/.test(f)).map(read).join("\n");

  const out = await build({
    entryPoints: [join(ROOT, "src", "prospect", "browser.ts")],
    bundle: true, format: "iife", target: "es2020", minify: true, write: false, legalComments: "none",
  });
  const engine = out.outputFiles[0]!.text.replace(/<\/script/gi, "<\\/script");
  const uiSafe = ui.replace(/<\/script/gi, "<\\/script");

  const fragment = `${head.trim()}\n<style>\n${css.trim()}\n</style>\n${body.trim()}\n<script>${engine}</script>\n<script>\n(function () {\n'use strict';\n${uiSafe}\n})();\n</script>\n`;
  const standalone = `<!doctype html>\n<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>${RESET}</style></head><body>\n${fragment}</body></html>\n`;
  return { fragment, standalone };
}

const invoked = process.argv[1] ? resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
if (invoked) {
  const { fragment, standalone } = await buildProspect();
  writeFileSync(join(ROOT, "apps", "prospect", "index.html"), fragment);
  writeFileSync(join(ROOT, "apps", "prospect", "app.html"), standalone);
  console.log(`apps/prospect/index.html (${(fragment.length / 1024).toFixed(0)} KB) e app.html gerados.`);
}
