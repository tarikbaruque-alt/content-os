import { describe, it, expect } from "vitest";
import { backendMemoria, entregar, llmRoteiro } from "./memoria.js";
import { executarAgente, type Deps } from "../../supabase/functions/_shared/maestro.ts";
import { agendaDo, AGENTE } from "../../supabase/functions/_shared/agentes.ts";
import { operacaoDe } from "../../supabase/functions/_shared/operacao.ts";
import { batida } from "../../supabase/functions/_shared/maestro.ts";
import { etapasDoCliente, travaDaGravacao, pathDoCliente, DNA_MINIMO } from "../../supabase/functions/_shared/processo.ts";

const WS = "ws-1", CLI = "ana";
const AGORA = new Date("2026-09-25T18:00:00Z");
const dna = (aprov: number, pend = 0) => ({ entries: [
  ...Array.from({ length: aprov }, (_, i) => ({ section: "audience", field: `f${i}`, value: `v${i}`, state: "FACT", status: "approved" })),
  ...Array.from({ length: pend }, (_, i) => ({ section: "audience", field: `p${i}`, value: `p${i}`, state: "HYPOTHESIS", status: "pending" })),
] });
function deps(m: ReturnType<typeof backendMemoria>, llm: Deps["llm"]): Deps {
  return { b: m.b, llm, modelo: "claude-opus-5", orcamentoMes: 50, agora: () => AGORA };
}
const semIA = { create: async () => { throw new Error("não devia chamar a IA"); } };

describe("travas do processo", () => {
  it("Átlas não roda sem DNA_MINIMO registros aprovados, mesmo com muitos pendentes", async () => {
    const m = backendMemoria(() => AGORA);
    await m.b.setDoc(WS, `cos_clients/${CLI}`, { id: CLI, name: "Ana", briefing: "x" });
    await m.b.setDoc(WS, `cos_dna/${CLI}`, dna(DNA_MINIMO - 1, 10));
    const r = await executarAgente(deps(m, semIA), WS, CLI, "atlas", "agenda");
    expect(r.status).toBe("pulado");
    expect(r.motivo).toBe(`Content DNA com ${DNA_MINIMO - 1} de ${DNA_MINIMO} registros aprovados`);
  });

  it("Íris entrega o DNA pendente e não chama o Átlas (a equipe aprova antes)", async () => {
    const m = backendMemoria(() => AGORA);
    await m.b.setDoc(WS, `cos_clients/${CLI}`, { id: CLI, name: "Ana", briefing: "Atendo mulheres de 30 a 45 anos." });
    const { llm } = llmRoteiro([() => entregar({ resumo: "ok", sugestoes: [{ section: "audience", field: "persona", value: "Mulheres 30 a 45", state: "FACT" }] })]);
    const r = await executarAgente(deps(m, llm), WS, CLI, "iris", "briefing novo");
    expect(r.status).toBe("ok");
    expect(m.tarefas.filter((t) => t.agente === "atlas")).toHaveLength(0);
  });

  it("Musa não roda sem linha editorial aprovada", async () => {
    const m = backendMemoria(() => AGORA);
    await m.b.setDoc(WS, `cos_clients/${CLI}`, { id: CLI, name: "Ana", rotina: { dias: [1, 3, 5] } });
    await m.b.setDoc(WS, `cos_strategy/${CLI}`, { bigMessage: "x" });
    const r = await executarAgente(deps(m, semIA), WS, CLI, "musa", "rodado no painel");
    expect(r).toMatchObject({ status: "pulado", motivo: "sem linha editorial aprovada" });
  });

  it("gravação do plano respeita a ordem: estratégia, linha, ideias", async () => {
    const m = backendMemoria(() => AGORA);
    await m.b.setDoc(WS, `cos_dna/${CLI}`, dna(2));
    expect(await travaDaGravacao(m.b, WS, CLI, new Set(["estrategia"]))).toMatch(/pelo menos 5/);
    expect(await travaDaGravacao(m.b, WS, CLI, new Set(["editorial"]))).toMatch(/depois da estratégia/);
    expect(await travaDaGravacao(m.b, WS, CLI, new Set(["ideias"]))).toMatch(/depois da linha editorial/);
    await m.b.setDoc(WS, `cos_dna/${CLI}`, dna(5));
    expect(await travaDaGravacao(m.b, WS, CLI, new Set(["estrategia"]))).toBeNull();
    // No mesmo pacote (restauração), a estratégia que vem junto libera a linha.
    expect(await travaDaGravacao(m.b, WS, CLI, new Set(["estrategia", "editorial"]))).toBeNull();
  });

  it("só aceita caminhos do plano do próprio cliente", () => {
    expect(pathDoCliente("cos_strategy/ana", "ana")).toBe(true);
    expect(pathDoCliente("cos_ideas/ana/items/idea-3", "ana")).toBe(true);
    expect(pathDoCliente("cos_strategy/outro", "ana")).toBe(false);
    expect(pathDoCliente("cos_clients/ana", "ana")).toBe(false);
    expect(pathDoCliente("cos_ideas/ana/items/a/b", "ana")).toBe(false);
    expect(pathDoCliente("cos_strategy/ana/x", "ana")).toBe(false);
  });

  it("etapa do cliente sai do banco: briefing, DNA, plano e o ciclo do mês", async () => {
    const m = backendMemoria(() => AGORA);
    const et = async () => etapasDoCliente(m.b, WS, CLI, AGORA);
    await m.b.setDoc(WS, `cos_clients/${CLI}`, { id: CLI, name: "Ana" });
    let r = await et();
    expect(r.atual).toBe(1);
    expect(r.etapas.map((e) => e.estado)).toEqual(["atual", "bloqueada", "bloqueada", "bloqueada", "bloqueada", "bloqueada"]);
    expect(r.etapas[0]).toMatchObject({ quem: "cliente" });

    await m.b.setDoc(WS, `cos_clients/${CLI}`, { id: CLI, name: "Ana", briefing: "x" });
    await m.b.setDoc(WS, `cos_dna/${CLI}`, dna(3, 4));
    r = await et();
    expect(r.atual).toBe(2);
    expect(r.etapas[1]).toMatchObject({ estado: "atual", feito: 3, total: 5, quem: "equipe" });

    await m.b.setDoc(WS, `cos_dna/${CLI}`, dna(5));
    await m.b.setDoc(WS, `cos_strategy/${CLI}`, { bigMessage: "x" });
    r = await et();
    expect(r.atual).toBe(3);
    expect(r.etapas[2]).toMatchObject({ estado: "atual", feito: 1, total: 4, falta: "Falta a linha editorial aprovada.", quem: "agente" });

    await m.b.setDoc(WS, `cos_editorial/${CLI}`, { pilares: [] });
    await m.b.setDoc(WS, `cos_ideas/${CLI}/items/idea-1`, { id: "idea-1" });
    await m.b.setDoc(WS, `cos_calendar/${CLI}/items/c1`, { id: "c1", data: "2026-09-20", status: "PUBLISHED", content: {}, metrics: { alcance: 100 } });
    await m.b.setDoc(WS, `cos_calendar/${CLI}/items/c2`, { id: "c2", data: "2026-09-29", status: "WAITING APPROVAL", content: {} });
    r = await et();
    expect(r.etapas.slice(0, 3).map((e) => e.estado)).toEqual(["feita", "feita", "feita"]);
    expect(r.atual).toBe(4);
    expect(r.etapas[3]).toMatchObject({ estado: "atual", feito: 1, total: 2, quem: "equipe" });
    expect(r.etapas[4]).toMatchObject({ estado: "feita", feito: 1, total: 1 });
    expect(r.etapas[5]).toMatchObject({ estado: "feita", feito: 1, total: 1 });
  });

  it("horários são do cliente: planejamento, pesquisa e Estúdio seguem a ficha, com limites", () => {
    const op = operacaoDe({ operacao: { diaPlanejamento: 15, horarios: { planHora: 9, radarDia: 3, radarHora: 8, estHora: 5, estDias: 99 } } });
    expect(agendaDo(AGENTE.pulso!, op)!.agenda).toBe("mensal:15:9");
    expect(agendaDo(AGENTE.radar!, op)!.agenda).toBe("semanal:3:8");
    expect(agendaDo(AGENTE.estudio!, op)!.agenda).toBe("diario:5");
    expect(op.horarios.estDias).toBe(21);
    const padrao = operacaoDe({});
    expect([agendaDo(AGENTE.radar!, padrao)!.agenda, agendaDo(AGENTE.estudio!, padrao)!.agenda, agendaDo(AGENTE.pulso!, padrao)!.agenda]).toEqual(["semanal:1:7", "diario:6", "mensal:20:7"]);
  });

  it("cliente pausado: a agenda não enfileira nada e agente só roda se alguém pedir", async () => {
    const m = backendMemoria(() => AGORA);
    await m.b.setDoc(WS, `cos_clients/${CLI}`, { id: CLI, name: "Ana", briefing: "x", operacao: { pausado: true } });
    const r = await batida(deps(m, semIA));
    expect(r.enfileiradas).toBe(0);
    expect(await executarAgente(deps(m, semIA), WS, CLI, "radar", "agenda")).toMatchObject({ status: "pulado", motivo: "cliente pausado" });
  });
});
