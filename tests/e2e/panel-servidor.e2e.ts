/// <reference lib="dom" />
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium, type Browser, type Page } from "playwright-core";

/**
 * O painel no MODO SERVIDOR, o que roda publicado na Vercel com login: Supabase
 * simulado (tests/e2e/mock-supabase.js) com o RLS da trava e a função "agentes".
 * O outro e2e roda o modo Artifact e deixou passar o que só quebra aqui: botão
 * que pagava a IA e depois era recusado pela trava, mix que não salvava, cliente
 * antigo travado para sempre.
 */
const PANEL = pathToFileURL(join(process.cwd(), "apps/web/index.html")).href;
const MOCK_CLAUDE = readFileSync("tests/e2e/mock-claude.js", "utf8");
const MOCK_SUPABASE = readFileSync("tests/e2e/mock-supabase.js", "utf8");

// Cliente como veio do painel antigo: DNA sem status, plano pronto, nome com travessão.
const ANTIGO = "studio-aurora";
const NOME_ANTIGO = "Studio Aurora — Fotografia de Casamento";
const amanha = (n: number) => { const d = new Date(); d.setDate(d.getDate() + 1 + n); return d.toISOString().slice(0, 10); };
const SEMENTE = [
  { path: `cos_clients/${ANTIGO}`, data: { id: ANTIGO, name: NOME_ANTIGO, niche: "Fotografia de casamento", briefing: "Fotografo casamentos em estilo documental." } },
  { path: `cos_dna/${ANTIGO}`, data: { entries: Array.from({ length: 6 }, (_, i) => ({ section: "audience", field: `campo${i}`, value: `registro antigo ${i}`, state: "FACT" })) } },
  { path: `cos_strategy/${ANTIGO}`, data: { posicionamento: "Estilo documental", bigMessage: "A emoção real vale mais que a pose", persona: "Noivas de 28 a 38 anos",
    paths: [{ key: "autoridade", nome: "Autoridade", funil: "topo", relevancia: 80 }, { key: "prova", nome: "Prova", funil: "fundo", relevancia: 70 }, { key: "rapport", nome: "Rapport", funil: "meio", relevancia: 60 }],
    mix: [{ key: "autoridade", nome: "Autoridade", pct: 60 }, { key: "prova", nome: "Prova", pct: 40 }] } },
  { path: `cos_editorial/${ANTIGO}`, data: { pilares: [{ pilar: "Bastidores", temas: [{ tema: "O dia do casamento" }] }] } },
  ...[0, 1, 2].map((i) => ({ path: `cos_ideas/${ANTIGO}/items/idea-${i + 1}`, data: { id: `idea-${i + 1}`, ord: i, titulo: `Ideia antiga ${i + 1}`, surface: "Reel", funil: "topo" } })),
  ...[0, 1, 2].map((i) => ({ path: `cos_calendar/${ANTIGO}/items/cal-${i + 1}`, data: { id: `cal-${i + 1}`, ord: i, data: amanha(i * 2), status: "PLANNED", idea: { titulo: `Peça antiga ${i + 1}`, surface: "Reel", funil: "topo", format: "Talking Head", funcao: "Autoridade" } } })),
];

let browser: Browser;
let page: Page;
const erros: string[] = [];
let respostaPrompt: string | null = null;
const chamadas = (desde: number) => page.evaluate((n) => (window as any).__FAKE.log.slice(n).filter((x: string) => x.startsWith("fn")), desde) as Promise<string[]>;
const nLog = () => page.evaluate(() => (window as any).__FAKE.log.length) as Promise<number>;
const doc = (path: string) => page.evaluate((p) => (window as any).__FAKE.T.docs.find((d: any) => d.path === p)?.data ?? null, path);
const texto = (sel: string) => page.textContent(sel).then((t) => (t || "").replace(/\s+/g, " "));

async function abrirCliente(nome: string) {
  await page.click('.side .nav [data-view="clients"]');
  await page.click(`.view[data-view="clients"] .tabela tbody tr:has-text("${nome}")`);
  await page.waitForSelector('[data-tab-ir="dna"]');
}
async function aba(t: string, sub?: string) { await page.click(`[data-tab-ir="${t}"]`); if (sub) await page.click(`[data-tab-ir="${sub}"]`); }

describe("Painel publicado (modo servidor, Supabase simulado)", () => {
  beforeAll(async () => {
    try { browser = await chromium.launch({ channel: "msedge", headless: true }); } catch { browser = await chromium.launch({ headless: true }); }
  }, 60_000);
  afterAll(async () => { await browser?.close(); });
  // antes: script que roda antes do Supabase simulado montar (ex.: o papel de quem entra).
  async function abrirPainel(antes = "", busca = "", celular = false) {
    if (page) await page.close();
    page = await browser.newPage(celular ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1400, height: 900 } });
    page.on("pageerror", (e) => erros.push(e.message));
    page.on("dialog", (d) => (d.type() === "prompt" ? (respostaPrompt != null ? d.accept(respostaPrompt) : d.dismiss()) : d.accept()));
    await page.addInitScript({ content: `window.__SEED=${JSON.stringify(SEMENTE)};${antes}` });
    await page.addInitScript({ content: MOCK_CLAUDE });
    await page.addInitScript({ content: MOCK_SUPABASE });
    await page.goto(PANEL + busca);
    if (!busca) await page.waitForSelector('#aiBadge[data-modo="servidor"]');
  }
  beforeEach(async () => { await abrirPainel(); }, 60_000);

  it("cliente antigo: DNA sem status vale como aprovado e o plano não fica travado", async () => {
    await abrirCliente("Studio Aurora");
    await aba("dna");
    await page.waitForFunction(() => /aprovado/.test(document.querySelector('.view[data-view="dna"]')?.textContent || ""));
    expect(await texto('.view[data-view="dna"]')).toMatch(/6 aprovados/);
    await aba("strategy");
    const n = await nLog();
    await page.click("#regenStratBtn");
    await page.waitForFunction(() => /Estratégia nova salva/.test(document.querySelector("#cosToast")?.textContent || ""));
    expect(await chamadas(n)).toEqual(["fn.ia", "fn.gravar"]);
    expect((await doc(`cos_strategy/${ANTIGO}`)).bigMessage).toBe("Trinta minutos bem feitos valem mais que duas horas que você não faz");
    expect(erros).toEqual([]);
  }, 60_000);

  it("marcar um caminho no mix do mês salva na estratégia", async () => {
    await abrirCliente("Studio Aurora");
    await aba("strategy");
    await page.click('[data-path="rapport"]');
    await page.waitForFunction(() => /Salvo/.test(document.querySelector("#mixMsg")?.textContent || ""), null, { timeout: 5000 });
    const mix = (await doc(`cos_strategy/${ANTIGO}`)).mix.map((m: any) => m.key).sort();
    expect(mix).toEqual(["autoridade", "prova", "rapport"]);
  }, 60_000);

  it("cliente novo: sem DNA aprovado, gerar estratégia explica o motivo e não paga a IA", async () => {
    await page.click('.side .nav [data-view="clients"]');
    await page.click("#newClientBtn");
    await page.fill("#ncName", "Academia Teste");
    await page.fill("#ncNiche", "Educador Físico");
    await page.fill("#ncBrief", "Atendo mulheres de 30 a 45 anos. A maior dor é não conseguir manter a rotina.");
    await page.click("#ncCreate");
    await page.click("#dnaRun");
    await page.waitForFunction(() => /sugestões/.test(document.querySelector("#dnaMsg")?.textContent || ""));
    await page.click('.side .nav [data-view="overview"]');
    expect(await page.$("#autoBuildBtn")).toBeNull();
    // A tela Hoje diz qual é o passo e leva até ele.
    expect(await texto(".passo.atual")).toMatch(/Entender/);
    await page.click('.passo[data-goto-step="strategy"]');
    const n = await nLog();
    await page.click("#genStratBtn");
    expect(await texto("#stratMsg")).toMatch(/Aprove pelo menos 5 registros do Content DNA/);
    expect(await chamadas(n)).toEqual([]);
  }, 60_000);

  it("arquivar pela lista: some da lista, fica inativo e os agentes param; reativar volta", async () => {
    await page.click('.side .nav [data-view="clients"]');
    await page.click(`[data-arquivar="${ANTIGO}"]`);
    await page.waitForFunction(() => /foi arquivado/.test(document.querySelector("#cosToast")?.textContent || ""));
    expect(await page.$(`tr[data-client="${ANTIGO}"]`)).toBeNull();
    const c = await doc(`cos_clients/${ANTIGO}`);
    expect([c.admin.ativo, c.operacao.pausado]).toEqual([false, true]);
    await page.click("#verArq");
    await page.click(`[data-arquivar="${ANTIGO}"]`);
    await page.waitForFunction(() => /foi reativado/.test(document.querySelector("#cosToast")?.textContent || ""));
    expect((await doc(`cos_clients/${ANTIGO}`)).operacao.pausado).toBe(false);
  }, 60_000);

  it("apagar pela lista confirma por botão (sem digitar o nome) e leva tudo do cliente", async () => {
    await page.click('.side .nav [data-view="clients"]');
    await page.click(`[data-apagar="${ANTIGO}"]`);
    expect(await texto(".dialogo")).toMatch(/Apagar Studio Aurora — Fotografia de Casamento\?/);
    await page.click("#dlgApagar");
    await page.waitForFunction(() => /foi apagado/.test(document.querySelector("#cosToast")?.textContent || ""));
    const sobra = await page.evaluate((c) => (window as any).__FAKE.T.docs.filter((d: any) => d.path.split("/")[1] === c).length, ANTIGO);
    expect(sobra).toBe(0);
    expect(await page.$(`tr[data-client="${ANTIGO}"]`)).toBeNull();
    expect(erros).toEqual([]);
  }, 60_000);

  it("equipe: cartão mostra quem entrou; dono corrige o e-mail do Tarik, reenvia acesso, troca papel e convida", async () => {
    expect(await texto(".user-card")).toMatch(/Nicácio\s*Dono/);
    await page.click('.side .nav [data-view="config"]');
    await page.waitForSelector("tr[data-eq]");
    const TARIK = "11111111-1111-1111-1111-111111111111";
    expect(await texto(`tr[data-eq="${TARIK}"]`)).toMatch(/Tarik.*tarik@contentos\.app.*nunca entrou/);
    // O próprio papel não se muda (sempre sobra um dono).
    expect(await page.$('select[id="eqP-u-nicacio"]')).toBeNull();
    await page.click(`tr[data-eq="${TARIK}"] [data-eq-email]`);
    await page.fill(`tr[data-eq="${TARIK}"] .eq-email input`, "tarik@gmail.com");
    await page.click(`tr[data-eq="${TARIK}"] .eq-email .btn.pri`);
    await page.waitForFunction(() => /E-mail trocado para tarik@gmail\.com/.test(document.querySelector("#eqMsg")?.textContent || ""));
    await page.waitForSelector(`tr[data-eq="${TARIK}"] [data-eq-acesso]`);
    await page.click(`tr[data-eq="${TARIK}"] [data-eq-acesso]`);
    await page.waitForFunction(() => /Link de acesso enviado para tarik@gmail\.com/.test(document.querySelector("#eqMsg")?.textContent || ""));
    await page.selectOption(`#eqP-${TARIK}`, "editor");
    await page.waitForFunction(() => /agora é editor/.test(document.querySelector("#eqMsg")?.textContent || ""));
    await page.fill("#eqEmail", "ana@agencia.com");
    await page.selectOption("#eqPapel", "leitura");
    await page.click("#eqConvidar");
    await page.waitForFunction(() => /Convite enviado para ana@agencia\.com/.test(document.querySelector("#eqMsg")?.textContent || ""));
    const F = await page.evaluate(() => ({ emails: (window as any).__FAKE.emails, membros: (window as any).__FAKE.T.membros.map((m: any) => m.papel) }));
    expect(F.emails).toEqual(["acesso tarik@gmail.com", "convite ana@agencia.com"]);
    expect(F.membros).toEqual(["dono", "editor", "leitura"]);
    expect(erros).toEqual([]);
  }, 60_000);

  it("link de aprovação: a equipe gera, o cliente aprova e pede ajuste no celular, e a resposta cai na peça", async () => {
    await abrirCliente("Studio Aurora");
    await aba("calendar");
    await page.click("#expLink");
    await page.waitForSelector("#lpUrl");
    const url = await page.inputValue("#lpUrl");
    const token = url.split("?vitrine=")[1]!;
    expect(token).toMatch(/^[0-9a-f]{32}$/);
    expect(await texto("#lpMsg")).toMatch(/Aprovar ou em Pedir ajuste/);
    // Abrir de novo mostra o mesmo link (um ativo por cliente).
    await page.click("#dclose");
    await page.click("#expLink");
    await page.waitForSelector("#lpUrl");
    expect(await page.inputValue("#lpUrl")).toBe(url);

    const link = JSON.stringify([{ token, workspace_id: "ws-1", tipo: "vitrine", client_id: ANTIGO, ativo: true }]);
    await abrirPainel(`window.__LINKS=${link};`, `?vitrine=${token}`, true);
    await page.waitForSelector(".vt-p");
    expect(await page.$$eval(".vt-p", (p) => p.length)).toBe(3);
    const [p1, p2] = await page.$$(".vt-p");
    await (await p1!.$("summary"))!.click();
    await (await p1!.$("[data-vt-ok]"))!.click();
    await page.waitForFunction(() => /Pauta aprovada/.test(document.querySelector(".vt-p .vt-aviso")?.textContent || ""));
    await (await p2!.$("summary"))!.click();
    await (await p2!.$("[data-vt-adj]"))!.click();
    await (await p2!.$(".vt-adjbox textarea"))!.fill("Troca a foto da capa");
    await (await p2!.$("[data-vt-send]"))!.click();
    await page.waitForFunction(() => /Pedido de ajuste enviado/.test(document.querySelectorAll(".vt-p")[1]?.querySelector(".vt-aviso")?.textContent || ""));
    const pecas = await page.evaluate(() => (window as any).__FAKE.T.docs.filter((d: any) => d.path.includes("/items/cal-")).map((d: any) => [d.data.id, d.data.clientStatus ?? null, d.data.clientNote ?? null]));
    expect(pecas).toEqual([["cal-1", "aprovado", null], ["cal-2", "ajuste", "Troca a foto da capa"], ["cal-3", null, null]]);
    expect(await page.evaluate(() => document.body.innerText)).not.toMatch(/Hoje|Dashboard|Configuração/);

    await abrirPainel("", "?vitrine=" + "0".repeat(32), true);
    await page.waitForFunction(() => /não está mais ativo/.test(document.body.innerText));
  }, 90_000);

  it("assinar agenda: link webcal por cliente e um da equipe inteira no calendário geral", async () => {
    await abrirCliente("Studio Aurora");
    await aba("calendar");
    await page.click("#expAssinar");
    await page.waitForSelector("#lpUrl");
    expect(await page.inputValue("#lpUrl")).toMatch(/\/functions\/v1\/agentes\?agenda=[0-9a-f]{32}$/);
    expect(await page.getAttribute(".lp-como + .q-rodape, .q-rodape a.btn.pri", "href")).toMatch(/^webcal:\/\//);
    await page.click("#dclose");
    await page.click('.side .nav [data-view="agenda"]');
    await page.click("[data-ag-assinar]");
    await page.waitForSelector("#lpUrl");
    const links = await page.evaluate(() => (window as any).__FAKE.T.links_publicos.map((l: any) => [l.tipo, l.client_id]));
    expect(links).toEqual([["agenda", ANTIGO], ["agenda", null]]);
  }, 60_000);

  const calendarioGeral = async () => { await page.click('.side .nav [data-view="agenda"]'); await page.waitForSelector(".ag-grade"); };
  const pecaAprovada = `window.__SEED.push({ path: "cos_calendar/${ANTIGO}/items/cal-9", data: { id: "cal-9", ord: 9, data: "${amanha(8)}", status: "APPROVED", clientStatus: "aprovado", idea: { titulo: "Peça aprovada", surface: "Reel", funil: "topo" }, content: { headline: "Peça aprovada", copy: "x" } } });`;

  it("calendário geral: olha para frente, mostra situação e atraso, filtra, tem produção, vagas e feriados", async () => {
    await calendarioGeral();
    expect(await texto(".ag-mes")).toBe("Próximas 5 semanas");
    const sits = await page.$$eval(".ag-ev .ag-sit", (s) => s.map((x) => x.textContent));
    expect(sits.length).toBeGreaterThanOrEqual(3);
    expect(sits.every((t) => /sem texto/.test(t || ""))).toBe(true);
    // Peça para amanhã sem roteiro já passou do prazo do roteiro.
    expect(await page.$$eval(".ag-ev.atraso", (e) => e.length)).toBeGreaterThan(0);
    await page.click("[data-ag-atrasadas]");
    expect(await page.$$eval(".ag-ev", (e) => e.every((x) => x.classList.contains("atraso")))).toBe(true);
    await page.click("[data-ag-atrasadas]");
    expect(await page.$$eval(".ag-vaga", (v) => v.length)).toBeGreaterThan(0);
    await page.click('[data-ag-camada="prod"]');
    expect(await texto(".ag-ev.prod")).toMatch(/Gravar \d peças?/);
    await page.click('[data-ag-camada="pub"]');
    // Natal aparece como feriado no mês de dezembro.
    await page.click('[data-ag-modo="mes"]');
    for (let i = 0; i < 13 && !/^Dezembro/.test(await texto(".ag-mes")); i++) await page.click('[data-ag-passo="1"]');
    expect(await page.$eval('.ag-dia[data-ag-dia$="-12-25"] .ag-data', (e) => [e.textContent, e.className])).toEqual(["Natal", "ag-data feriado"]);
    await page.click('[data-ag-modo="lista"]');
    await page.click("[data-ag-hoje]");
    expect(await texto(".ag-mes")).toBe("Próximas 8 semanas");
    expect(await page.$$eval(".agc-lista tr[data-ag-abrir]", (r) => r.length)).toBeGreaterThanOrEqual(3);
  }, 60_000);

  it("mover com regras: passado não entra; peça aprovada pelo cliente reabre a aprovação ao mudar de dia", async () => {
    await abrirPainel(pecaAprovada);
    await calendarioGeral();
    await page.click('.ag-ev[data-ag-id="cal-1"]');
    await page.waitForSelector("#pubData");
    const ontem = new Date(); ontem.setDate(ontem.getDate() - 1);
    await page.fill("#pubData", ontem.toISOString().slice(0, 10));
    await page.waitForFunction(() => /no passado/.test(document.querySelector("#cosToast")?.textContent || ""));
    expect(await page.inputValue("#pubData")).toBe(amanha(0));
    await page.click("#dclose");
    await page.click('.ag-ev[data-ag-id="cal-9"]');
    await page.waitForSelector("#pubData");
    await page.fill("#pubData", amanha(9));
    await page.waitForFunction(() => /aprovação do cliente foi reaberta/.test(document.querySelector("#pubMsg")?.textContent || ""));
    const d = await doc(`cos_calendar/${ANTIGO}/items/cal-9`);
    expect([d.data, d.clientStatus, d.movimentos.length]).toEqual([amanha(9), null, 1]);
  }, 60_000);

  it("Hoje: o que fazer hoje de todos os clientes, e Abrir leva direto à peça", async () => {
    await page.click('.side .nav [data-view="overview"]');
    await page.waitForSelector("#ovHoje [data-hj-abrir]");
    expect(await texto("#ovHoje")).toMatch(/O que fazer hoje.*Escrever o roteiro/);
    expect(await texto("#ovHoje")).toMatch(/atrasada/);
    await page.click("#ovHoje [data-hj-abrir]");
    await page.waitForSelector("#overlay .drawer #pubPrazos");
    expect(await texto("#pubPrazos")).toMatch(/Roteiro até .* · cliente aprova até .* · gravação .* · publicação/);
  }, 60_000);

  it("campanha: criada no calendário do cliente, aparece no calendário geral", async () => {
    await abrirCliente("Studio Aurora");
    await aba("calendar");
    await page.click("#calCamp");
    await page.fill("#cpNome", "Lançamento");
    await page.fill("#cpIni", amanha(1));
    await page.fill("#cpFim", amanha(10));
    await page.selectOption("#cpFoco", "fundo");
    await page.click("#cpSalvar");
    await page.waitForFunction(() => /Campanha adicionada/.test(document.querySelector("#cpMsg")?.textContent || ""));
    expect((await doc(`cos_clients/${ANTIGO}`)).campanhas).toMatchObject([{ nome: "Lançamento", inicio: amanha(1), fim: amanha(10), foco: "fundo" }]);
    await page.click("#dclose");
    await calendarioGeral();
    expect(await page.$$eval(".ag-camp", (c) => c.some((x) => x.textContent === "Lançamento"))).toBe(true);
  }, 60_000);

  it("marcar como publicada pede o link do post e salva", async () => {
    await calendarioGeral();
    await page.click('.ag-ev[data-ag-id="cal-2"]');
    await page.waitForSelector("#pubStatus");
    await page.selectOption("#pubStatus", "PUBLISHED");
    await page.waitForFunction(() => /Cole aqui o link do post/.test(document.querySelector("#linkMsg")?.textContent || ""));
    await page.fill("#pubLink", "https://www.instagram.com/p/abc123");
    await page.dispatchEvent("#pubLink", "change");
    await page.waitForFunction(() => /Link salvo/.test(document.querySelector("#linkMsg")?.textContent || ""));
    expect((await doc(`cos_calendar/${ANTIGO}/items/cal-2`)).postUrl).toBe("https://www.instagram.com/p/abc123");
  }, 60_000);

  it("só leitura: a tela não oferece criar, arquivar, apagar nem convidar", async () => {
    await abrirPainel(`window.__PAPEL="leitura";`);
    expect(await texto("#aiBadge")).toBe("Só leitura");
    await page.click('.side .nav [data-view="clients"]');
    for (const sel of ["#newClientBtn", "[data-apagar]", "[data-arquivar]"]) expect(await page.isVisible(sel)).toBe(false);
    await page.click('.side .nav [data-view="config"]');
    await page.waitForSelector("tr[data-eq]");
    expect(await page.$("#eqConvidar")).toBeNull();
    expect(await page.$("select[id^='eqP-']")).toBeNull();
  }, 60_000);
});
