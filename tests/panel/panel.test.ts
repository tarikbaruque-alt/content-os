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

  it("toda view do menu tem sua seção e seu título", () => {
    const nav = [...html.matchAll(/\["([a-z]+)","[^"]+"\]/g)].map((x) => x[1]!);
    const views = new Set(nav.filter((v) => ["overview", "ativos", "clients", "analyze", "dna", "plan", "strategy", "research", "editorial", "ideas", "formats", "distribution", "content", "calendar", "approvals", "performance", "kb", "agents", "config"].includes(v)));
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

  it("briefing curto: respostas viram ficha, público, objeções, rotina e meta; briefing antigo continua sendo lido", () => {
    const bloco = (v: string) => { const m = html.match(new RegExp(`  var ${v}=[\\s\\S]*?;\\n(?=  (?:var|function|//))`)); expect(m, v).not.toBeNull(); return m![0]; };
    const fn = (f: string) => { const m = html.match(new RegExp(`  function ${f}\\([\\s\\S]*?\\n  }\\n`)); expect(m, f).not.toBeNull(); return m![0]; };
    const src = ["TEMPO_OPC", "DIAS_SEM_LONGO", "BRIEF_MARK", "BRIEF_FREQ", "BRIEF_TEMPO", "BRIEF_TOM", "BRIEF_OBJ_FUNIL", "BRIEF_FORM", "BRIEF_ANTIGO"].map(bloco).join("")
      + fn("normalizeTextPanel") + fn("parseBriefing") + "this.parse=parseBriefing;";
    const ctx: { parse?: (t: string) => Record<string, string> | null } = {};
    new Script(src).runInNewContext(ctx);
    const r = (pares: [string, string][]) => "📋 BRIEFING DE CONTEÚDO\n" + pares.map(([l, v]) => `\n▸ ${l}\n${v}\n`).join("");
    const novo = ctx.parse!(r([
      ["Seu nome ou nome da marca", "Carol Pedrosa"], ["Sua área de atuação", "Nutricionista"], ["Tipo de atendimento", "Os dois"], ["Cidade / bairro", "Botafogo"],
      ["Idade do cliente ideal", "26 a 35, 36 a 50"], ["Em que momento ele está?", "Quer emagrecer sem dieta restritiva"],
      ["O que faz a pessoa hesitar antes de fechar com você", "Preço"], ["Outro motivo", "Acha que não vai manter"],
      ["Pergunta 1", "Posso comer pão à noite?"], ["Pergunta 2", "Precisa cortar doce?"], ["Como você fala", "Acolhedor, Técnico e direto"],
      ["O que você quer com o Instagram agora?", "Vender mais"], ["Qual é a sua principal meta para os próximos 3 meses?", "Fechar 10 clientes"],
      ["Quantos posts por semana?", "4 por semana"], ["Tempo para gravar por semana", "30 min"],
    ]))!;
    expect(novo.regiao).toBe("Presencial e online · Botafogo");
    expect(novo.publico).toBe("Quer emagrecer sem dieta restritiva; idade: 26 a 35, 36 a 50");
    expect(novo.objecoes).toBe("Preço, Acha que não vai manter");
    expect(novo.perguntas).toBe("Posso comer pão à noite? | Precisa cortar doce?");
    expect(novo.tom).toBe("acolhedor, técnico e direto");
    expect(novo.funil).toMatch(/\(fundo\)/);
    expect(novo.tempo).toBe("Até 30 min");
    expect(novo.meta).toBe("Fechar 10 clientes");
    const antigo = ctx.parse!(r([["Nome da empresa ou marca", "Studio X"], ["Quantos conteúdos por semana você quer?", "3 por semana"], ["Neste momento, qual o foco principal?", "Aquecer e educar quem já me segue (meio)"]]))!;
    expect(antigo).toMatchObject({ name: "Studio X", frequencia: "3 por semana", funil: "Aquecer e educar quem já me segue (meio)" });
  });
});
