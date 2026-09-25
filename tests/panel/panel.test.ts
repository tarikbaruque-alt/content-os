import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import { FORMATOS, FN_ALTERNATIVAS } from "../../src/pipeline/formats.js";
import { GENERIC_PROFILE, NICHE_PROFILES } from "../../src/pipeline/niche-formats.js";
import { GATILHOS } from "../../src/agents/creative/triggers.js";
import { ELEMENTOS } from "../../src/agents/creative/devices.js";

/**
 * Rede de segurança do painel (arquivo único grande, em 3 cópias): pega as
 * quebras mais comuns antes que cheguem ao navegador.
 */
const COPIES = ["apps/web/index.html", "apps/web/app.html", "AGENTES INTELIGENTES/painel.html"];
const html = readFileSync(COPIES[0]!, "utf8");

describe("Painel (apps/web)", () => {
  it("as três cópias são idênticas (rode `npm run panel:sync` após editar)", () => {
    for (const f of COPIES.slice(1)) expect(readFileSync(f, "utf8") === html, f).toBe(true);
  });

  it("as bibliotecas (formatos, nichos, gatilhos, elementos) embutidas está em dia com o código", () => {
    const m = html.match(/\/\*__NICHE_FORMATS_START__\*\/ var NICHE_FORMATS=(.*); \/\*__NICHE_FORMATS_END__\*\//);
    expect(m).not.toBeNull();
    const embedded = JSON.parse(m![1]!);
    expect(embedded).toEqual(JSON.parse(JSON.stringify({ formatos: FORMATOS, perfis: NICHE_PROFILES, generico: GENERIC_PROFILE, alternativas: FN_ALTERNATIVAS, gatilhos: GATILHOS, elementos: ELEMENTOS })));
  });

  it("todo JavaScript inline compila (sem erro de sintaxe)", () => {
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((x) => x[1]!);
    expect(scripts.length).toBeGreaterThan(0);
    for (const code of scripts) expect(() => new Script(code)).not.toThrow();
  });

  it("toda view do menu tem sua seção e seu título", () => {
    const nav = [...html.matchAll(/\["([a-z]+)","[^"]+"\]/g)].map((x) => x[1]!);
    const views = new Set(nav.filter((v) => ["overview", "ativos", "clients", "analyze", "dna", "plan", "strategy", "research", "editorial", "ideas", "formats", "distribution", "content", "calendar", "approvals", "performance", "kb", "agents", "config"].includes(v)));
    for (const v of views) {
      expect(html.includes(`data-view="${v}"`), `seção ${v}`).toBe(true);
      expect(new RegExp(`[{,]${v}:\\["`).test(html), `título ${v}`).toBe(true);
    }
  });
});
