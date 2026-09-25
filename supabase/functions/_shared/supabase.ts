import type { Backend, Doc, Execucao, Proposta, Tarefa, TrechoKB } from "./tipos.ts";

/**
 * Backend real: fala com o Postgres do Supabase pela API REST (PostgREST) com a
 * chave de serviço. Só roda no servidor (Edge Function ou script local); a
 * chave de serviço nunca vai para o navegador.
 */
export function backendSupabase(url: string, chaveServico: string, f: typeof fetch = fetch): Backend & {
  inserirKB(ws: string | null, trechos: { fonte: string; titulo: string; secao: string | null; texto: string; agentes: string[] }[]): Promise<void>;
  apagarKB(ws: string | null, fonte: string): Promise<void>;
  rest(caminho: string, init?: RequestInit): Promise<any>;
} {
  const base = url.replace(/\/$/, "") + "/rest/v1";
  const h: Record<string, string> = { apikey: chaveServico, "Content-Type": "application/json" };
  // Chave legada (JWT) vai também no Authorization; a nova (sb_secret_…) só no apikey.
  if (chaveServico.startsWith("eyJ")) h.Authorization = `Bearer ${chaveServico}`;
  const q = (v: string) => encodeURIComponent(v);

  async function rest(caminho: string, init: RequestInit = {}): Promise<any> {
    const r = await f(base + caminho, { ...init, headers: { ...h, ...(init.headers as Record<string, string> | undefined) } });
    const txt = await r.text();
    if (!r.ok) throw new Error(`Supabase ${r.status} em ${caminho.split("?")[0]}: ${txt.slice(0, 300)}`);
    return txt ? JSON.parse(txt) : null;
  }
  const rpc = (nome: string, args: Record<string, unknown>) => rest(`/rpc/${nome}`, { method: "POST", body: JSON.stringify(args) });

  return {
    rest,
    async getDoc(ws, path) {
      const r = await rest(`/docs?select=data&workspace_id=eq.${q(ws)}&path=eq.${q(path)}`);
      return r?.[0]?.data ?? null;
    },
    async quando(ws, path) {
      const r = await rest(`/docs?select=updated_at&workspace_id=eq.${q(ws)}&path=eq.${q(path)}`);
      return r?.[0]?.updated_at ?? null;
    },
    async setDoc(ws, path, data) {
      await rest(`/docs?on_conflict=workspace_id,path`, {
        method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ workspace_id: ws, path, data, updated_by: null }),
      });
    },
    async listDocs(ws, parent): Promise<Doc[]> {
      return (await rest(`/docs?select=path,data,updated_at&workspace_id=eq.${q(ws)}&parent=eq.${q(parent)}&order=path`)) ?? [];
    },
    async buscarKB(ws, consulta, agente, limite): Promise<TrechoKB[]> {
      return (await rpc("kb_buscar", { ws, consulta, agente, limite })) ?? [];
    },
    async iniciarExecucao(ws, cliente, agente, gatilho) {
      const r = await rest(`/agent_runs?select=id`, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ workspace_id: ws, client_id: cliente, agente, gatilho }) });
      return r[0].id as string;
    },
    async terminarExecucao(id, e: Execucao) {
      await rest(`/agent_runs?id=eq.${q(id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ ...e, finished_at: new Date().toISOString() }) });
    },
    async criarProposta(p: Proposta) {
      const r = await rest(`/proposals?select=id`, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ ...p, fontes: p.fontes ?? [] }) });
      return r[0].id as string;
    },
    async gastoDoMes(ws) { return Number(await rpc("gasto_do_mes", { ws })) || 0; },
    async ultimaVez(ws, cliente, agente, gatilho) {
      const r = await rpc("ultima_vez", { ws, cli: cliente, ag: agente, gat: gatilho ?? null });
      return r ? new Date(r) : null;
    },
    async workspaces() { return ((await rest(`/workspaces?select=id`)) ?? []).map((w: any) => w.id); },
    async configAgentes(ws) {
      const r = (await rest(`/agent_settings?select=agente,ativo,agenda&workspace_id=eq.${q(ws)}`)) ?? [];
      return Object.fromEntries(r.map((x: any) => [x.agente, { ativo: x.ativo, agenda: x.agenda }]));
    },
    async enfileirar(ws, cliente, agente, gatilho) {
      await rpc("enfileirar", { ws, cli: cliente, ag: agente, gat: gatilho, atraso: "0 seconds" });
    },
    async pegarTarefas(n): Promise<Tarefa[]> { return (await rpc("pegar_tarefas", { n })) ?? []; },
    async terminarTarefa(id, ok) {
      await rest(`/agent_tasks?id=eq.${q(id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: ok ? "feito" : "erro", finished_at: new Date().toISOString() }) });
    },
    async inserirKB(ws, trechos) {
      if (!trechos.length) return;
      await rest(`/knowledge_chunks`, { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(trechos.map((t) => ({ ...t, workspace_id: ws }))) });
    },
    async apagarKB(ws, fonte) {
      await rest(`/knowledge_chunks?fonte=eq.${q(fonte)}&workspace_id=${ws ? "eq." + q(ws) : "is.null"}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    },
  };
}
