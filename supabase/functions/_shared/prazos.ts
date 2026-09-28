/**
 * Prazos de cada peça do calendário, contados de trás para frente a partir da
 * publicação:
 *   produção  o último dia de gravação da rotina ANTES da publicação (o lote da semana)
 *   aprovação o dia antes da produção, quando o cliente aprova cada peça
 *   texto     o roteiro pronto a tempo do cliente responder no prazo dele
 * O Estúdio escreve pelo prazo do texto. Antes olhava a data de publicação e
 * podia escrever o roteiro às 6h do próprio dia da gravação, sem aprovação.
 * A mesma regra está no painel (apps/web/src/34-calendario-e-rotina.js, prazosDe).
 */
export const precisaGravar = (s?: string): boolean => ["Reel", "Vídeo", "Stories", "Live"].includes(s ?? "Reel");
const dia = (iso: string) => new Date(iso + "T12:00:00Z");
const fmt = (d: Date) => d.toISOString().slice(0, 10);
export const somarDias = (iso: string, n: number): string => { const d = dia(iso); d.setUTCDate(d.getUTCDate() + n); return fmt(d); };

/** Último dia de gravação/produção antes da publicação. */
export function diaDeProducao(pub: string, gravDia: number): string {
  const d = dia(pub);
  d.setUTCDate(d.getUTCDate() - 1);
  for (let k = 0; k < 7 && d.getUTCDay() !== gravDia; k++) d.setUTCDate(d.getUTCDate() - 1);
  return fmt(d);
}

export type Prazos = { texto: string; aprovacao: string | null; producao: string; publicacao: string };
export function prazosDaPeca(pub: string, rotina: { gravDia?: unknown } | null | undefined, op: { clienteAprova?: string; prazoCliente?: number }): Prazos {
  const g = Number(rotina?.gravDia);
  const producao = diaDeProducao(pub, Number.isInteger(g) && g >= 0 && g <= 6 ? g : 1);
  const clienteVe = (op.clienteAprova ?? "calendario_e_pecas") === "calendario_e_pecas";
  const aprovacao = clienteVe ? somarDias(producao, -1) : null;
  const texto = aprovacao ? somarDias(aprovacao, -Math.max(1, Math.round(op.prazoCliente ?? 2))) : somarDias(producao, -1);
  return { texto, aprovacao, producao, publicacao: pub };
}
