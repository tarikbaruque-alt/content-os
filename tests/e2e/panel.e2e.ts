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
    await page.click('#nav [data-view="overview"]');
    await page.click("#autoBuildBtn");
    await page.waitForFunction(() => /Pronto/.test(document.querySelector("#overlay")?.textContent || ""), null, { timeout: 30_000 });
    await page.click("#dclose");
    const items = await calendar();
    expect(items.length).toBeGreaterThan(5);
    expect(new Set(items.map((i) => i.status))).toEqual(new Set(["PLANNED"]));
  }, 60_000);

  it("Aprovações só lista peça com texto produzido", async () => {
    await page.click('#nav [data-view="approvals"]');
    expect(await page.$$("#approvalList [data-gen]")).toHaveLength(0);
    await page.click('#nav [data-view="calendar"]');
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
    await page.click('#nav [data-view="approvals"]');
    expect(await page.$$("#approvalList [data-gen]")).toHaveLength(1);
  }, 30_000);

  it("Performance importa o CSV do Meta e não mostra número inventado", async () => {
    await page.click('#nav [data-view="performance"]');
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

  it("abre as 20 telas (e o modo cliente) sem erro de JavaScript", async () => {
    const views = await page.$$eval("#nav a", (as) => as.map((a) => a.getAttribute("data-view")!));
    expect(views).toHaveLength(20);
    for (const v of views) {
      await page.click(`#nav [data-view="${v}"]`);
      expect(await page.$eval(`.view[data-view="${v}"]`, (s) => !(s as HTMLElement).hidden), v).toBe(true);
    }
    await page.click("#clientview");
    for (const v of await page.$$eval("#nav a", (as) => as.map((a) => a.getAttribute("data-view")!))) await page.click(`#nav [data-view="${v}"]`);
    await page.click("#clientview");
    expect(errors).toEqual([]);
  }, 60_000);
});
