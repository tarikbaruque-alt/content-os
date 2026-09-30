import type { CommercialContext, CommercialRules, Claim, ProofItem } from "./types.js";

/**
 * Guardrails comerciais. Regras inegociáveis:
 *  1. Nunca inventar cases, números, clientes, resultados ou provas sociais.
 *  2. Nunca tratar hipótese como fato.
 *  3. Nunca sugerir desconto sem regra comercial cadastrada.
 *  4. Primeira abordagem nunca usa aberturas genéricas.
 */

/** Aberturas/fórmulas genéricas proibidas na primeira abordagem. */
export const BANNED_PHRASES: { re: RegExp; motivo: string }[] = [
  { re: /\bvi seu perfil e gostei/i, motivo: "abertura genérica de elogio" },
  { re: /\bgostei muito (do|de)\b/i, motivo: "elogio genérico sem contexto" },
  { re: /\bproposta incr[ií]vel/i, motivo: "promessa vazia" },
  { re: /\bposso te ajudar a crescer/i, motivo: "oferta genérica, sem contexto" },
  { re: /\b(somos|sou) (uma )?ag[eê]ncia\b/i, motivo: "fala de nós antes de falar do lead" },
  { re: /\boportunidade [uú]nica\b/i, motivo: "urgência artificial" },
  { re: /\b[uú]ltimas vagas\b|\bs[oó] hoje\b|\bpromo[cç][aã]o rel[aâ]mpago\b/i, motivo: "escassez artificial" },
  { re: /\bgaranto (que )?(voc[eê]|vai|resultado)/i, motivo: "garantia de resultado" },
  { re: /\b(dobrar|triplicar|multiplicar) (suas |o seu |seu )?(vendas|faturamento|seguidores)\b/i, motivo: "promessa de resultado não comprovada" },
];

export function findBannedPhrases(text: string): { trecho: string; motivo: string }[] {
  return BANNED_PHRASES.flatMap(({ re, motivo }) => {
    const m = text.match(re);
    return m ? [{ trecho: m[0], motivo }] : [];
  });
}

/** Extrai afirmações numéricas (R$, %, "N clientes/anos/cases…"), sem pontuação final. */
export function extractNumericClaims(text: string): string[] {
  const out = new Set<string>();
  const patterns = [
    /R\$\s?\d[\d.,]*/gi,
    /\d+(?:[.,]\d+)?\s?%/g,
    /\b\d+\s?(?:x|vezes)\b/gi,
    /\b\d[\d.]*\+?\s+(?:clientes?|cases?|projetos?|anos?|empresas?|marcas?|seguidores?|leads?|vendas?|contratos?)\b/gi,
  ];
  for (const p of patterns) {
    for (const m of text.matchAll(p)) out.add(m[0].toLowerCase().replace(/\s+/g, " ").replace(/[.,]+$/, "").trim());
  }
  return [...out];
}

/** Forma canônica para comparar: "R$ 1.800" == "R$ 1800" == "r$1.800,00". */
function canonNumber(claim: string): string {
  const c = claim.toLowerCase().replace(/\s+/g, "");
  const money = c.startsWith("r$");
  const digits = c.replace(/r\$/, "");
  const m = digits.match(/^[\d.,]+/);
  if (!m) return c;
  let n = m[0].replace(/[.,]+$/, "");
  n = /,\d{1,2}$/.test(n) ? n.replace(/\./g, "").replace(",", ".") : n.replace(/[.,](?=\d{3}\b)/g, "").replace(",", ".");
  const value = String(Number(n));
  return `${money ? "r$" : ""}${value}${digits.slice(m[0].length)}`;
}

/**
 * Anti-invenção numérica: todo número afirmado no texto gerado precisa existir
 * nas fontes permitidas (dados do lead, catálogo, provas verificadas, regras).
 */
export function findUnsupportedNumbers(text: string, allowedSources: string[]): string[] {
  const allowed = new Set(extractNumericClaims(allowedSources.join("\n")).map(canonNumber));
  return extractNumericClaims(text).filter((n) => !allowed.has(canonNumber(n)));
}

/** Fontes de números permitidos para um contexto comercial + lead. */
export function allowedNumberSources(ctx: CommercialContext, extra: string[] = []): string[] {
  const s: string[] = [...extra];
  for (const sv of ctx.servicos) {
    if (sv.ticketMin != null) s.push(`R$ ${sv.ticketMin}`);
    if (sv.ticketMax != null) s.push(`R$ ${sv.ticketMax}`);
  }
  for (const p of ctx.provas) {
    if (p.verificado) s.push(p.titulo, p.descricao, p.resultadoDocumentado ?? "");
  }
  const r = ctx.regras;
  if (r.descontoMaximoPct != null) s.push(`${r.descontoMaximoPct}%`);
  if (r.parcelamentoMaxParcelas != null) s.push(`${r.parcelamentoMaxParcelas}x`);
  return s;
}

/** Desconto só existe se houver regra cadastrada. */
export function discountPolicy(rules: CommercialRules): {
  permitido: boolean;
  ate?: number;
  condicoes?: string[];
  motivo?: string;
} {
  if (rules.descontoMaximoPct == null || rules.descontoMaximoPct <= 0) {
    return { permitido: false, motivo: "não há regra comercial de desconto cadastrada" };
  }
  return {
    permitido: true,
    ate: rules.descontoMaximoPct,
    ...(rules.descontoCondicoes?.length ? { condicoes: rules.descontoCondicoes } : {}),
  };
}

/** Prova só serve como autoridade se verificada — e, com ganho/número, se documentada. */
export function proofUsability(p: ProofItem): { usavel: boolean; motivo?: string } {
  if (!p.verificado) return { usavel: false, motivo: "não verificada por um humano" };
  if (!p.fonte.trim()) return { usavel: false, motivo: "sem fonte/documentação" };
  const claimsResult = p.tipo === "resultado" || p.tipo === "case" || p.tipo === "depoimento";
  if (claimsResult && !p.resultadoDocumentado?.trim()) {
    return { usavel: false, motivo: "cita resultado sem 'resultadoDocumentado' cadastrado" };
  }
  return { usavel: true };
}

/** OBSERVADO/CONFIRMADO exigem evidência; sem ela, rebaixa para HIPOTESE (nunca promove). */
export function enforceClaimEvidence(c: Claim): Claim {
  if ((c.certeza === "OBSERVADO" || c.certeza === "CONFIRMADO") && !c.evidencia?.trim()) {
    return { ...c, certeza: "HIPOTESE" };
  }
  return c;
}

/** Validação de saída: retorna violações (vazio = ok). */
export function validateOutboundText(
  text: string,
  ctx: CommercialContext,
  extraAllowed: string[] = [],
): string[] {
  const v: string[] = [];
  for (const b of findBannedPhrases(text)) v.push(`Frase proibida "${b.trecho}" (${b.motivo})`);
  for (const n of findUnsupportedNumbers(text, allowedNumberSources(ctx, extraAllowed))) {
    v.push(`Número sem fonte: "${n}"`);
  }
  return v;
}
