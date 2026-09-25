import { describe, it, expect } from "vitest";
import { backendMemoria, entregar, llmRoteiro, usar } from "./memoria.js";
import { executar, custoUsd } from "../../supabase/functions/_shared/executor.ts";
import { batida, executarAgente, ultimoHorario, type Deps } from "../../supabase/functions/_shared/maestro.ts";
import { trechosDoMarkdown } from "../../supabase/functions/_shared/kb.ts";

const WS = "ws-1";
const CLI = "academia";
// Quinta, 25/09/2026, 15h em Brasília.
const AGORA = new Date("2026-09-25T18:00:00Z");

async function clienteBase(b: ReturnType<typeof backendMemoria>["b"]) {
  await b.setDoc(WS, `cos_clients/${CLI}`, { id: CLI, name: "Academia Teste", niche: "Educador Físico", briefing: "Atendo mulheres de 30 a 45 anos que não conseguem manter a rotina.", ficha: { restricoes: "preço no feed" } });
  await b.setDoc(WS, `cos_dna/${CLI}`, { entries: [
    { section: "audience", field: "persona", value: "Mulheres de 30 a 45 anos", state: "FACT", status: "approved" },
    { section: "audience", field: "dores", value: "Não mantêm a rotina", state: "FACT", status: "approved" },
    { section: "business", field: "oferta", value: "Consultoria online", state: "FACT", status: "pending" },
  ] });
}
function deps(m: ReturnType<typeof backendMemoria>, llm: Deps["llm"], extra: Partial<Deps> = {}): Deps {
  return { b: m.b, llm, modelo: "claude-opus-5", orcamentoMes: 50, agora: () => AGORA, ...extra };
}

describe("executor (laço do agente)", () => {
  it("usa as ferramentas, devolve o pensamento inteiro à API e termina em entregar", async () => {
    const { llm, enviados } = llmRoteiro([
      () => usar("ler_cliente"),
      () => ({ stop_reason: "pause_turn", content: [{ type: "server_tool_use", id: "s1", name: "web_search", input: { query: "treino curto tendência" } }], usage: { input_tokens: 800, output_tokens: 100, server_tool_use: { web_search_requests: 2 } } }),
      () => entregar({ resumo: "ok" }),
    ]);
    const r = await executar({
      llm, modelo: "claude-opus-5", sistema: "s", pedido: "p",
      ferramentas: [{ nome: "ler_cliente", descricao: "d", entrada: { type: "object", properties: {} }, rodar: async () => "FICHA X" }],
      saida: { type: "object", properties: { resumo: { type: "string" } }, required: ["resumo"] }, buscaWeb: { maxUsos: 3 },
    });
    expect(r.saida).toEqual({ resumo: "ok" });
    expect(r.uso.buscas_web).toBe(2);
    expect(r.uso.custo_usd).toBe(custoUsd("claude-opus-5", 2800, 1100, 2));
    // A 2a chamada leva o resultado da ferramenta; o bloco de pensamento volta intacto.
    const hist = enviados[1]!.messages;
    expect(hist[1].content[0]).toEqual({ type: "thinking", thinking: "", signature: "x" });
    expect(hist[2].content[0]).toMatchObject({ type: "tool_result", content: "FICHA X" });
    expect(enviados[0]!.tools.map((t: any) => t.name)).toEqual(["ler_cliente", "entregar", "web_search"]);
    expect(enviados[0]!.thinking).toEqual({ type: "adaptive" });
  });

  it("entrega incompleta volta como erro para o modelo corrigir; sem entregar não há saída", async () => {
    const { llm, enviados } = llmRoteiro([() => entregar({}), () => entregar({ resumo: "agora sim" })]);
    const r = await executar({ llm, modelo: "claude-opus-5", sistema: "s", pedido: "p", ferramentas: [], saida: { type: "object", properties: { resumo: { type: "string" } }, required: ["resumo"] } });
    expect(r.saida).toEqual({ resumo: "agora sim" });
    expect(enviados[1]!.messages[2].content[0]).toMatchObject({ is_error: true });
    const vazio = await executar({ llm: llmRoteiro([() => ({ content: [{ type: "text", text: "pronto!" }] })]).llm, modelo: "claude-opus-5", sistema: "s", pedido: "p", ferramentas: [], saida: { type: "object", properties: {} } });
    expect(vazio.saida).toBeNull();
  });

  it("resposta cortada vira erro (nunca meio resultado)", async () => {
    await expect(executar({ llm: llmRoteiro([() => ({ stop_reason: "max_tokens" })]).llm, modelo: "claude-opus-5", sistema: "s", pedido: "p", ferramentas: [], saida: { type: "object" } })).rejects.toThrow(/cortada/);
  });
});

describe("agentes", () => {
  it("Radar: só entra item com link; vira proposta de pesquisa com as fontes", async () => {
    const m = backendMemoria(() => AGORA);
    await clienteBase(m.b);
    const { llm, enviados } = llmRoteiro([() => entregar({ resumo: "Semana de treino curto.", itens: [
      { tipo: "Pauta quente", insight: "Treino de 20 minutos em alta", porque_importa: "casa com a persona sem tempo", fonte_titulo: "G1", url: "https://g1.globo.com/x", data_fonte: "2026-09-22", relevancia: "alta" },
      { tipo: "Tendência", insight: "Inventado sem fonte", porque_importa: "-", fonte_titulo: "-", url: "", data_fonte: "", relevancia: "baixa" },
    ] })]);
    const r = await executarAgente(deps(m, llm), WS, CLI, "radar", "agenda");
    expect(r.status).toBe("ok");
    expect(enviados[0]!.tools.some((t: any) => t.type === "web_search_20260209")).toBe(true);
    const p = m.propostas[0]!;
    expect(p).toMatchObject({ tipo: "pesquisa", agente: "radar", client_id: CLI });
    expect(p.payload.items).toHaveLength(1);
    expect(p.payload.items[0]).toMatchObject({ url: "https://g1.globo.com/x", origem: "G1", data: "2026-09-22" });
    expect(m.runs[0]).toMatchObject({ status: "ok", buscas_web: 0, modelo: "claude-opus-5" });
  });

  it("Íris: sugestões entram PENDENTES no DNA, sem repetir o que já existe", async () => {
    const m = backendMemoria(() => AGORA);
    await clienteBase(m.b);
    const { llm } = llmRoteiro([() => entregar({ sugestoes: [
      { section: "audience", field: "persona", value: "mulheres de 30 a 45 anos", state: "FACT" },
      { section: "audience", field: "objecoes", value: "Acham caro", state: "FACT" },
    ] })]);
    await executarAgente(deps(m, llm), WS, CLI, "iris", "briefing novo");
    const dna = (await m.b.getDoc(WS, `cos_dna/${CLI}`))!.entries;
    expect(dna).toHaveLength(4);
    expect(dna[3]).toMatchObject({ field: "objecoes", status: "pending", src: "Íris (agente) · briefing novo" });
    expect(m.propostas[0]).toMatchObject({ tipo: "aviso", payload: { ir: "dna", n: 1 } });
  });

  it("Estúdio: escreve as peças da próxima semana sem texto, no formato do painel, e manda para Aprovações", async () => {
    const m = backendMemoria(() => AGORA);
    await clienteBase(m.b);
    const idea = (surface: string, t: string) => ({ id: t, titulo: t, surface, format: surface === "Carrossel" ? "Carrossel educativo" : "Talking Head", funil: "meio", cta: "Salve", gatilhos: ["Curiosidade"], elementos: [] });
    await m.b.setDoc(WS, `cos_calendar/${CLI}/items/cal-1`, { id: "cal-1", data: "2026-09-27", idea: idea("Reel", "A"), status: "PLANNED", content: null });
    await m.b.setDoc(WS, `cos_calendar/${CLI}/items/cal-2`, { id: "cal-2", data: "2026-09-29", idea: idea("Carrossel", "B"), status: "PLANNED" });
    await m.b.setDoc(WS, `cos_calendar/${CLI}/items/cal-3`, { id: "cal-3", data: "2026-10-20", idea: idea("Reel", "C"), status: "PLANNED" });
    await m.b.setDoc(WS, `cos_calendar/${CLI}/items/cal-4`, { id: "cal-4", data: "2026-09-28", idea: idea("Reel", "D"), status: "PLANNED", content: { headline: "já escrito" } });
    const { llm, enviados } = llmRoteiro([
      () => entregar({ headline: "Trinta minutos", roteiro: [{ label: "Hook", text: "h" }], copyCurta: "c", copyMedia: "m", copyLonga: "l", cta: "Salve", emocao: "alívio", emocaoPor: "p", direcaoVisual: "v" }),
      () => entregar({ capaHeadline: "Capa", hook: "h", estrutura: "lista", slides: [{ papel: "Capa", titulo: "t", texto: "x" }], copy: "c", cta: "Salve", emocao: "e", emocaoPor: "p", direcaoVisual: "v" }),
    ]);
    const r = await executarAgente(deps(m, llm), WS, CLI, "estudio", "agenda");
    expect(r).toMatchObject({ status: "ok", propostas: 2 });
    expect(enviados).toHaveLength(2);
    expect(enviados[0]!.system).toMatch(/cara de IA/);
    const c1 = (await m.b.getDoc(WS, `cos_calendar/${CLI}/items/cal-1`))!;
    expect(c1).toMatchObject({ status: "WAITING APPROVAL", content: { origem: "agente", headline: "Trinta minutos", copy: "m", copyVariants: { longa: "l" } } });
    const c2 = (await m.b.getDoc(WS, `cos_calendar/${CLI}/items/cal-2`))!;
    expect(c2.carousel.slides[0]).toMatchObject({ n: 1, papel: "Capa" });
    expect((await m.b.getDoc(WS, `cos_calendar/${CLI}/items/cal-3`))!.content).toBeUndefined();
    expect(m.propostas.at(-1)).toMatchObject({ tipo: "aviso", payload: { ir: "approvals", n: 2 } });
  });

  it("Pulso: sem 3 posts medidos não roda (e não gasta); com dados, aprendizado vai ao DNA como LEARNING pendente", async () => {
    const m = backendMemoria(() => AGORA);
    await clienteBase(m.b);
    const { llm, enviados } = llmRoteiro([() => entregar({ leitura: "Reel lidera.", aprendizados: [{ texto: "Reel engaja mais", evidencia: "3,1% contra 1,2% em 4 posts" }], recomendacoes: ["mais Reel"], proximo_teste: "gancho em pergunta" })]);
    expect((await executarAgente(deps(m, llm), WS, CLI, "pulso", "agenda")).status).toBe("pulado");
    expect(enviados).toHaveLength(0);
    for (let i = 1; i <= 3; i++) await m.b.setDoc(WS, `cos_calendar/${CLI}/items/cal-${i}`, { id: `cal-${i}`, data: `2026-09-0${i}`, idea: { surface: "Reel", funil: "topo" }, metrics: { alcance: 1000 * i, salvamentos: 10 } });
    const r = await executarAgente(deps(m, llm), WS, CLI, "pulso", "resultado novo");
    expect(r.status).toBe("ok");
    expect(await m.b.getDoc(WS, `cos_pulso/${CLI}`)).toMatchObject({ leitura: "Reel lidera.", posts: 3 });
    expect((await m.b.getDoc(WS, `cos_dna/${CLI}`))!.entries.at(-1)).toMatchObject({ state: "LEARNING", status: "pending", value: "Reel engaja mais (3,1% contra 1,2% em 4 posts)" });
    // O que ele leu para decidir: os números reais, agregados.
    expect(JSON.stringify(enviados[0]!.tools.map((t: any) => t.name))).toMatch(/ler_desempenho/);
  });

  it("teto do mês: agente não roda e registra o motivo", async () => {
    const m = backendMemoria(() => AGORA);
    await clienteBase(m.b);
    const { llm, enviados } = llmRoteiro([() => entregar({})]);
    const r = await executarAgente(deps(m, llm, { orcamentoMes: 0 }), WS, CLI, "atlas", "agenda");
    expect(r).toMatchObject({ status: "pulado" });
    expect(r.motivo).toMatch(/teto/);
    expect(enviados).toHaveLength(0);
  });

  it("erro da API fica registrado na execução", async () => {
    const m = backendMemoria(() => AGORA);
    await clienteBase(m.b);
    const llm = { create: async () => { throw new Error("529 overloaded"); } };
    const r = await executarAgente(deps(m, llm), WS, CLI, "iris", "agenda");
    expect(r.status).toBe("erro");
    expect(m.runs[0]).toMatchObject({ status: "erro", erro: "529 overloaded" });
  });
});

describe("Maestro", () => {
  it("horários em Brasília: semanal, mensal e diário", () => {
    expect(ultimoHorario("semanal:1:7", AGORA)!.toISOString()).toBe("2026-09-21T10:00:00.000Z"); // segunda 7h BRT
    expect(ultimoHorario("mensal:1:8", AGORA)!.toISOString()).toBe("2026-09-01T11:00:00.000Z");
    expect(ultimoHorario("mensal:25:9", AGORA)!.toISOString()).toBe("2026-09-25T12:00:00.000Z");
    expect(ultimoHorario("mensal:25:9", new Date("2026-09-25T11:00:00Z"))!.toISOString()).toBe("2026-08-25T12:00:00.000Z");
    expect(ultimoHorario("diario:6", new Date("2026-09-25T08:00:00Z"))!.toISOString()).toBe("2026-09-24T09:00:00.000Z");
    expect(ultimoHorario(null, AGORA)).toBeNull();
  });

  it("batida: agenda por cliente; o Pulso do dia de planejar chama o Átlas na sequência", async () => {
    const m = backendMemoria(() => AGORA);
    await clienteBase(m.b);
    const { llm } = llmRoteiro([() => entregar({ resumo: "x", itens: [] })]);
    const d = deps(m, llm);
    const r1 = await batida(d, 20);
    // Com agenda: Radar (segunda), Estúdio (todo dia) e Pulso (dia de planejar do cliente, padrão 20).
    expect(r1.enfileiradas).toBe(3);
    expect(r1.rodadas.map((x) => x.agente).sort()).toEqual(["estudio", "pulso", "radar"]);
    expect(r1.rodadas.find((x) => x.agente === "pulso")).toMatchObject({ status: "pulado", motivo: "menos de 3 posts medidos" });
    // Mesmo sem dados para o Pulso, a cadeia segue: o Átlas foi para a fila com o gatilho do planejamento.
    const r2 = await batida(d, 20);
    expect(r2.enfileiradas).toBe(0);
    expect(r2.rodadas.map((x) => x.agente)).toEqual(["atlas"]);
    expect(m.runs.find((x) => x.agente === "atlas")!.gatilho).toBe("planejamento do mês");
    expect((await batida(d, 20)).rodadas).toHaveLength(0);
  });

  it("dia de planejar vem da ficha do cliente", async () => {
    let agora = AGORA;
    const m = backendMemoria(() => agora);
    await clienteBase(m.b);
    const cli = (await m.b.getDoc(WS, `cos_clients/${CLI}`))!;
    await m.b.setDoc(WS, `cos_clients/${CLI}`, { ...cli, operacao: { diaPlanejamento: 26 } });
    const d = { ...deps(m, llmRoteiro([() => entregar({})]).llm), agora: () => agora };
    await batida(d, 20); // primeira vez: roda o planejamento pendente de agosto
    const antes = m.tarefas.filter((t) => t.agente === "pulso").length;
    agora = new Date("2026-09-26T09:00:00Z"); // 26/09, 6h em Brasília: antes das 7h
    await batida(d, 20);
    expect(m.tarefas.filter((t) => t.agente === "pulso").length).toBe(antes);
    agora = new Date("2026-09-26T10:30:00Z"); // 7h30 em Brasília: abriu o planejamento deste cliente
    await batida(d, 20);
    expect(m.tarefas.filter((t) => t.agente === "pulso").length).toBe(antes + 1);
  });

  it("modo manual: a agenda ignora o agente; só roda quando alguém clica", async () => {
    const m = backendMemoria(() => AGORA);
    await clienteBase(m.b);
    const cli = (await m.b.getDoc(WS, `cos_clients/${CLI}`))!;
    await m.b.setDoc(WS, `cos_clients/${CLI}`, { ...cli, operacao: { agentes: { radar: "manual" } } });
    const { llm, enviados } = llmRoteiro([() => entregar({ resumo: "x", itens: [{ tipo: "Pauta quente", insight: "i", porque_importa: "p", fonte_titulo: "G1", url: "https://g1.globo.com/x", data_fonte: "2026-09-24", relevancia: "alta" }] })]);
    const d = deps(m, llm);
    const r = await batida(d, 20);
    expect(r.rodadas.map((x) => x.agente)).not.toContain("radar");
    expect((await executarAgente(d, WS, CLI, "radar", "resultado novo")).motivo).toMatch(/manual/);
    expect(enviados).toHaveLength(0);
    expect((await executarAgente(d, WS, CLI, "radar", "rodado no painel")).status).toBe("ok");
  });

  it("Cronos: distribui as ideias sem data no próximo trecho vazio, sem IA e sem repetir", async () => {
    const m = backendMemoria(() => AGORA);
    await clienteBase(m.b);
    const cli = (await m.b.getDoc(WS, `cos_clients/${CLI}`))!;
    await m.b.setDoc(WS, `cos_clients/${CLI}`, { ...cli, rotina: { diasPost: [2, 4] } });
    for (const [i, funil] of (["topo", "meio", "fundo", "topo"] as const).entries())
      await m.b.setDoc(WS, `cos_ideas/${CLI}/items/idea-${i + 1}`, { id: `idea-${i + 1}`, titulo: `Ideia ${i + 1}`, funil, surface: "Carrossel" });
    const llm = { create: async () => { throw new Error("o Cronos não pode chamar a IA"); } };
    const r = await executarAgente(deps(m, llm), WS, CLI, "cronos", "ideias novas");
    expect(r).toMatchObject({ status: "ok", custo_usd: 0 });
    const itens = (await m.b.listDocs(WS, `cos_calendar/${CLI}/items`)).map((x) => x.data);
    // Hoje 25/09 (sexta): sobram menos de 10 dias em setembro, então o trecho vai até 31/10. Terças e quintas.
    expect(itens.map((x) => x.data)).toEqual(["2026-09-29", "2026-10-01", "2026-10-06", "2026-10-08"]);
    expect(new Set(itens.map((x) => x.idea.id)).size).toBe(4);
    expect(itens.every((x) => x.status === "PLANNED")).toBe(true);
    expect(m.propostas.at(-1)).toMatchObject({ agente: "cronos", tipo: "aviso", payload: { n: 4, faltaram: 6 } });
    expect((await executarAgente(deps(m, llm), WS, CLI, "cronos", "ideias novas")).motivo).toBe("nenhuma ideia aprovada sem data");
  });
});

describe("Knowledge Base", () => {
  it("fatia o markdown por seção, com título e agentes do pilar", () => {
    const t = trechosDoMarkdown("knowledge-base/pilares/criacao-alto-valor.md", "# Criação de alto valor\n\nIntro curta demais.\n\n## Ganchos\n\nGanchos canônicos prendem a atenção nos primeiros segundos, com promessa específica.\n\n## Ressonância\n\nO conteúdo ressoa quando nomeia a experiência exata da persona, com as palavras dela.");
    expect(t.map((x) => x.secao)).toEqual(["Ganchos", "Ressonância"]);
    expect(t[0]).toMatchObject({ titulo: "Criação de alto valor", agentes: ["musa", "estudio"] });
  });
});
