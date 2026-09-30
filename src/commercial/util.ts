import type { Lead, LeadSignal, SignalRating, SignalArea, ServiceOffer, ServiceCategory, CommercialContext } from "./types.js";
import { NEED_AREAS } from "./knowledge.js";

export const lc = (s: string): string => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
export const cap = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
export const ensureEnd = (s: string): string => (/[.!?…]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);
export const snippet = (s: string, n = 140): string => {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= n ? t : `${t.slice(0, n - 1).trimEnd()}…`;
};

export const firstName = (lead: Lead): string | null => {
  const n = (lead.contato ?? "").trim().split(/\s+/)[0];
  return n ? n : null;
};

/** Texto que o PRÓPRIO lead escreveu (base de toda descoberta). */
export const leadTexts = (lead: Lead): string[] => lead.conversa.filter((m) => m.autor === "lead").map((m) => m.texto);

const SEVERITY: Record<SignalRating, number> = { ausente: 0, fraca: 1, regular: 2, forte: 3 };
export const severity = (r: SignalRating): number => SEVERITY[r];
export const isGap = (r: SignalRating): boolean => r === "fraca" || r === "ausente";

/** Pior sinal registrado por área. */
export function worstSignalByArea(lead: Lead): Map<SignalArea, LeadSignal> {
  const m = new Map<SignalArea, LeadSignal>();
  for (const s of lead.sinais) {
    const cur = m.get(s.area);
    if (!cur || severity(s.avaliacao) < severity(cur.avaliacao)) m.set(s.area, s);
  }
  return m;
}

/** Palavras que, ditas PELO LEAD, indicam que a dor está numa área. */
const AREA_TALK: Partial<Record<SignalArea, RegExp>> = {
  site: /\bsite\b|p[aá]gina|card[aá]pio|cat[aá]logo|link|n[aã]o (acha|encontra)/i,
  conversao: /convers|desist|n[aã]o fecha|carrinho|checkout|encomenda|pedido/i,
  conteudo: /\bposts?\b|conte[uú]do|reels|stories|postar|publicar|frequ[eê]ncia/i,
  posicionamento: /diferen[cç]|concorr|parecid|igual aos/i,
  oferta: /oferta|nosso produto|nosso servi[cç]o|o que (a gente )?vende/i,
  presenca_digital: /presen[cç]a|google|nos encontr|aparec/i,
};

/** Áreas em que o próprio lead falou de dor — a fala dele pesa mais que nossa observação. */
export function confirmedAreas(lead: Lead): Set<SignalArea> {
  const texts = leadTexts(lead).join(" ");
  const out = new Set<SignalArea>();
  for (const [area, re] of Object.entries(AREA_TALK) as [SignalArea, RegExp][]) if (re.test(texts)) out.add(area);
  return out;
}

/**
 * Lacunas de necessidade. Ordem: 1º as que o lead confirmou falando, depois da
 * mais grave à menos grave (empate: ordem canônica).
 */
export function needGaps(lead: Lead): LeadSignal[] {
  const by = worstSignalByArea(lead);
  const conf = confirmedAreas(lead);
  return NEED_AREAS.flatMap((a) => {
    const s = by.get(a);
    return s && isGap(s.avaliacao) ? [s] : [];
  }).sort(
    (a, b) =>
      Number(!conf.has(a.area)) - Number(!conf.has(b.area)) ||
      severity(a.avaliacao) - severity(b.avaliacao) ||
      NEED_AREAS.indexOf(a.area) - NEED_AREAS.indexOf(b.area),
  );
}

export function findService(ctx: CommercialContext, cat: ServiceCategory): ServiceOffer | undefined {
  const all = ctx.servicos.filter((s) => s.categoria === cat);
  return all.find((s) => s.portaDeEntrada) ?? all[0];
}

export const fmtBRL = (n: number): string => `R$ ${n.toLocaleString("pt-BR")}`;

export const norm = (s: string): string =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
