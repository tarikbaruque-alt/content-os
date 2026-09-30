import { findBannedPhrases, findUnsupportedNumbers, discountPolicy, extractNumericClaims } from "../commercial/guardrails.js";
import { proofUsability } from "../commercial/guardrails.js";
import type { Operacao, ProofItem } from "./types.js";

export { findBannedPhrases, findUnsupportedNumbers, discountPolicy, proofUsability, extractNumericClaims };

/** Vender "N posts por mês" em vez de valor. */
export const DELIVERABLE_COUNT = /\b\d+\s*(posts?|reels|artes?|stories|carross[eé]is|v[ií]deos|publica[cç][oõ]es|postagens)\b|\bpor m[eê]s\b.*\b\d+\b|\b\d+\b.*\bpor m[eê]s\b/i;

/** Promessas que não podemos sustentar. */
export const PROMISES: { re: RegExp; motivo: string }[] = [
  { re: /\bgarant(o|imos|ia|ido)\b.{0,25}\b(resultado|retorno|vendas?|clientes?|seguidores?|crescimento)/i, motivo: "garantia de resultado" },
  { re: /\b(dobrar|triplicar|multiplicar|explodir)\b.{0,25}\b(vendas?|faturamento|seguidores|alcance|engajamento)/i, motivo: "promessa de resultado sem prova" },
  { re: /\bviral\b|\bbombar\b|\bexplodir\b/i, motivo: "promessa de viralização" },
];

/** Na 1ª mensagem NÃO se vende gestão de redes sociais: gera-se conversa. */
export const FIRST_MESSAGE_FORBIDDEN: { re: RegExp; motivo: string }[] = [
  { re: /\bgest[aã]o de (redes|instagram|m[ií]dias?|conte[uú]do)\b/i, motivo: "oferece gestão na 1ª mensagem" },
  { re: /\bsocial media\b/i, motivo: "oferece serviço na 1ª mensagem" },
  { re: /\b(ag[eê]ncia|nossa empresa|nossos servi[cç]os|meus servi[cç]os)\b/i, motivo: "fala de nós antes de falar do lead" },
  { re: /\b(pacote|plano mensal|or[cç]amento|proposta|contrat(e|ar|o))\b/i, motivo: "linguagem de venda" },
  { re: /\b(valor mensal|pre[cç]o|investimento de)\b/i, motivo: "fala de preço" },
];

export function allowedNumberSources(op: Operacao, extra: string[] = []): string[] {
  const s = [...extra];
  for (const c of Object.values(op.catalogo)) {
    if (c?.ticketMin != null) s.push(`R$ ${c.ticketMin}`);
    if (c?.ticketMax != null) s.push(`R$ ${c.ticketMax}`);
  }
  for (const p of [...op.provas, ...op.diferenciais]) if (p.verificado) s.push(p.titulo, p.descricao, p.resultadoDocumentado ?? "");
  const r = op.regras;
  if (r.descontoMaximoPct != null) s.push(`${r.descontoMaximoPct}%`);
  if (r.parcelamentoMaxParcelas != null) s.push(`${r.parcelamentoMaxParcelas}x`);
  if (r.margemMinimaPct != null) s.push(`${r.margemMinimaPct}%`);
  return s;
}

/** Valida um texto que vai sair para o prospect. Retorna violações (vazio = ok). */
export function validateOutbound(text: string, op: Operacao, opts: { primeiraMensagem?: boolean; extraAllowed?: string[] } = {}): string[] {
  const v: string[] = [];
  for (const b of findBannedPhrases(text)) v.push(`Frase proibida "${b.trecho}" (${b.motivo})`);
  const dc = text.match(DELIVERABLE_COUNT);
  if (dc) v.push(`Vende quantidade em vez de valor: "${dc[0]}"`);
  for (const p of PROMISES) { const m = text.match(p.re); if (m) v.push(`Promessa não sustentável "${m[0]}" (${p.motivo})`); }
  if (opts.primeiraMensagem) for (const f of FIRST_MESSAGE_FORBIDDEN) { const m = text.match(f.re); if (m) v.push(`1ª mensagem não deve vender: "${m[0]}" (${f.motivo})`); }
  for (const n of findUnsupportedNumbers(text, allowedNumberSources(op, opts.extraAllowed))) v.push(`Número sem fonte: "${n}"`);
  return v;
}

export function usableProofs(list: ProofItem[]): ProofItem[] {
  return list.filter((p) => proofUsability(p).usavel);
}
