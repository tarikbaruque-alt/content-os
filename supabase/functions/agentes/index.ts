// Edge Function "agentes": a porta do servidor do Content OS.
//
// Pedidos do painel (com o login do usuário):
//   {op:"ia", ws, input}                 IA dos botões "Gerar" do painel, pela chave do projeto
//   {op:"rodar", ws, cliente, agente}    roda um agente agora (em segundo plano)
//   {op:"decidir", ws, id, aprovar}      marca a proposta como aplicada/rejeitada
//   {op:"acervo", ws, nome, texto|pdf}   Acervo: material novo vira Knowledge Base
//   {op:"estado", ws}                    chave configurada? gasto do mês? teto?
//   {op:"conversar", ws, mensagem, historico, cliente}  chat do Maestro: responde e aciona agentes
// Agenda (pg_cron, com x-cron-secret):
//   {op:"batida"}                        Maestro: enfileira pela agenda e consome a fila
//
// Toda a lógica mora em ../_shared (testada em Node com IA e banco simulados).
import Anthropic from "npm:@anthropic-ai/sdk@0.128.0";
import { backendSupabase } from "../_shared/supabase.ts";
import { batida, executarAgente, type Deps } from "../_shared/maestro.ts";
import { AGENTE } from "../_shared/agentes.ts";
import { custoUsd } from "../_shared/executor.ts";
import { trechosDoMarkdown } from "../_shared/kb.ts";
import { conversar } from "../_shared/conversa.ts";
import type { ClienteLlm } from "../_shared/tipos.ts";

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };

const URL_SB = Deno.env.get("SUPABASE_URL")!;
const SERVICO = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const CHAVE = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const MODELO = Deno.env.get("AGENT_MODEL") || "claude-opus-5";
const ORCAMENTO = Number(Deno.env.get("AGENT_ORCAMENTO_USD_MES") || "50");
const CRON = Deno.env.get("CRON_SECRET") ?? "";

const b = backendSupabase(URL_SB, SERVICO);
// Chave criada fora de um workspace da Anthropic exige o ID do workspace em toda chamada.
const WORKSPACE_ANTHROPIC = Deno.env.get("ANTHROPIC_WORKSPACE_ID") ?? "";
const anthropic = CHAVE
  ? new Anthropic({ apiKey: CHAVE, maxRetries: 3, defaultHeaders: WORKSPACE_ANTHROPIC ? { "anthropic-workspace-id": WORKSPACE_ANTHROPIC } : undefined })
  : null;
const llm: ClienteLlm = { create: (p) => anthropic!.messages.create(p as any) as any };
const deps: Deps = { b, llm, modelo: MODELO, orcamentoMes: ORCAMENTO };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (dados: unknown, status = 200) => new Response(JSON.stringify(dados), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const erro = (codigo: string, mensagem: string, status = 400) => json({ error: { code: codigo, message: mensagem } }, status);

/** Quem está chamando, e se é membro do workspace pedido. */
async function membro(req: Request, ws: string): Promise<string | null> {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token || !ws) return null;
  const r = await fetch(`${URL_SB}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: ANON } });
  if (!r.ok) return null;
  const uid = (await r.json()).id as string;
  const m = await b.rest(`/membros?select=user_id&workspace_id=eq.${encodeURIComponent(ws)}&user_id=eq.${encodeURIComponent(uid)}`);
  return m?.length ? uid : null;
}

async function iaDoPainel(ws: string, input: unknown): Promise<Response> {
  if (!anthropic) return erro("sem_chave", "A chave da Anthropic ainda não foi configurada no servidor.", 503);
  const gasto = await b.gastoDoMes(ws);
  if (gasto >= ORCAMENTO) return erro("rate_limited", `Teto do mês atingido (US$ ${gasto.toFixed(2)} de ${ORCAMENTO}).`, 429);
  const messages = typeof input === "string" ? [{ role: "user", content: input }] : (input as any[]);
  const run = await b.iniciarExecucao(ws, null, "painel", "botão no painel");
  try {
    const r = await anthropic.messages.create({ model: MODELO, max_tokens: 16000, thinking: { type: "adaptive" }, messages } as any) as any;
    const texto = (r.content as any[]).filter((c) => c.type === "text").map((c) => c.text).join("");
    const custo = custoUsd(MODELO, r.usage.input_tokens, r.usage.output_tokens);
    await b.terminarExecucao(run, { status: "ok", modelo: MODELO, tokens_in: r.usage.input_tokens, tokens_out: r.usage.output_tokens, custo_usd: custo });
    if (r.stop_reason === "refusal") return erro("refused", "A IA não conseguiu responder a isso.");
    return json({ text: texto, truncated: r.stop_reason === "max_tokens" });
  } catch (e) {
    await b.terminarExecucao(run, { status: "erro", erro: (e as Error).message });
    const st = (e as any)?.status;
    return erro(st === 429 ? "rate_limited" : "erro", (e as Error).message, st === 429 ? 429 : 502);
  }
}

/** Acervo: texto/markdown entra fatiado; PDF passa pelo Claude, que extrai o método (não copia). */
async function acervo(ws: string, nome: string, texto?: string, pdfBase64?: string): Promise<Response> {
  const fonte = `upload/${nome.replace(/[^\w.\- ]+/g, "").slice(0, 80) || "material"}`;
  let md = texto ?? "";
  if (pdfBase64) {
    if (!anthropic) return erro("sem_chave", "A chave da Anthropic ainda não foi configurada no servidor.", 503);
    const run = await b.iniciarExecucao(ws, null, "acervo", `upload: ${nome}`);
    try {
      const r = await anthropic.messages.create({
        model: MODELO, max_tokens: 16000, thinking: { type: "adaptive" },
        messages: [{ role: "user", content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } },
          { type: "text", text: "Você é Acervo, o curador da Knowledge Base do Content OS (estratégia de conteúdo para Instagram). Extraia deste material o MÉTODO: princípios, frameworks, processos, critérios e erros comuns, reescritos com suas palavras (não copie trechos longos) e aplicados a conteúdo no Instagram. Responda em markdown, uma seção '## ' por ideia, com um título claro. Diga no fim de cada seção de que parte do material ela veio." },
        ] }],
      } as any) as any;
      md = (r.content as any[]).filter((c) => c.type === "text").map((c) => c.text).join("");
      await b.terminarExecucao(run, { status: "ok", modelo: MODELO, tokens_in: r.usage.input_tokens, tokens_out: r.usage.output_tokens, custo_usd: custoUsd(MODELO, r.usage.input_tokens, r.usage.output_tokens) });
    } catch (e) {
      await b.terminarExecucao(run, { status: "erro", erro: (e as Error).message });
      return erro("erro", (e as Error).message, 502);
    }
  }
  const trechos = trechosDoMarkdown(fonte, md.startsWith("#") ? md : `# ${nome}\n\n${md}`);
  if (!trechos.length) return erro("vazio", "Não achei conteúdo aproveitável nesse material.");
  await b.apagarKB(ws, fonte);
  await b.inserirKB(ws, trechos);
  return json({ ok: true, fonte, trechos: trechos.length });
}

/** Chat do Maestro: responde, e os agentes que ele acionou rodam em segundo plano, um depois do outro. */
async function conversa(ws: string, body: any): Promise<Response> {
  if (!anthropic) return erro("sem_chave", "A chave da Anthropic ainda não foi configurada no servidor.", 503);
  const mensagem = String(body.mensagem ?? "").trim().slice(0, 4000);
  if (!mensagem) return erro("vazio", "Escreva uma mensagem.");
  const gasto = await b.gastoDoMes(ws);
  if (gasto >= ORCAMENTO) return erro("rate_limited", `Teto do mês atingido (US$ ${gasto.toFixed(2)} de ${ORCAMENTO}).`, 429);
  const run = await b.iniciarExecucao(ws, body.cliente || null, "maestro", "chat do Maestro");
  try {
    const historico = Array.isArray(body.historico) ? body.historico.filter((m: any) => m && (m.de === "voce" || m.de === "maestro")).map((m: any) => ({ de: m.de, texto: String(m.texto ?? "").slice(0, 2000) })) : [];
    const r = await conversar({ b, llm, modelo: MODELO, ws, mensagem, historico, clienteEmFoco: body.cliente ? String(body.cliente) : null });
    await b.terminarExecucao(run, { status: "ok", modelo: MODELO, tokens_in: r.uso.tokens_in, tokens_out: r.uso.tokens_out, custo_usd: r.uso.custo_usd });
    if (r.acoes.length) {
      EdgeRuntime.waitUntil((async () => {
        for (const a of r.acoes) await executarAgente(deps, ws, a.cliente, a.agente, "pedido no chat do Maestro").catch((e) => console.error(e));
      })());
    }
    return json({ resposta: r.resposta, acoes: r.acoes, custo_usd: r.uso.custo_usd });
  } catch (e) {
    await b.terminarExecucao(run, { status: "erro", erro: (e as Error).message });
    const st = (e as any)?.status;
    return erro(st === 429 ? "rate_limited" : "erro", (e as Error).message, st === 429 ? 429 : 502);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return erro("metodo", "Use POST.", 405);
  let body: any;
  try { body = await req.json(); } catch { return erro("json", "Corpo inválido."); }

  if (body.op === "batida") {
    if (!CRON || req.headers.get("x-cron-secret") !== CRON) return erro("proibido", "Segredo da agenda inválido.", 401);
    if (!anthropic) return json({ ok: true, aviso: "sem chave da Anthropic: agentes não rodam" });
    EdgeRuntime.waitUntil(batida(deps).then((r) => console.log(JSON.stringify(r)), (e) => console.error(e)));
    return json({ ok: true });
  }

  const ws = String(body.ws ?? "");
  const uid = await membro(req, ws);
  if (!uid) return erro("not_granted", "Entre no painel com uma conta da equipe.", 401);

  switch (body.op) {
    case "estado":
      return json({ chave: !!anthropic, modelo: MODELO, orcamento: ORCAMENTO, gasto: await b.gastoDoMes(ws) });
    case "ia":
      return iaDoPainel(ws, body.input);
    case "rodar": {
      if (!AGENTE[body.agente]) return erro("agente", "Agente desconhecido.");
      if (!anthropic) return erro("sem_chave", "A chave da Anthropic ainda não foi configurada no servidor.", 503);
      const cli = String(body.cliente ?? "");
      if (!(await b.getDoc(ws, `cos_clients/${cli}`))) return erro("cliente", "Cliente não encontrado.");
      EdgeRuntime.waitUntil(executarAgente(deps, ws, cli, body.agente, "rodado no painel").catch((e) => console.error(e)));
      return json({ ok: true });
    }
    case "decidir": {
      const st = body.aprovar ? "aplicada" : "rejeitada";
      const r = await b.rest(`/proposals?id=eq.${encodeURIComponent(body.id)}&workspace_id=eq.${encodeURIComponent(ws)}&status=eq.pendente&select=id`, {
        method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ status: st, decided_at: new Date().toISOString(), decided_by: uid }),
      });
      return r?.length ? json({ ok: true, status: st }) : erro("proposta", "Proposta não encontrada ou já decidida.", 404);
    }
    case "acervo":
      return acervo(ws, String(body.nome ?? "material"), body.texto, body.pdf);
    case "conversar":
      return conversa(ws, body);
    default:
      return erro("op", "Operação desconhecida.");
  }
});
