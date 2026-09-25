/// <reference lib="dom" />
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium, type Browser, type Page } from "playwright-core";

/**
 * Ponta a ponta do painel num navegador de verdade, com window.claude simulado
 * (tests/e2e/mock-claude.js): banco em memória + IA que responde no formato de
 * cada agente. Pega o que os testes de sintaxe deixam passar: botão sem
 * ouvinte, tela que quebra ao abrir, campo que parece editável e não salva.
 *
 *   npm run test:e2e
 *
 * Navegador: Edge instalado (Windows) ou o Chromium do playwright-core
 * (`npx playwright-core install chromium`, usado no CI).
 */
const PANEL = pathToFileURL(join(process.cwd(), "apps/web/index.html")).href;
const MOCK = readFileSync("tests/e2e/mock-claude.js", "utf8");

async function launch(): Promise<Browser> {
  try { return await chromium.launch({ channel: "msedge", headless: true }); }
  catch { return await chromium.launch({ headless: true }); }
}

let browser: Browser;
let page: Page;
const errors: string[] = [];
type Item = { id: string; status: string; data: string; content?: unknown; idea: { tema: string; surface: string } };
const calendar = (): Promise<Item[]> =>
  page.evaluate(() => Object.entries((window as any).__MOCK.store).filter(([k]) => k.includes("cos_calendar/")).map(([, v]) => v as any));
const ABAS: Record<string, string[]> = {
  dna: ["dna"], strategy: ["strategy"], research: ["strategy", "research"], editorial: ["strategy", "editorial"],
  ideas: ["strategy", "ideas"], formats: ["strategy", "formats"], calendar: ["calendar"], approvals: ["calendar", "approvals"],
  performance: ["performance"], operacao: ["operacao"],
};
async function ir(v: string) {
  if (!ABAS[v]) { await page.click(`.side .nav [data-view="${v}"]`); return; }
  // Operação saiu das abas: fica na gaveta "Como este cliente roda".
  if (v === "operacao") { await ir("dna"); await page.click("#comoRoda"); await page.click("#crExec"); return; }
  if (!(await page.isVisible('[data-tab-ir="dna"]'))) { await page.click('.side .nav [data-view="clients"]'); await page.click('.view[data-view="clients"] .tabela tbody tr'); }
  for (const t of ABAS[v]!) await page.click(`[data-tab-ir="${t}"]`);
}
const text = (sel: string) => page.textContent(sel).then((t) => (t || "").replace(/\s+/g, " "));

describe("Painel no navegador (window.claude simulado)", () => {
  beforeAll(async () => {
    browser = await launch();
    page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("dialog", (d) => d.accept());
    await page.addInitScript({ content: MOCK });
    await page.goto(PANEL);
    await page.waitForFunction(() => document.querySelector("#aiBadge")?.textContent?.includes("ativa"));
  }, 60_000);
  afterAll(async () => { await browser?.close(); });

  it("cria cliente, roda a Íris e o \"Montar tudo\" até o calendário", async () => {
    await page.click("#newClientBtn");
    await page.fill("#ncName", "Academia Teste");
    await page.fill("#ncNiche", "Educador Físico");
    await page.fill("#ncBrief", "Atendo mulheres de 30 a 45 anos. A maior dor é não conseguir manter a rotina.");
    await page.click("#ncCreate");
    await page.click("#dnaRun");
    await page.waitForFunction(() => /sugestões/.test(document.querySelector("#dnaMsg")?.textContent || ""));
    await ir("overview");
    await page.click("#autoBuildBtn");
    await page.waitForFunction(() => /Pronto/.test(document.querySelector("#overlay")?.textContent || ""), null, { timeout: 30_000 });
    await page.click("#dclose");
    const items = await calendar();
    expect(items.length).toBeGreaterThan(5);
    expect(new Set(items.map((i) => i.status))).toEqual(new Set(["PLANNED"]));
  }, 60_000);

  it("Aprovações só lista peça com texto produzido", async () => {
    await ir("approvals");
    expect(await page.$$("#approvalList [data-gen]")).toHaveLength(0);
    await ir("calendar");
    await page.click('.view[data-view="calendar"] [data-gen]');
    await page.click('[data-genpeca="reel"]');
    await page.waitForSelector("#saveReelBtn");
    const first = (await calendar()).find((i) => i.id === "cal-1")!;
    expect(first.content).toBeTruthy();
    expect(first.status).toBe("WAITING APPROVAL");
  }, 30_000);

  it("status, tema e data salvam, inclusive depois de trocar de aba", async () => {
    await page.click('#overlay [data-tab="carrossel"]');
    await page.click('#overlay [data-tab="estrategia"]');
    await page.selectOption("#pubStatus", "IN PRODUCTION");
    await page.fill("#pubData", "2026-12-01");
    await page.dispatchEvent("#pubData", "change");
    await page.click('[data-idea-fld="tema"]');
    await page.keyboard.press("End");
    await page.keyboard.type(" editado");
    await page.click(".dh");
    await page.waitForFunction(() => /Salvo/.test(document.querySelector("#stMsg")?.textContent || ""));
    await expect.poll(async () => (await calendar()).find((i) => i.id === "cal-1")).toMatchObject({
      status: "IN PRODUCTION", data: "2026-12-01", idea: { tema: "Treino curto editado" },
    });
    await page.selectOption("#pubStatus", "WAITING APPROVAL");
    await page.click("#dclose");
    await ir("approvals");
    expect(await page.$$("#approvalList [data-gen]")).toHaveLength(1);
  }, 30_000);

  it("Performance importa o CSV do Meta e não mostra número inventado", async () => {
    await ir("performance");
    expect(await text('.view[data-view="performance"]')).toMatch(/Ainda não há resultados medidos/);
    const items = (await calendar()).sort((a, b) => (a.data < b.data ? -1 : 1)).slice(0, 4);
    const head = "Identificação da publicação;Horário de publicação;Link permanente;Tipo de publicação;Descrição;Alcance;Curtidas;Compartilhamentos;Seguimentos;Comentários;Salvamentos";
    const rows = items.map((it, i) => { const [y, m, d] = it.data.split("-"); return `${i};${d}/${m}/${y} 18:30;https://instagram.com/p/${i};Reel do IG;"Post ${i}; com ""aspas""";${1000 * (i + 1)};80;5;3;4;${20 + i}`; });
    rows.push("99;01/01/2026 10:00;https://instagram.com/p/solto;Imagem do IG;antigo;1.500;10;1;0;2;7");
    const dir = mkdtempSync(join(tmpdir(), "cos-e2e-"));
    writeFileSync(join(dir, "insights.csv"), "﻿" + [head, ...rows].join("\r\n"));
    await page.setInputFiles("#perfCsv", join(dir, "insights.csv"));
    await page.waitForFunction(() => /importados/.test(document.querySelector("#perfMsg")?.textContent || ""));
    expect(await text("#perfMsg")).toMatch(/5 posts importados · 4 ligados a peças do calendário · 1 avulsos/);
    const perf = await text('.view[data-view="performance"]');
    expect(perf).toMatch(/Posts medidos\s?5/);
    expect(perf).not.toMatch(/48,2k/);
  }, 30_000);

  it("Calendário geral mostra as peças de todos os clientes e mover de dia salva", async () => {
    await ir("agenda");
    await page.waitForSelector(".ag-grade");
    // As peças podem cair no mês seguinte: avança até achar.
    for (let i = 0; i < 3 && !(await page.$(".ag-ev")); i++) { await page.click('[data-ag-passo="1"]'); await page.waitForTimeout(150); }
    const antes = await page.$$eval(".ag-ev", (e) => e.length);
    expect(antes).toBeGreaterThan(0);
    // Mover a primeira peça para o dia seguinte (os mesmos eventos que o navegador dispara ao arrastar).
    const [id, alvo] = await page.evaluate(() => {
      const ev = document.querySelector(".ag-ev") as HTMLElement, dia = ev.closest(".ag-dia")!.getAttribute("data-ag-dia")!;
      const p = dia.split("-").map(Number), d = new Date(p[0]!, p[1]! - 1, p[2]! + 1);
      const alvo = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      const dt = new DataTransfer(), t = document.querySelector(`.ag-dia[data-ag-dia="${alvo}"]`)!;
      ev.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer: dt }));
      t.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt }));
      return [ev.getAttribute("data-ag-id")!, alvo];
    });
    await page.waitForTimeout(400);
    // Sai e volta: a peça continua no dia novo (veio do banco, não da tela).
    await ir("overview"); await ir("agenda"); await page.waitForSelector(".ag-grade");
    for (let i = 0; i < 3 && !(await page.$(`.ag-ev[data-ag-id="${id}"]`)); i++) { await page.click('[data-ag-passo="1"]'); await page.waitForTimeout(150); }
    expect(await page.$eval(`.ag-ev[data-ag-id="${id}"]`, (e) => e.closest(".ag-dia")!.getAttribute("data-ag-dia"))).toBe(alvo);
    // Clicar abre a mesma gaveta da peça.
    await page.click(`.ag-ev[data-ag-id="${id}"]`);
    await page.waitForSelector("#overlay .drawer");
    await page.click("#dclose");
  }, 30_000);

  it("menu por processo: 5 itens; cliente com abas e sub-abas; nenhuma tela quebra", async () => {
    const menu = await page.$$eval(".side .nav a", (as) => as.map((a) => a.getAttribute("data-view")!));
    expect(menu).toEqual(["overview", "clients", "agenda", "agents", "config"]);
    for (const v of menu) {
      await ir(v);
      expect(await page.$eval(`.view[data-view="${v}"]`, (s) => !(s as HTMLElement).hidden), v).toBe(true);
    }
    for (const v of Object.keys(ABAS)) {
      await ir(v);
      expect(await page.$eval(`.view[data-view="${v}"]`, (s) => !(s as HTMLElement).hidden), v).toBe(true);
      expect(await page.$eval("#cliHead", (h) => !(h as HTMLElement).hidden)).toBe(true);
    }
    await ir("overview");
    expect(await page.$eval("#cliHead", (h) => getComputedStyle(h).display)).toBe("none");
    // data do calendário continua saindo certo (a função do calendário não pode ser sobrescrita)
    expect(await text("#ovContent")).toMatch(/(Seg|Ter|Qua|Qui|Sex|Sáb|Dom) \d{2}\/\d{2}/);
    await ir("calendar");
    await page.click("#clientview");
    for (const v of await page.$$eval(".side .nav a", (as) => as.map((a) => a.getAttribute("data-view")!))) await page.click(`.side .nav [data-view="${v}"]`);
    await ir("calendar").catch(() => {});
    expect(errors).toEqual([]);
  }, 60_000);
});
