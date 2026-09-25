import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import { FORMATOS, FN_ALTERNATIVAS } from "../../src/pipeline/formats.js";
import { GENERIC_PROFILE, NICHE_PROFILES } from "../../src/pipeline/niche-formats.js";
import { GATILHOS } from "../../src/agents/creative/triggers.js";
import { ELEMENTOS } from "../../src/agents/creative/devices.js";
import { joinParts, partNames } from "../../src/demo/sync-panel.js";

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

  it("o painel é exatamente a junção das partes em apps/web/src (edite as partes e rode `npm run panel:sync`)", () => {
    expect(partNames().length).toBeGreaterThan(5);
    expect(joinParts() === html).toBe(true);
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

  it("nenhuma função declarada duas vezes (o painel é um escopo só: a segunda apaga a primeira em silêncio)", () => {
    const nomes = [...html.matchAll(/^ {2}(?:async )?function ([A-Za-z_$][\w$]*)\(/gm)].map((m) => m[1]!);
    const repetidos = nomes.filter((n, i) => nomes.indexOf(n) !== i);
    expect(repetidos).toEqual([]);
  });

  it("toda view do menu tem sua seção e seu título", () => {
    const nav = [...html.matchAll(/\["([a-z]+)","[^"]+"\]/g)].map((x) => x[1]!);
    const views = new Set(nav.filter((v) => ["overview", "propostas", "ativos", "clients", "analyze", "dna", "plan", "strategy", "research", "editorial", "ideas", "formats", "distribution", "content", "calendar", "approvals", "performance", "kb", "agents", "config"].includes(v)));
    for (const v of views) {
      expect(html.includes(`data-view="${v}"`), `seção ${v}`).toBe(true);
      expect(new RegExp(`[{,]${v}:\\["`).test(html), `título ${v}`).toBe(true);
    }
  });

  // Roda funções reais do painel isoladas (vm), com as constantes do próprio painel.
  function panelSandbox(names: string[]) {
    const pick = (re: RegExp, what: string) => { const m = html.match(re); expect(m, what).not.toBeNull(); return m![0]; };
    const vars = ["ROTINA_PADRAO", "TEMPO_OPC", "CAPACIDADE", "BRIEF_FREQ", "DIAS_PADRAO", "DIAS_SEM_LONGO"].map((v) => pick(new RegExp(`var ${v}=.*?;\\n`), v));
    const fns = names.map((f) => pick(new RegExp(`function ${f}\\([\\s\\S]*?\\n  }\\n`), f));
    const ctx: Record<string, unknown> = { DB_CLIENTS: {} };
    new Script(vars.join("") + fns.join("") + `this.out={${names.join(",")}};`).runInNewContext(ctx);
    return ctx as { DB_CLIENTS: Record<string, unknown>; out: { [k: string]: (...a: unknown[]) => any } };
  }

  it("briefing do formulário vira ficha, metas e rotina (frequência, dias espalhados, gravação, funil)", () => {
    const sb = panelSandbox(["rotinaOf", "fichaDoBriefing"]);
    sb.DB_CLIENTS["c1"] = { id: "c1", name: "Cliente", ficha: {} };
    const rec = sb.out.fichaDoBriefing!("c1", {
      name: "Cliente", niche: "Educador Físico", tempo: "Até 30 min", frequencia: "3 por semana",
      dias: "Seg, Ter, Qua, Qui, Sex", gravdia: "Quinta", funil: "Aquecer e educar quem já me segue (meio)",
      objetivo: "Ter mais autoridade / ser referência no assunto, Vender mais / gerar pedidos",
    });
    expect(rec.rotina.diasPost).toEqual([1, 3, 5]);
    expect(rec.rotina.gravDia).toBe(4);
    expect(rec.rotina.maxGrav).toBe(1);
    expect(rec.rotina.foco).toBe("meio");
    expect(rec.metas.objetivos).toEqual(["Ter mais autoridade / ser referência no assunto", "Vender mais / gerar pedidos"]);
  });

  it("colar o briefing no Content DNA aplica a rotina, e rate_limited trava o botão sem repetir sozinho", () => {
    expect(html).toMatch(/var pb=parseBriefing\(briefing\);\s*if\(pb&&isDbClient\(id\)\)\{try\{await saveClientRecord\(id,Object\.assign\(fichaDoBriefing\(id,pb\)/);
    const sb = panelSandbox(["cooldownBtn"]);
    const btn = { textContent: "Analisar", disabled: false, isConnected: false };
    expect(sb.out.cooldownBtn!(btn, { code: "rate_limited" }, 60)).toBe(true);
    expect(btn.disabled).toBe(true);
    expect(sb.out.cooldownBtn!({ ...btn, disabled: false }, { code: "invalid_json" }, 60)).toBe(false);
  });
});
