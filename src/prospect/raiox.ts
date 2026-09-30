import type { Claim, DimKey, HeaderKey, Lead, Nota, NotaAvaliada } from "./types.js";
import { DIM_KEYS, HEADER_KEYS } from "./types.js";
import { DIMENSOES, DIM_LABEL, HEADER_PARTS, PAINS } from "./catalog-core.js";
import { GARGALOS, type GargaloDef } from "./catalog-gargalos.js";

export type EffNota = NotaAvaliada | "nao_avaliado";
export type EffDim = { key: DimKey; label: string; nota: EffNota; obs?: string; origem: "avaliacao" | "contagem" | "nenhuma"; base?: string };
export type EffHeader = { key: HeaderKey; label: string; nota: EffNota; obs?: string };

export type GargaloHit = {
  def: GargaloDef;
  /** Fatos que sustentam a hipótese (vindos dos dados que você informou). */
  evidencias: string[];
  /** A interpretação é sempre HIPOTESE; vira CONFIRMADO só se o lead disser. */
  certeza: "HIPOTESE" | "CONFIRMADO";
};

export type PainStatus = {
  key: string;
  label: string;
  status: "CONFIRMADO" | "HIPOTESE" | "SO_CONVERSA" | "SEM_INDICIO";
  sinais: string[];
  pergunta: string;
};

export type RaioX = {
  dims: EffDim[];
  header: EffHeader[];
  avaliadas: number;
  confianca: "baixa" | "media" | "alta";
  gargalos: GargaloHit[];
  dores: PainStatus[];
  pontosFortes: Claim[];
  lacunas: string[];
};

const weakSet = new Set<EffNota>(["fraca", "ausente"]);
const okSet = new Set<EffNota>(["regular", "forte"]);

/** Critério padrão do sistema para classificar uma CONTAGEM informada. 0 = ausente. */
function bucket(n: number, regular: number, forte: number): NotaAvaliada {
  return n <= 0 ? "ausente" : n < regular ? "fraca" : n < forte ? "regular" : "forte";
}
/** Participação de um tipo no total (mín. 6 itens observados para valer). */
function shareNota(part: number | undefined, total: number): NotaAvaliada | null {
  if (part == null || total < 6) return null;
  const s = part / total;
  return s <= 0 ? "ausente" : s < 0.15 ? "fraca" : s < 0.35 ? "regular" : "forte";
}
const sum = (o?: Record<string, number | undefined>): number => (o ? Object.values(o).reduce<number>((a, b) => a + (b ?? 0), 0) : 0);

export function effectiveDims(lead: Lead): EffDim[] {
  const p = lead.profile;
  const mixTotal = sum(p.mix);
  const funilTotal = sum(p.funil);

  const derived = (key: DimKey): { nota: NotaAvaliada; base: string } | null => {
    switch (key) {
      case "frequencia": return p.posts30d != null ? { nota: bucket(p.posts30d, 6, 12), base: `informado: ${p.posts30d} posts nos últimos 30 dias` } : null;
      case "reels": return p.reels30d != null ? { nota: bucket(p.reels30d, 4, 8), base: `informado: ${p.reels30d} Reels nos últimos 30 dias` } : null;
      case "carrosseis": return p.carrosseis30d != null ? { nota: bucket(p.carrosseis30d, 3, 6), base: `informado: ${p.carrosseis30d} carrosséis nos últimos 30 dias` } : null;
      case "stories": {
        const m = { diario: "forte", semanal: "regular", raro: "fraca", nunca: "ausente" } as const;
        return p.stories && p.stories !== "nao_sei" ? { nota: m[p.stories], base: `informado: Stories ${p.stories}` } : null;
      }
      case "cta": return p.ctaNaBio === false ? { nota: "ausente", base: "informado: sem CTA na bio" } : null;
      case "educativo": { const n = shareNota(p.mix?.educativo, mixTotal); return n ? { nota: n, base: `informado: ${p.mix?.educativo} de ${mixTotal} posts educativos` } : null; }
      case "comercial": { const n = shareNota(p.mix?.comercial, mixTotal); return n ? { nota: n, base: `informado: ${p.mix?.comercial} de ${mixTotal} posts comerciais` } : null; }
      case "prova_social": { const n = shareNota(p.mix?.provaSocial, mixTotal); return n ? { nota: n, base: `informado: ${p.mix?.provaSocial} de ${mixTotal} posts de prova social` } : null; }
      case "descoberta": { const n = shareNota(p.funil?.descoberta, funilTotal); return n ? { nota: n, base: `informado: ${p.funil?.descoberta} de ${funilTotal} de descoberta` } : null; }
      case "consideracao": { const n = shareNota(p.funil?.consideracao, funilTotal); return n ? { nota: n, base: `informado: ${p.funil?.consideracao} de ${funilTotal} de consideração` } : null; }
      case "conversao": { const n = shareNota(p.funil?.conversao, funilTotal); return n ? { nota: n, base: `informado: ${p.funil?.conversao} de ${funilTotal} de conversão` } : null; }
      default: return null;
    }
  };

  return DIM_KEYS.map((key): EffDim => {
    const inp = p.dims[key];
    const label = DIM_LABEL[key];
    const nota: Nota = inp?.nota ?? "nao_avaliado";
    if (nota !== "nao_avaliado") return { key, label, nota, ...(inp?.obs ? { obs: inp.obs } : {}), origem: "avaliacao" };
    const d = derived(key);
    if (d) return { key, label, nota: d.nota, ...(inp?.obs ? { obs: inp.obs } : {}), origem: "contagem", base: d.base };
    return { key, label, nota: "nao_avaliado", ...(inp?.obs ? { obs: inp.obs } : {}), origem: "nenhuma" };
  });
}

export function effectiveHeader(lead: Lead): EffHeader[] {
  return HEADER_KEYS.map((key) => {
    const inp = lead.profile.header[key];
    return { key, label: HEADER_PARTS.find((h) => h.key === key)!.label, nota: (inp?.nota ?? "nao_avaliado") as EffNota, ...(inp?.obs ? { obs: inp.obs } : {}) };
  });
}

/** Trechos em que o PRÓPRIO lead cita uma dor (só isso vira CONFIRMADO). */
const PAIN_TALK: Record<string, RegExp> = {
  falta_tempo: /(sem|n[aã]o tenho|falta de|pouco) tempo/i,
  nao_sabe_o_que_postar: /n[aã]o sei o que (postar|publicar|falar)/i,
  falta_constancia: /const[aâ]ncia|n[aã]o consigo (manter|postar)|paro de postar|some(mos)? do instagram/i,
  baixo_alcance: /baixo alcance|ningu[eé]m v[eê]|n[aã]o alcan[cç]a/i,
  pouco_engajamento: /pouco engajamento|ningu[eé]m (curte|comenta|interage)/i,
  dificuldade_aparecer: /n[aã]o gosto de aparecer|vergonha de (aparecer|gravar)/i,
  dificuldade_roteiro: /n[aã]o sei (o que|como) (falar|roteirizar)|dificuldade (com|de) roteiro/i,
  falta_criatividade: /falta de (criatividade|ideia)|sem ideias?/i,
  dependencia_indicacao: /(s[oó]|somente|apenas|principalmente) (por |de )?indica[cç][aã]o|clientes? (v[eê]m|chegam) (por|de) indica[cç][aã]o/i,
  conteudo_sem_clientes: /instagram n[aã]o (traz|gera|d[aá]) (cliente|retorno)/i,
  falta_estrategia: /sem estrat[eé]gia|n[aã]o tenho estrat[eé]gia/i,
};

export function analyzeRaioX(lead: Lead): RaioX {
  const p = lead.profile;
  const dims = effectiveDims(lead);
  const header = effectiveHeader(lead);
  const d = (k: DimKey): EffDim => dims.find((x) => x.key === k)!;
  const weak = (k: DimKey) => weakSet.has(d(k).nota);
  const ok = (k: DimKey) => okSet.has(d(k).nota);
  const ev = (k: DimKey): string => {
    const x = d(k);
    return `${x.label}: ${x.nota}${x.obs ? ` — "${x.obs}"` : ""}${x.base ? ` (${x.base})` : ""}`;
  };
  const mixTotal = sum(p.mix);
  const funilTotal = sum(p.funil);
  const funilFracos = funilTotal >= 6 ? (["descoberta", "consideracao", "conversao"] as const).filter((k) => (p.funil?.[k] ?? 0) / funilTotal < 0.15) : [];
  const headerFracos = header.filter((h) => weakSet.has(h.nota));
  const falouIndicacao = lead.conversa.filter((m) => m.autor === "lead").map((m) => m.texto).concat(Object.values(lead.qual)).find((t) => PAIN_TALK.dependencia_indicacao!.test(t));

  const hits: GargaloHit[] = [];
  const add = (id: string, evidencias: string[], certeza: GargaloHit["certeza"] = "HIPOTESE") => {
    const def = GARGALOS.find((g) => g.id === id)!;
    hits.push({ def, evidencias: evidencias.filter(Boolean), certeza });
  };

  if (ok("frequencia") && (weak("posicionamento") || weak("tipos_conteudo") || funilFracos.length >= 2)) {
    add("sem_estrategia", [ev("frequencia"), weak("posicionamento") ? ev("posicionamento") : "", weak("tipos_conteudo") ? ev("tipos_conteudo") : "", funilFracos.length >= 2 ? `Funil desequilibrado (poucos conteúdos de: ${funilFracos.join(", ")})` : ""]);
  }
  if ((ok("qualidade") || ok("consistencia_visual")) && (weak("clareza_oferta") || weak("posicionamento"))) {
    add("estetica_sem_valor", [ok("qualidade") ? ev("qualidade") : ev("consistencia_visual"), weak("clareza_oferta") ? ev("clareza_oferta") : ev("posicionamento")]);
  }
  if (ok("autoridade") && weak("educativo")) add("autoridade_nao_convertida", [ev("autoridade"), ev("educativo"), p.temaDominado ? `Tema dominado informado: ${p.temaDominado}` : ""]);
  if (weak("comercial") || weak("conversao") || (weak("cta") && weak("bio"))) {
    add("pouco_comercial", [weak("comercial") ? ev("comercial") : "", weak("conversao") ? ev("conversao") : "", weak("cta") ? ev("cta") : ""]);
  }
  if (mixTotal >= 6 && (p.mix?.institucional ?? 0) / mixTotal >= 0.5) add("institucional", [`${p.mix?.institucional} de ${mixTotal} posts observados são institucionais (informado)`]);
  if (weak("frequencia")) add("baixa_frequencia", [ev("frequencia")]);
  if (ok("clareza_oferta") && weak("consideracao")) add("oferta_sem_desejo", [ev("clareza_oferta"), ev("consideracao")]);
  if (weak("prova_social")) add("sem_prova_social", [ev("prova_social")]);
  if (weak("bio") || (p.ctaNaBio === false && !ok("bio"))) add("bio_fraca", [weak("bio") ? ev("bio") : "", p.ctaNaBio === false ? "Sem CTA na bio (informado)" : ""]);
  if (weak("humanizacao")) add("sem_humanizacao", [ev("humanizacao")]);
  if (weak("reels")) add("reels_baixo", [ev("reels")]);
  if (weak("stories")) add("stories_sem_estrategia", [ev("stories")]);
  if (weak("carrosseis")) add("carrossel_baixo", [ev("carrosseis")]);
  if (weak("descoberta")) add("baixo_alcance", [ev("descoberta")]);
  if (weak("posicionamento")) add("sem_posicionamento", [ev("posicionamento")]);
  if (weak("qualidade") || weak("consistencia_visual")) add("qualidade_baixa", [weak("qualidade") ? ev("qualidade") : "", weak("consistencia_visual") ? ev("consistencia_visual") : ""]);
  if (headerFracos.length >= 2) add("cabecalho_fraco", headerFracos.map((h) => `${h.label}: ${h.nota}${h.obs ? ` — "${h.obs}"` : ""}`));
  const nome = header.find((h) => h.key === "nome_busca");
  if (nome && weakSet.has(nome.nota)) add("pouco_encontravel", [`Campo NOME com palavra-chave: ${nome.nota}${nome.obs ? ` — "${nome.obs}"` : ""}`]);
  if (falouIndicacao) add("dependencia_indicacao", [`Dito pelo lead: "${falouIndicacao.slice(0, 140)}"`], "CONFIRMADO");

  hits.sort((a, b) => b.def.peso - a.def.peso || b.evidencias.length - a.evidencias.length);

  // ------- dores (nunca assumidas)
  const talk = lead.conversa.filter((m) => m.autor === "lead").map((m) => m.texto).concat(Object.values(lead.qual)).join(" \n ");
  const dores: PainStatus[] = PAINS.map((pn) => {
    const sinais = hits.filter((h) => pn.sinais.includes(h.def.id)).map((h) => h.def.titulo);
    const confirmada = lead.doresConfirmadas.includes(pn.key) || (PAIN_TALK[pn.key]?.test(talk) ?? false);
    const status: PainStatus["status"] = confirmada ? "CONFIRMADO" : sinais.length ? "HIPOTESE" : pn.observavel ? "SEM_INDICIO" : "SO_CONVERSA";
    return { key: pn.key, label: pn.label, status, sinais, pergunta: pn.pergunta };
  });

  // ------- pontos fortes (só o que foi informado como bom)
  const pontosFortes: Claim[] = [];
  for (const x of dims) if (x.nota === "forte") pontosFortes.push({ texto: `${x.label}: ${x.obs ?? "avaliado como ponto forte"}`, certeza: "OBSERVADO", evidencia: x.base ?? "avaliação informada no Raio-X" });
  for (const x of dims) if (x.nota === "regular" && x.obs) pontosFortes.push({ texto: `${x.label}: ${x.obs}`, certeza: "OBSERVADO", evidencia: "avaliação informada no Raio-X" });
  for (const h of header) if (h.nota === "forte") pontosFortes.push({ texto: `${h.label}: ${h.obs ?? "ponto forte"}`, certeza: "OBSERVADO", evidencia: "checagem do cabeçalho" });
  if (p.temaDominado) pontosFortes.unshift({ texto: `Demonstra domínio em ${p.temaDominado}.`, certeza: "OBSERVADO", evidencia: "informado por você" });

  const avaliadas = dims.filter((x) => x.nota !== "nao_avaliado").length;
  const lacunas: string[] = [];
  if (avaliadas < 6) lacunas.push(`Só ${avaliadas} de ${DIMENSOES.length} dimensões avaliadas: as hipóteses abaixo têm pouca base.`);
  const faltam = dims.filter((x) => x.nota === "nao_avaliado").map((x) => x.label);
  if (faltam.length && avaliadas >= 6) lacunas.push(`Sem avaliação: ${faltam.slice(0, 6).join(", ")}${faltam.length > 6 ? "…" : ""}.`);
  if (!p.temaDominado) lacunas.push("Sem 'tema que o perfil domina': a abordagem fica menos específica.");

  return { dims, header, avaliadas, confianca: avaliadas < 6 ? "baixa" : avaliadas < 12 ? "media" : "alta", gargalos: hits, dores, pontosFortes, lacunas };
}
