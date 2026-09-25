import type { Backend } from "./tipos.ts";

/**
 * Como a operação funciona para cada cliente. Fica na ficha do cliente
 * (cos_clients/<id>.operacao) e o painel edita. Tudo tem padrão: cliente sem
 * configuração roda com os valores abaixo.
 */
export type Modo = "auto" | "manual";
export type Operacao = {
  /** Dia do mês em que começa o planejamento do mês seguinte (1 a 28). */
  diaPlanejamento: number;
  /** O que o cliente aprova na vitrine. */
  clienteAprova: "calendario_e_pecas" | "calendario" | "nada";
  /** Dias que o cliente tem para responder sobre uma peça. */
  prazoCliente: number;
  /** Passou do prazo sem resposta: publica como está (true) ou espera (false). */
  semRespostaPublica: boolean;
  /** Pauta quente do Radar: pode virar gancho de peça ainda não aprovada, ou só sugestão para o próximo mês. */
  pautaQuente: "troca" | "sugestao";
  /** Automático: roda pela agenda e pela cadeia. Manual: só quando alguém clica "Rodar agora". */
  agentes: Record<string, Modo>;
};

export const OPERACAO_PADRAO: Operacao = {
  diaPlanejamento: 20,
  clienteAprova: "calendario_e_pecas",
  prazoCliente: 2,
  semRespostaPublica: false,
  pautaQuente: "sugestao",
  agentes: {},
};

export function operacaoDe(cliente: Record<string, any> | null): Operacao {
  const o = { ...OPERACAO_PADRAO, ...((cliente?.operacao as Partial<Operacao>) ?? {}) };
  o.diaPlanejamento = Math.min(28, Math.max(1, Math.round(Number(o.diaPlanejamento) || 20)));
  o.agentes = { ...(o.agentes ?? {}) };
  return o;
}

export async function lerOperacao(b: Backend, ws: string, cli: string): Promise<Operacao> {
  return operacaoDe(await b.getDoc(ws, `cos_clients/${cli}`));
}

export const modoDo = (op: Operacao, agente: string): Modo => (op.agentes[agente] === "manual" ? "manual" : "auto");

/** Gatilho de quem clicou "Rodar agora": passa mesmo com o agente em modo manual. */
export const GATILHO_MANUAL = "rodado no painel";
