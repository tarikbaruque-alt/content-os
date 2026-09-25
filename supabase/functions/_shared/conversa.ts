import type { Backend } from "./tipos.ts";
import { executar, type Ferramenta, type Uso } from "./executor.ts";
import { AGENTES, AGENTE } from "./agentes.ts";
import { operacaoDe, modoDo } from "./operacao.ts";
import type { ClienteLlm } from "./tipos.ts";

/**
 * Chat do Maestro: a pessoa escreve o que quer ("planeja outubro da Academia",
 * "como está a Clínica?") e o Maestro responde lendo o estado real dos
 * clientes e, quando for o caso, aciona os agentes certos. Ele não escreve
 * conteúdo nem mexe em documento: quem faz o trabalho são os agentes, e o que
 * eles entregam continua passando pela aprovação no painel.
 */
export type Mensagem = { de: "voce" | "maestro"; texto: string };
export type Acao = { cliente: string; agente: string; motivo: string };
export type RespostaConversa = { resposta: string; acoes: Acao[]; uso: Uso };

const LIMITE_ACOES = 6;
const LIMITE_HISTORICO = 12;

const nomeDe = (d: Record<string, any> | null, id: string) => String(d?.name ?? id);

async function resumoDoCliente(b: Backend, ws: string, cli: string) {
  const c = await b.getDoc(ws, `cos_clients/${cli}`);
  if (!c) throw new Error(`Cliente não encontrado: ${cli}. Use listar_clientes para ver os ids.`);
  const [dna, est, edi, ideias, cal] = await Promise.all([
    b.getDoc(ws, `cos_dna/${cli}`),
    b.getDoc(ws, `cos_strategy/${cli}`),
    b.getDoc(ws, `cos_editorial/${cli}`),
    b.listDocs(ws, `cos_ideas/${cli}/items`),
    b.listDocs(ws, `cos_calendar/${cli}/items`),
  ]);
  const itens = cal.map((d) => d.data);
  const porStatus: Record<string, number> = {};
  for (const it of itens) porStatus[it.status ?? "PLANNED"] = (porStatus[it.status ?? "PLANNED"] ?? 0) + 1;
  const datas = itens.map((i) => String(i.data ?? "")).filter(Boolean).sort();
  const op = operacaoDe(c);
  const entradas = (dna?.entries ?? []) as any[];
  return {
    id: cli,
    nome: nomeDe(c, cli),
    nicho: c.niche ?? "",
    briefing: c.briefing ? String(c.briefing).slice(0, 600) : "(sem briefing)",
    dna: { registros: entradas.length, pendentes: entradas.filter((e) => e.status === "pending").length },
    estrategia: est ? "existe" : "não existe",
    linha_editorial: edi ? "existe" : "não existe",
    ideias: ideias.length,
    calendario: { pecas: itens.length, por_status: porStatus, primeira_data: datas[0] ?? null, ultima_data: datas.at(-1) ?? null },
    operacao: {
      dia_de_planejar: op.diaPlanejamento,
      cliente_aprova: op.clienteAprova,
      agentes_em_manual: AGENTES.filter((a) => modoDo(op, a.id) === "manual").map((a) => a.id),
    },
  };
}

function ferramentas(b: Backend, ws: string): Ferramenta[] {
  return [
    {
      nome: "listar_clientes",
      descricao: "Lista os clientes da equipe (id, nome e nicho). Use para achar o id de um cliente citado pelo nome.",
      entrada: { type: "object", properties: {}, additionalProperties: false },
      rodar: async () => (await b.listDocs(ws, "cos_clients")).map((d) => ({ id: d.path.split("/")[1], nome: nomeDe(d.data, d.path.split("/")[1]!), nicho: d.data.niche ?? "" })),
    },
    {
      nome: "ver_cliente",
      descricao: "Mostra o estado real de um cliente: briefing, DNA, se há estratégia e linha editorial, ideias, calendário por status e a operação (dia de planejar, agentes em manual).",
      entrada: { type: "object", properties: { cliente: { type: "string", description: "id do cliente" } }, required: ["cliente"], additionalProperties: false },
      rodar: async (i) => resumoDoCliente(b, ws, String(i.cliente)),
    },
  ];
}

function sistema(): string {
  const lista = AGENTES.map((a) => `- ${a.id} (${a.nome}): ${a.papel}`).join("\n");
  return [
    "Você é o Maestro do Content OS, o coordenador de uma equipe de agentes que planeja e produz conteúdo de Instagram para os clientes de uma agência.",
    "A pessoa da agência conversa com você em português. Seu trabalho é entender o pedido, olhar o estado real do cliente com as ferramentas e decidir quais agentes acionar. Você não escreve conteúdo: quem produz são os agentes, e tudo o que eles entregam passa pela aprovação no painel.",
    "",
    "Os agentes:",
    lista,
    "",
    "A cadeia do planejamento já é automática: Átlas (estratégia) chama Bússola (linha editorial), que chama Musa (ideias), que chama Cronos (datas). Para planejar um mês inteiro, acione só o atlas. Para só preencher datas vazias com ideias, acione a musa. Para escrever as peças da semana, o estudio. Para ler o briefing e atualizar o DNA, a iris. Para pesquisa de pautas e concorrentes, o radar. Para ler resultados, o pulso.",
    "Antes de acionar, confira com ver_cliente se o agente tem o que precisa (por exemplo, sem briefing a Íris não tem o que ler; sem estratégia não faz sentido acionar a Musa). Se faltar insumo, diga o que falta em vez de acionar.",
    "Se o pedido for só uma pergunta, responda com os dados e não acione nada. Se o cliente citado for ambíguo, pergunte qual é.",
    `Acione no máximo ${LIMITE_ACOES} agentes por mensagem.`,
    "",
    "Termine sempre chamando entregar com a resposta para a pessoa e a lista de ações. A resposta é curta, direta e em português do Brasil: diga o que você vai fazer e o que ela vai ver no painel (por exemplo, a proposta de estratégia aparece em Propostas). Não use travessões, setas, emojis nem listas com símbolos decorativos.",
  ].join("\n");
}

const SAIDA = {
  type: "object",
  properties: {
    resposta: { type: "string", description: "o que dizer para a pessoa" },
    acoes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          cliente: { type: "string", description: "id do cliente" },
          agente: { type: "string", enum: AGENTES.map((a) => a.id) },
          motivo: { type: "string", description: "por que este agente, em uma frase" },
        },
        required: ["cliente", "agente", "motivo"],
        additionalProperties: false,
      },
    },
  },
  required: ["resposta", "acoes"],
  additionalProperties: false,
};

function pedidoDe(historico: Mensagem[], mensagem: string, clienteEmFoco: string | null): string {
  const h = historico.slice(-LIMITE_HISTORICO).map((m) => `${m.de === "voce" ? "Pessoa" : "Maestro"}: ${m.texto}`).join("\n");
  return [
    h ? `Conversa até aqui:\n${h}\n` : "",
    clienteEmFoco ? `Cliente aberto no painel agora: ${clienteEmFoco}. Se a pessoa não citar outro, é deste que ela fala.\n` : "",
    `Mensagem nova da pessoa: ${mensagem}`,
  ].join("\n");
}

/** Conversa uma rodada. As ações voltam validadas; quem as executa é a Edge Function. */
export async function conversar(
  p: { b: Backend; llm: ClienteLlm; modelo: string; ws: string; mensagem: string; historico?: Mensagem[]; clienteEmFoco?: string | null },
): Promise<RespostaConversa> {
  const r = await executar({
    llm: p.llm,
    modelo: p.modelo,
    sistema: sistema(),
    pedido: pedidoDe(p.historico ?? [], p.mensagem, p.clienteEmFoco ?? null),
    ferramentas: ferramentas(p.b, p.ws),
    saida: SAIDA,
    maxRodadas: 8,
  });
  if (!r.saida) throw new Error("O Maestro não conseguiu responder agora. Tente de novo.");
  const clientes = new Set((await p.b.listDocs(p.ws, "cos_clients")).map((d) => d.path.split("/")[1]));
  const vistas = new Set<string>();
  const acoes = ((r.saida.acoes ?? []) as Acao[])
    .filter((a) => AGENTE[a.agente] && clientes.has(a.cliente))
    .filter((a) => { const k = `${a.cliente}|${a.agente}`; if (vistas.has(k)) return false; vistas.add(k); return true; })
    .slice(0, LIMITE_ACOES);
  return { resposta: String(r.saida.resposta ?? ""), acoes, uso: r.uso };
}
