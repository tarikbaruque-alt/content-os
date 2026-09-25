import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { FORMATOS, FN_ALTERNATIVAS } from "../pipeline/formats.js";
import { GENERIC_PROFILE, NICHE_PROFILES } from "../pipeline/niche-formats.js";
import { GATILHOS } from "../agents/creative/triggers.js";
import { ELEMENTOS } from "../agents/creative/devices.js";

/**
 * Monta o painel a partir das partes em apps/web/src (fonte única, organizada
 * por assunto), embute as bibliotecas (formatos, gatilhos, elementos) + o guia
 * por nicho entre os marcadores NICHE_FORMATS_START/END e grava as três cópias
 * idênticas do painel.
 *
 *   npm run panel:sync
 *
 * Edite sempre as partes em apps/web/src — nunca o index.html diretamente.
 */
export const PARTS_DIR = "apps/web/src";
export const COPIES = ["apps/web/index.html", "apps/web/app.html", "AGENTES INTELIGENTES/painel.html"];
const START = "/*__NICHE_FORMATS_START__*/";
const END = "/*__NICHE_FORMATS_END__*/";

/** Nomes das partes, na ordem em que formam o painel (prefixo numérico). */
export function partNames(): string[] {
  return readdirSync(PARTS_DIR).filter((f) => /^\d{2}-/.test(f)).sort();
}

/** Junta as partes exatamente como estão (sem nenhuma transformação). */
export function joinParts(): string {
  return partNames().map((f) => readFileSync(`${PARTS_DIR}/${f}`, "utf8")).join("");
}

export const ICONES_DIR = "apps/web/assets/icones";
export function iconesPart(): string {
  const nomes = readdirSync(ICONES_DIR).filter((f) => f.endsWith(".svg")).sort();
  const mapa: Record<string, string> = {};
  for (const f of nomes) {
    mapa[f.replace(/\.svg$/, "")] = readFileSync(`${ICONES_DIR}/${f}`, "utf8")
      .replace(/\s(preserveAspectRatio|overflow|style)="[^"]*"/g, "")
      .replace(/(stroke|fill)="#(?:2A2A2A|4D4AEA|57595B|8C8E90|2a2a2a|4d4aea)"/g, '$1="currentColor"')
      .replace(/\s+id="[^"]*"/g, "")
      .replace(/\n\s*/g, "");
  }
  return `// Gerado por npm run panel:sync a partir de ${ICONES_DIR} (Untitled UI, via Figma). Não edite à mão.\nvar ICONES_UI=${JSON.stringify(mapa)};\n`;
}

function main(): void {
  const data = { formatos: FORMATOS, perfis: NICHE_PROFILES, generico: GENERIC_PROFILE, alternativas: FN_ALTERNATIVAS, gatilhos: GATILHOS, elementos: ELEMENTOS };
  // O texto das bibliotecas aparece no painel: travessão e seta viram vírgula (a fonte fica como está).
  const semTravessao = JSON.stringify(data).replace(/\s+[—→]\s+/g, ", ");
  const block = `${START} var NICHE_FORMATS=${semTravessao}; ${END}`;

  // Atualiza o bloco das bibliotecas na própria parte que o contém (a fonte continua a verdade).
  const dona = partNames().find((f) => readFileSync(`${PARTS_DIR}/${f}`, "utf8").includes(START));
  if (!dona) throw new Error(`Marcadores ${START} … ${END} não encontrados em ${PARTS_DIR}`);
  const txt = readFileSync(`${PARTS_DIR}/${dona}`, "utf8");
  const a = txt.indexOf(START);
  const b = txt.indexOf(END);
  if (b < a) throw new Error(`Marcadores fora de ordem em ${PARTS_DIR}/${dona}`);
  writeFileSync(`${PARTS_DIR}/${dona}`, txt.slice(0, a) + block + txt.slice(b + END.length), "utf8");

  // Ícones do Untitled UI (apps/web/assets/icones, baixados do Figma): viram uma parte
  // do painel. A cor fixa do traço vira currentColor para o ícone seguir o texto
  // (item ativo, tema escuro); o desenho vetorial fica idêntico.
  writeFileSync(`${PARTS_DIR}/29-icones-untitled.js`, iconesPart(), "utf8");

  const out = joinParts();
  for (const f of COPIES) writeFileSync(f, out, "utf8");
  console.log(`✅ Painel montado de ${partNames().length} partes (${PARTS_DIR}): ${FORMATOS.length} formatos · ${NICHE_PROFILES.length} nichos → ${COPIES.join(", ")}`);
}

if (process.argv[1] && /sync-panel\.(ts|js)$/.test(process.argv[1])) main();
