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
  /** Quando cada coisa roda sozinha, no horário de Brasília. */
  horarios: Horarios;
  /** Pausado: nenhum agente roda sozinho para este cliente (o que já foi aprovado continua). */
  pausado: boolean;
};
export type Horarios = {
  /** Hora do planejamento mensal (Pulso lê o mês e abre a cadeia), no dia de planejar. */
  planHora: number;
  /** Dia da semana da pesquisa (0 = domingo) e a hora. */
  radarDia: number;
  radarHora: number;
  /** Hora em que o Estúdio escreve, e quantos dias à frente ele olha. */
  estHora: number;
  estDias: number;
};
export const HORARIOS_PADRAO: Horarios = { planHora: 7, radarDia: 1, radarHora: 7, estHora: 6, estDias: 7 };

export const OPERACAO_PADRAO: Operacao = {
  diaPlanejamento: 20,
  clienteAprova: "calendario_e_pecas",
  prazoCliente: 2,
  semRespostaPublica: false,
  pautaQuente: "sugestao",
  agentes: {},
  horarios: HORARIOS_PADRAO,
  pausado: false,
};
const faixa = (v: unknown, min: number, max: number, padrao: number) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : padrao; };

export function operacaoDe(cliente: Record<string, any> | null): Operacao {
  const o = { ...OPERACAO_PADRAO, ...((cliente?.operacao as Partial<Operacao>) ?? {}) };
  o.diaPlanejamento = Math.min(28, Math.max(1, Math.round(Number(o.diaPlanejamento) || 20)));
  o.agentes = { ...(o.agentes ?? {}) };
  const h = { ...HORARIOS_PADRAO, ...((cliente?.operacao?.horarios as Partial<Horarios>) ?? {}) };
  o.horarios = {
    planHora: faixa(h.planHora, 0, 23, HORARIOS_PADRAO.planHora),
    radarDia: faixa(h.radarDia, 0, 6, HORARIOS_PADRAO.radarDia),
    radarHora: faixa(h.radarHora, 0, 23, HORARIOS_PADRAO.radarHora),
    estHora: faixa(h.estHora, 0, 23, HORARIOS_PADRAO.estHora),
    estDias: faixa(h.estDias, 1, 21, HORARIOS_PADRAO.estDias),
  };
  o.pausado = o.pausado === true;
  return o;
}

export async function lerOperacao(b: Backend, ws: string, cli: string): Promise<Operacao> {
  return operacaoDe(await b.getDoc(ws, `cos_clients/${cli}`));
}

export const modoDo = (op: Operacao, agente: string): Modo => (op.agentes[agente] === "manual" ? "manual" : "auto");

/** Gatilho de quem clicou "Rodar agora": passa mesmo com o agente em modo manual. */
export const GATILHO_MANUAL = "rodado no painel";
