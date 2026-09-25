import { describe, it, expect } from "vitest";
import { backendMemoria, entregar, llmRoteiro, usar } from "./memoria.js";
import { conversar } from "../../supabase/functions/_shared/conversa.ts";

const WS = "ws-1";
const AGORA = new Date("2026-09-25T18:00:00Z");

async function base() {
  const m = backendMemoria(() => AGORA);
  await m.b.setDoc(WS, "cos_clients/academia", { id: "academia", name: "Academia Teste", niche: "Educador Físico", briefing: "Mulheres de 30 a 45 anos." });
  await m.b.setDoc(WS, "cos_clients/clinica", { id: "clinica", name: "Clínica Sorriso", niche: "Dentista" });
  return m;
}

describe("chat do Maestro", () => {
  it("lê o cliente com as ferramentas e devolve só ações válidas, sem repetir", async () => {
    const m = await base();
    const { llm, enviados } = llmRoteiro([
      () => usar("listar_clientes"),
      () => usar("ver_cliente", { cliente: "academia" }),
      () => entregar({
        resposta: "Vou planejar outubro da Academia. A proposta de estratégia aparece em Propostas.",
        acoes: [
          { cliente: "academia", agente: "atlas", motivo: "planejar o mês" },
          { cliente: "academia", agente: "atlas", motivo: "repetido" },
          { cliente: "inexistente", agente: "musa", motivo: "cliente que não existe" },
          { cliente: "academia", agente: "inventado", motivo: "agente que não existe" },
        ],
      }),
    ]);
    const r = await conversar({ b: m.b, llm, modelo: "claude-opus-5", ws: WS, mensagem: "planeja outubro da academia", historico: [{ de: "voce", texto: "oi" }, { de: "maestro", texto: "Oi." }] });
    expect(r.acoes).toEqual([{ cliente: "academia", agente: "atlas", motivo: "planejar o mês" }]);
    expect(r.resposta).toContain("Propostas");
    // O resultado de listar_clientes chegou ao modelo com os dois clientes.
    const res = JSON.stringify(enviados[1]!.messages.at(-1));
    expect(res).toContain("Clínica Sorriso");
    // O estado do cliente chegou com o briefing.
    expect(JSON.stringify(enviados[2]!.messages.at(-1))).toContain("Mulheres de 30 a 45 anos");
    // O histórico entra no pedido.
    expect(String(enviados[0]!.messages[0].content)).toContain("Pessoa: oi");
  });

  it("pergunta sem ação não aciona nada", async () => {
    const m = await base();
    const { llm } = llmRoteiro([() => entregar({ resposta: "A Clínica ainda não tem briefing.", acoes: [] })]);
    const r = await conversar({ b: m.b, llm, modelo: "claude-opus-5", ws: WS, mensagem: "como está a clínica?", clienteEmFoco: "clinica" });
    expect(r.acoes).toEqual([]);
    expect(r.uso.custo_usd).toBeGreaterThanOrEqual(0);
  });

  it("cliente desconhecido em ver_cliente volta como erro para o modelo, não derruba a conversa", async () => {
    const m = await base();
    const { llm, enviados } = llmRoteiro([
      () => usar("ver_cliente", { cliente: "nada" }),
      () => entregar({ resposta: "Não achei esse cliente.", acoes: [] }),
    ]);
    const r = await conversar({ b: m.b, llm, modelo: "claude-opus-5", ws: WS, mensagem: "e o nada?" });
    expect(r.resposta).toContain("Não achei");
    expect(JSON.stringify(enviados[1]!.messages.at(-1))).toContain("is_error");
  });
});
