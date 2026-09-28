import { describe, it, expect } from "vitest";
import { backendMemoria } from "./memoria.js";
import { diaDeProducao, prazosDaPeca } from "../../supabase/functions/_shared/prazos.ts";
import { pecasSemTexto } from "../../supabase/functions/_shared/agentes.ts";
import { operacaoDe } from "../../supabase/functions/_shared/operacao.ts";
import { montarPeriodo } from "../../supabase/functions/_shared/cronos.ts";

const WS = "ws-1", CLI = "ana";

describe("prazos da peça", () => {
  it("produção é o último dia de gravação antes da publicação", () => {
    // Gravação na segunda (1): post de terça grava na véspera; post de segunda grava na semana anterior.
    expect(diaDeProducao("2026-10-06", 1)).toBe("2026-10-05");
    expect(diaDeProducao("2026-10-05", 1)).toBe("2026-09-28");
    expect(diaDeProducao("2026-10-09", 4)).toBe("2026-10-08");
  });

  it("cliente aprova peça: roteiro sai antes do prazo dele, aprovação na véspera da gravação", () => {
    expect(prazosDaPeca("2026-10-06", { gravDia: 1 }, { clienteAprova: "calendario_e_pecas", prazoCliente: 2 }))
      .toEqual({ texto: "2026-10-02", aprovacao: "2026-10-04", producao: "2026-10-05", publicacao: "2026-10-06" });
    // Sem aprovação do cliente por peça: o texto fica pronto na véspera da produção.
    expect(prazosDaPeca("2026-10-06", { gravDia: 1 }, { clienteAprova: "calendario" })).toMatchObject({ texto: "2026-10-04", aprovacao: null });
    // Gravação no domingo (0) é válida; valor inválido cai na segunda.
    expect(prazosDaPeca("2026-10-06", { gravDia: 0 }, {}).producao).toBe("2026-10-04");
    expect(prazosDaPeca("2026-10-06", { gravDia: "x" }, {}).producao).toBe("2026-10-05");
  });

  it("Estúdio pega a peça pelo prazo do roteiro: o post de segunda que grava hoje não fica para o dia da gravação", async () => {
    const m = backendMemoria(() => new Date("2026-09-25T09:00:00Z"));
    await m.b.setDoc(WS, `cos_clients/${CLI}`, { id: CLI, rotina: { gravDia: 1 } });
    const peca = (id: string, data: string) => m.b.setDoc(WS, `cos_calendar/${CLI}/items/${id}`, { id, data, status: "PLANNED", idea: { surface: "Reel" } });
    await peca("seg-05", "2026-10-05"); // grava 28/09, cliente aprova até 27/09: roteiro até 25/09
    await peca("ter-06", "2026-10-06"); // grava 05/10: roteiro até 02/10
    await peca("ter-13", "2026-10-13"); // roteiro até 09/10, fora da janela de 7 dias
    const c = { b: m.b, ws: WS, cli: CLI, agora: new Date("2026-09-25T09:00:00Z"), gatilho: "agenda", op: operacaoDe({}) };
    const r = await pecasSemTexto(c as any);
    // Pela data de publicação (regra antiga), o post de 05/10 ficava fora da janela e era escrito no dia da gravação.
    expect(r.map((d) => [d.data.id, d.prazo])).toEqual([["seg-05", "2026-09-25"], ["ter-06", "2026-10-02"]]);
  });

  it("Cronos: nos dias da campanha vale o foco dela; fora, o foco do cliente", () => {
    const ideias = ["topo", "meio", "fundo"].flatMap((f) => Array.from({ length: 12 }, (_, i) => ({ id: `${f}-${i}`, funil: f, surface: "Carrossel" })));
    const rotina = { diasPost: [1, 2, 3, 4, 5], foco: "topo" };
    const m = montarPeriodo(ideias, rotina, "2026-10-05", "2026-10-30", [{ id: "lanc", nome: "Lançamento", inicio: "2026-10-19", fim: "2026-10-30", foco: "fundo" }]);
    const conta = (de: string, ate: string) => m.itens.filter((i) => i.data >= de && i.data <= ate).reduce((a: Record<string, number>, i) => ((a[i.idea.funil] = (a[i.idea.funil] || 0) + 1), a), {});
    const antes = conta("2026-10-05", "2026-10-16"), durante = conta("2026-10-19", "2026-10-30");
    expect(antes.topo).toBeGreaterThan(antes.fundo ?? 0);
    expect(durante.fundo).toBeGreaterThan(durante.topo ?? 0);
  });
});
