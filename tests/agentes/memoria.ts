import type { Backend, ClienteLlm, Execucao, Proposta, RespostaLlm, Tarefa } from "../../supabase/functions/_shared/tipos.ts";

/** Backend em memória com o mesmo comportamento do Supabase (fila sem duplicar, gasto do mês…). */
export function backendMemoria(agora: () => Date) {
  const docs = new Map<string, Record<string, any>>();
  const tempos = new Map<string, string>();
  const runs: ({ id: string; ws: string; cli: string | null; agente: string; gatilho: string; started: Date } & Partial<Execucao>)[] = [];
  const propostas: (Proposta & { id: string })[] = [];
  const tarefas: (Tarefa & { status: string; created: Date })[] = [];
  const config: Record<string, Record<string, { ativo: boolean; agenda: string | null }>> = {};
  const kb: { ws: string | null; fonte: string; titulo: string; secao: string | null; texto: string }[] = [];
  let seq = 0;
  const k = (ws: string, p: string) => `${ws}::${p}`;
  const b: Backend = {
    async getDoc(ws, p) { const v = docs.get(k(ws, p)); return v ? structuredClone(v) : null; },
    async setDoc(ws, p, d) { docs.set(k(ws, p), structuredClone(d)); tempos.set(k(ws, p), agora().toISOString()); },
    async quando(ws, p) { return tempos.get(k(ws, p)) ?? null; },
    async listDocs(ws, parent) {
      return [...docs.entries()].filter(([key]) => key.startsWith(`${ws}::${parent}/`) && key.slice(`${ws}::${parent}/`.length).indexOf("/") < 0)
        .map(([key, data]) => ({ path: key.split("::")[1]!, data: structuredClone(data), updated_at: tempos.get(key) })).sort((a, c) => (a.path < c.path ? -1 : 1));
    },
    async buscarKB(ws, consulta) {
      const termos = consulta.toLowerCase().split(/\W+/).filter((t) => t.length > 3);
      return kb.filter((t) => (t.ws === null || t.ws === ws) && termos.some((x) => t.texto.toLowerCase().includes(x))).slice(0, 5);
    },
    async iniciarExecucao(ws, cli, agente, gatilho) { const id = `run-${++seq}`; runs.push({ id, ws, cli, agente, gatilho, started: agora(), status: undefined }); return id; },
    async terminarExecucao(id, e) { Object.assign(runs.find((r) => r.id === id)!, e); },
    async criarProposta(p) { const id = `prop-${++seq}`; propostas.push({ ...p, id }); return id; },
    async gastoDoMes(ws) { return runs.filter((r) => r.ws === ws).reduce((s, r) => s + (r.custo_usd ?? 0), 0); },
    async ultimaVez(ws, cli, ag, gat) {
      const ok = (g: string) => !gat || g === gat;
      const ts = [...runs.filter((r) => r.ws === ws && r.cli === cli && r.agente === ag && ok(r.gatilho)).map((r) => r.started), ...tarefas.filter((t) => t.workspace_id === ws && t.client_id === cli && t.agente === ag && ok(t.gatilho)).map((t) => t.created)];
      return ts.length ? new Date(Math.max(...ts.map((t) => t.getTime()))) : null;
    },
    async workspaces() { return [...new Set([...docs.keys()].map((x) => x.split("::")[0]!))]; },
    async configAgentes(ws) { return config[ws] ?? {}; },
    async enfileirar(ws, cli, agente, gatilho) {
      if (tarefas.some((t) => t.workspace_id === ws && t.client_id === cli && t.agente === agente && t.status === "pendente")) return;
      tarefas.push({ id: `t-${++seq}`, workspace_id: ws, client_id: cli, agente, gatilho, tentativas: 0, status: "pendente", created: agora() });
    },
    async pegarTarefas(n) { const out = tarefas.filter((t) => t.status === "pendente").slice(0, n); out.forEach((t) => (t.status = "rodando")); return out; },
    async terminarTarefa(id, ok) { tarefas.find((t) => t.id === id)!.status = ok ? "feito" : "erro"; },
  };
  return { b, docs, runs, propostas, tarefas, config, kb };
}

type Chamada = Record<string, any>;
/**
 * IA roteirizada: cada resposta é uma função da chamada (vê o system, as tools e
 * o histórico). Guarda tudo que foi enviado para o teste conferir.
 */
export function llmRoteiro(passos: ((c: Chamada) => Partial<RespostaLlm>)[]) {
  const enviados: Chamada[] = [];
  let i = 0;
  const llm: ClienteLlm = {
    async create(p) {
      enviados.push(structuredClone(p));
      const f = passos[Math.min(i++, passos.length - 1)]!;
      const r = f(p);
      return { stop_reason: "end_turn", usage: { input_tokens: 1000, output_tokens: 500 }, content: [], ...r } as RespostaLlm;
    },
  };
  return { llm, enviados };
}
export const usar = (name: string, input: Record<string, any> = {}, id = `tu-${name}-${Math.random().toString(36).slice(2, 6)}`) =>
  ({ stop_reason: "tool_use", content: [{ type: "thinking", thinking: "", signature: "x" }, { type: "tool_use", id, name, input }] }) as Partial<RespostaLlm>;
export const entregar = (input: Record<string, any>) => usar("entregar", input);
