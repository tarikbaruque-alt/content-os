import { readFileSync, writeFileSync } from "node:fs";
import { FORMATOS, FN_ALTERNATIVAS } from "../pipeline/formats.js";
import { GENERIC_PROFILE, NICHE_PROFILES } from "../pipeline/niche-formats.js";
import { GATILHOS } from "../agents/creative/triggers.js";
import { ELEMENTOS } from "../agents/creative/devices.js";

/**
 * Embute no painel as bibliotecas (formatos, gatilhos, elementos) + o guia por nicho (fonte única:
 * src/pipeline/formats.ts e niche-formats.ts), entre os marcadores
 * NICHE_FORMATS_START/END, e mantém as três cópias do painel idênticas.
 *
 *   npm run panel:sync
 */
const COPIES = ["apps/web/index.html", "apps/web/app.html", "AGENTES INTELIGENTES/painel.html"];
const START = "/*__NICHE_FORMATS_START__*/";
const END = "/*__NICHE_FORMATS_END__*/";

const data = { formatos: FORMATOS, perfis: NICHE_PROFILES, generico: GENERIC_PROFILE, alternativas: FN_ALTERNATIVAS, gatilhos: GATILHOS, elementos: ELEMENTOS };
const block = `${START} var NICHE_FORMATS=${JSON.stringify(data)}; ${END}`;

const html = readFileSync(COPIES[0]!, "utf8");
const a = html.indexOf(START);
const b = html.indexOf(END);
if (a < 0 || b < a) throw new Error(`Marcadores ${START} … ${END} não encontrados em ${COPIES[0]}`);
const out = html.slice(0, a) + block + html.slice(b + END.length);
for (const f of COPIES) writeFileSync(f, out, "utf8");
console.log(`✅ Painel sincronizado: ${FORMATOS.length} formatos · ${NICHE_PROFILES.length} nichos → ${COPIES.join(", ")}`);
