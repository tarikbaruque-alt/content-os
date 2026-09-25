import type { Backend, ClienteLlm } from "./tipos.ts";
import { executar } from "./executor.ts";
import { AGENTE, AGENTES, agendaDo, ferramentasDo, patchDaPeca, pecasSemTexto, pedidoDaPeca, SAIDA_PECA, tipoDaPeca, vagasDoPeriodo, type Ctx } from "./agentes.ts";
import { GATILHO_MANUAL, lerOperacao, modoDo, operacaoDe } from "./operacao.ts";
import { montarPeriodo } from "./cronos.ts";

export type Deps = {
  b: Backend;
  llm: ClienteLlm;
  modelo: string;
  /** Teto de gasto dos agentes por workspace no mês (US$). */
  orcamentoMes: number;
  agora?: () => Date;
};

// Brasília é UTC-3 o ano todo (sem horário de verão desde 2019).
const BRT = -3 * 3600e3;

/**
 * Último horário agendado que já passou. Formatos:
 * "diario:H", "semanal:D:H" (D: 0=domingo … 6=sábado), "mensal:DIA:H".
 * null = o agente não tem agenda (só evento ou clique).
 */
export function ultimoHorario(agenda: string | null, agora: Date): Date | null {
  if (!agenda) return null;
  const [tipo, a, b] = agenda.split(":");
  const local = new Date(agora.getTime() + BRT); // relógio de Brasília nos campos UTC
  const em = (y: number, m: number, d: number, h: number) => new Date(Date.UTC(y, m, d, h) - BRT);
  const Y = local.getUTCFullYear(), M = local.getUTCMonth(), D = local.getUTCDate();
  if (tipo === "diario") {
    const h = Number(a);
    const t = em(Y, M, D, h);
    return t <= agora ? t : em(Y, M, D - 1, h);
  }
  if (tipo === "semanal") {
    const dia = Number(a), h = Number(b);
    const volta = (local.getUTCDay() - dia + 7) % 7;
    const t = em(Y, M, D - volta, h);
    return t <= agora ? t : em(Y, M, D - volta - 7, h);
  }
  if (tipo === "mensal") {
    const dia = Number(a), h = Number(b);
    const t = em(Y, M, dia, h);
    return t <= agora ? t : em(Y, M - 1, dia, h);
  }
  return null;
}

export type Relato = { status: "ok" | "erro" | "sem_saida" | "pulado"; motivo?: string; propostas: number; custo_usd: number; run_id?: string };

/** Roda um agente para um cliente, do início ao fim, sempre deixando registro. */
export async function executarAgente(d: Deps, ws: string, cli: string, agenteId: string, gatilho: string): Promise<Relato> {
  const a = AGENTE[agenteId];
  if (!a) throw new Error(`agente desconhecido: ${agenteId}`);
  // A cadeia do planejamento: quem termina chama o próximo (o próximo decide se precisa rodar).
  const seguir = async (r: Relato): Promise<Relato> => {
    if (a.depois) for (const n of await a.depois({ b: d.b, ws, cli, agora: d.agora?.() ?? new Date(), gatilho, op: await lerOperacao(d.b, ws, cli) })) await d.b.enfileirar(ws, cli, n.agente, n.gatilho);
    return r;
  };
  const agora = d.agora?.() ?? new Date();
  const op = await lerOperacao(d.b, ws, cli);
  const c: Ctx = { b: d.b, ws, cli, agora, gatilho, op };
  const run = await d.b.iniciarExecucao(ws, cli, agenteId, gatilho);
  const pular = async (motivo: string): Promise<Relato> => {
    await d.b.terminarExecucao(run, { status: "pulado", erro: motivo });
    return { status: "pulado", motivo, propostas: 0, custo_usd: 0, run_id: run };
  };
  if (gatilho !== GATILHO_MANUAL && modoDo(op, a.id) === "manual") return pular("agente em modo manual para este cliente");
  if (!a.semIA) {
    const gasto = await d.b.gastoDoMes(ws);
    if (gasto >= d.orcamentoMes) return pular(`teto do mês atingido (US$ ${gasto.toFixed(2)} de ${d.orcamentoMes})`);
  }
  const bloqueio = await a.bloqueio(c);
  if (bloqueio) return seguir(await pular(bloqueio));

  let custo = 0, tin = 0, tout = 0, buscas = 0, propostas = 0;
  const passos: unknown[] = [];
  try {
    if (a.id === "cronos") {
      const v = await vagasDoPeriodo(c);
      const m = montarPeriodo(v.livres as any, v.rotina, v.inicio, v.fim);
      for (const it of m.itens) await d.b.setDoc(ws, `cos_calendar/${cli}/items/${it.id}`, it);
      propostas = m.itens.length ? 1 : 0;
      if (m.itens.length) {
        const aprova = op.clienteAprova !== "nada";
        await d.b.criarProposta({
          workspace_id: ws, client_id: cli, agente: "cronos", tipo: "aviso", run_id: run,
          titulo: `Calendário de ${v.inicio.split("-").reverse().join("/")} a ${v.fim.split("-").reverse().join("/")}: ${m.itens.length} peças`,
          resumo: `${m.faltaram ? `${m.faltaram} data(s) ficaram sem ideia. ` : ""}${aprova ? "Mande para o cliente aprovar na vitrine." : "Pronto para o Estúdio escrever."}`,
          payload: { ir: "calendar", inicio: v.inicio, fim: v.fim, n: m.itens.length, faltaram: m.faltaram },
        });
      }
      await d.b.terminarExecucao(run, { status: m.itens.length ? "ok" : "sem_saida", passos: [{ tipo: "aviso", resumo: `${m.itens.length} peças de ${v.inicio} a ${v.fim}` }] });
      return seguir({ status: m.itens.length ? "ok" : "sem_saida", propostas, custo_usd: 0, run_id: run });
    }
    // Estúdio: uma execução do modelo por peça (até 3 por vez), cada uma gravada na hora.
    if (a.id === "estudio") {
      for (const { data: it, path } of (await pecasSemTexto(c)).slice(0, 3)) {
        const tipo = tipoDaPeca(it.idea?.surface);
        let pedido = pedidoDaPeca(it, tipo);
        if (op.pautaQuente === "troca") {
          const pautas = (((await d.b.getDoc(ws, `cos_research/${cli}`)) ?? {}).items ?? []).filter((p: any) => p.url).slice(0, 6);
          if (pautas.length) pedido += "\nPAUTAS QUENTES APROVADAS (use uma como gancho só se casar com o tema e o funil desta peça; cite a fonte na legenda):\n" + pautas.map((p: any) => `- ${p.insight} (${p.origem}, ${p.data}) ${p.url}`).join("\n");
        }
        const r = await executar({ llm: d.llm, modelo: d.modelo, sistema: a.sistema, pedido, ferramentas: ferramentasDo(a, c), saida: SAIDA_PECA[tipo] });
        custo += r.uso.custo_usd; tin += r.uso.tokens_in; tout += r.uso.tokens_out;
        passos.push({ tipo: "peca", nome: it.id, entrada: tipo, resumo: r.saida ? "escrita" : "sem saída" }, ...r.passos);
        if (!r.saida) continue;
        const atual = (await d.b.getDoc(ws, path)) ?? it;
        if (atual.content || atual.carousel || atual.stories) continue; // alguém escreveu enquanto o agente trabalhava
        await d.b.setDoc(ws, path, { ...atual, ...patchDaPeca(atual, tipo, r.saida) });
        propostas++;
      }
      if (propostas) {
        await d.b.criarProposta({ workspace_id: ws, client_id: cli, agente: a.id, tipo: "aviso", titulo: `${propostas} peça(s) escrita(s) para a próxima semana`, resumo: "Estão em Aprovações.", payload: { ir: "approvals", n: propostas }, run_id: run });
      }
    } else {
      const r = await executar({
        llm: d.llm, modelo: d.modelo, sistema: a.sistema, pedido: await a.pedido(c), ferramentas: ferramentasDo(a, c), saida: a.saida,
        buscaWeb: a.buscaWeb ? { maxUsos: a.buscaWeb } : null,
      });
      custo = r.uso.custo_usd; tin = r.uso.tokens_in; tout = r.uso.tokens_out; buscas = r.uso.buscas_web;
      passos.push(...r.passos);
      if (r.saida) {
        const e = await a.destino(r.saida, c);
        for (const p of e.propostas) { await d.b.criarProposta({ ...p, workspace_id: ws, client_id: cli, agente: a.id, run_id: run }); propostas++; }
      }
    }
    const status = propostas || a.id === "iris" ? "ok" : "sem_saida";
    await d.b.terminarExecucao(run, { status, modelo: d.modelo, tokens_in: tin, tokens_out: tout, buscas_web: buscas, custo_usd: custo, passos });
    return seguir({ status, propostas, custo_usd: custo, run_id: run });
  } catch (e) {
    await d.b.terminarExecucao(run, { status: "erro", modelo: d.modelo, tokens_in: tin, tokens_out: tout, custo_usd: custo, passos, erro: (e as Error).message });
    return seguir({ status: "erro", motivo: (e as Error).message, propostas, custo_usd: custo, run_id: run });
  }
}

/**
 * Batida do relógio (pg_cron chama de hora em hora):
 * 1) põe na fila o que a agenda pede e ainda não rodou desde o último horário;
 * 2) consome a fila (eventos + agenda), poucas tarefas por batida para caber
 *    no tempo de uma Edge Function.
 */
export async function batida(d: Deps, limite = 4): Promise<{ enfileiradas: number; rodadas: { agente: string; cliente: string | null; status: string; motivo?: string }[] }> {
  const agora = d.agora?.() ?? new Date();
  let enfileiradas = 0;
  for (const ws of await d.b.workspaces()) {
    const cfg = await d.b.configAgentes(ws);
    for (const doc of await d.b.listDocs(ws, "cos_clients")) {
      const cli = doc.path.split("/")[1]!;
      const op = operacaoDe(doc.data);
      for (const a of AGENTES) {
        const conf = cfg[a.id];
        if ((conf && !conf.ativo) || modoDo(op, a.id) === "manual") continue;
        const ag = agendaDo(a, op);
        const h = ag && ultimoHorario(conf?.agenda && a.id !== "pulso" ? conf.agenda : ag.agenda, agora);
        if (!ag || !h) continue;
        const ultima = await d.b.ultimaVez(ws, cli, a.id, ag.gatilho);
        if (!ultima || ultima < h) { await d.b.enfileirar(ws, cli, a.id, ag.gatilho); enfileiradas++; }
      }
    }
  }
  const rodadas: { agente: string; cliente: string | null; status: string; motivo?: string }[] = [];
  for (const t of await d.b.pegarTarefas(limite)) {
    const cfg = await d.b.configAgentes(t.workspace_id);
    if (cfg[t.agente] && !cfg[t.agente]!.ativo) { await d.b.terminarTarefa(t.id, true); continue; }
    const r = t.client_id ? await executarAgente(d, t.workspace_id, t.client_id, t.agente, t.gatilho) : { status: "pulado", motivo: "tarefa sem cliente" } as const;
    await d.b.terminarTarefa(t.id, r.status !== "erro");
    rodadas.push({ agente: t.agente, cliente: t.client_id, status: r.status, motivo: "motivo" in r ? r.motivo : undefined });
  }
  return { enfileiradas, rodadas };
}
