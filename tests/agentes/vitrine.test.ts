import { describe, it, expect } from "vitest";
import { backendMemoria } from "./memoria.js";
import { dadosDaVitrine, decidirPauta, icsDaAgenda } from "../../supabase/functions/_shared/vitrine.ts";

const WS = "ws-1", CLI = "ana";
const AGORA = new Date("2026-09-28T15:00:00Z");

async function base() {
  const m = backendMemoria(() => AGORA);
  await m.b.setDoc(WS, `cos_clients/${CLI}`, { id: CLI, name: "Ana Nutri", niche: "Nutrição", admin: { valor: 1500, whats: "11999999999" }, rotina: { gravDia: 1, gravHora: "10:00", Reel: "19:00" }, operacao: { clienteAprova: "calendario_e_pecas", prazoCliente: 2 } });
  await m.b.setDoc(WS, `cos_calendar/${CLI}/items/p1`, { id: "p1", data: "2026-10-06", status: "WAITING APPROVAL", idea: { titulo: "Mito do jejum", surface: "Reel", funil: "topo" }, content: { headline: "Jejum não é mágica", copy: "Legenda", origem: "agente", custo: 0.2 }, metrics: { alcance: 10 } });
  await m.b.setDoc(WS, `cos_calendar/${CLI}/items/p2`, { id: "p2", data: "2026-10-08", status: "PLANNED", idea: { titulo: "Carrossel", surface: "Carrossel", funil: "meio" } });
  await m.b.setDoc(WS, `cos_calendar/${CLI}/items/velha`, { id: "velha", data: "2026-08-01", status: "PUBLISHED", idea: { titulo: "Antiga", surface: "Reel" } });
  await m.b.setDoc(WS, `cos_calendar/${CLI}/items/foi`, { id: "foi", data: "2026-09-26", status: "PUBLISHED", idea: { titulo: "Já foi ao ar", surface: "Reel" } });
  return m;
}

describe("vitrine e agenda por link", () => {
  it("o cliente vê só as pautas do período e só o necessário (nada de valor, WhatsApp, custo ou métricas)", async () => {
    const m = await base();
    const d = await dadosDaVitrine(m.b, WS, CLI, AGORA);
    expect(d.itens.map((i) => i.id)).toEqual(["p1", "p2"]);
    expect(d.cliente).toMatchObject({ name: "Ana Nutri", niche: "Nutrição" });
    const tudo = JSON.stringify(d);
    for (const vazado of ["1500", "11999999999", "custo", "origem", "metrics", "alcance"]) expect(tudo).not.toContain(vazado);
  });

  it("aprovar ou pedir ajuste grava na peça e no histórico; ajuste sem texto não passa", async () => {
    const m = await base();
    expect(await decidirPauta(m.b, WS, CLI, "p1", "ajuste", "  ", AGORA)).toEqual({ erro: "Conte o que você gostaria de ajustar." });
    expect(await decidirPauta(m.b, WS, CLI, "p1", "ajuste", "Troca a foto", AGORA)).toEqual({ ok: true, clientStatus: "ajuste" });
    expect(await m.b.getDoc(WS, `cos_calendar/${CLI}/items/p1`)).toMatchObject({ clientStatus: "ajuste", clientNote: "Troca a foto", status: "WAITING APPROVAL" });
    expect(await decidirPauta(m.b, WS, CLI, "p1", "aprovado", "", AGORA)).toEqual({ ok: true, clientStatus: "aprovado" });
    expect(m.aprovacoes.map((a: any) => [a.objeto, a.decisao, a.ref, a.por])).toEqual([["peca", "ajuste", "vitrine:p1", null], ["peca", "aprovado", "vitrine:p1", null]]);
    expect(await decidirPauta(m.b, WS, CLI, "../x", "aprovado", "", AGORA)).toEqual({ erro: "Pauta não encontrada." });
    expect(await decidirPauta(m.b, WS, CLI, "p1", "apagar", "", AGORA)).toEqual({ erro: "Decisão inválida." });
  });

  it("agenda assinável: publicação no horário da rotina e o dia de gravação com as peças da semana", async () => {
    const m = await base();
    const ics = await icsDaAgenda(m.b, WS, [CLI], AGORA);
    expect(ics).toContain("DTSTART:20261006T190000");
    expect(ics).toContain("SUMMARY:Postar Reel: Jejum não é mágica");
    // As duas peças gravam na segunda 05/10 às 10h, num evento só.
    expect(ics).toContain("UID:prod-ana-2026-10-05@content-os");
    expect(ics).toContain("DTSTART:20261005T100000");
    expect(ics).toMatch(/Gravação e produção\\, 2 peças/);
    expect(ics).not.toContain("Antiga");
    expect(ics.split("\r\n").every((l) => Array.from(l).length <= 61)).toBe(true);
  });
});
