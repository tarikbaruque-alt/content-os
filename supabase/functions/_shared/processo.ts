import type { Backend } from "./tipos.ts";

/**
 * O processo de todo cliente, num lugar só: as 6 etapas, a trava de cada uma
 * e a regra do que pode ser gravado no plano. Os agentes, a op "gravar" e a
 * tela usam estas mesmas funções: nenhuma trava existe só na interface.
 */
export const DNA_MINIMO = 5;

export type Objeto = "estrategia" | "editorial" | "ideias";
export const OBJETO_DO_PREFIXO: [string, Objeto][] = [["cos_strategy/", "estrategia"], ["cos_editorial/", "editorial"], ["cos_ideas/", "ideias"]];

export function objetoDoPath(path: string): Objeto | null {
  for (const [p, o] of OBJETO_DO_PREFIXO) if (path.startsWith(p)) return o;
  return null;
}

/** Caminho do plano que pertence a este cliente, e só dele. */
export function pathDoCliente(path: string, cli: string): boolean {
  const o = objetoDoPath(path);
  if (!o) return false;
  const partes = path.split("/");
  if (partes[1] !== cli) return false;
  return o === "ideias" ? partes.length === 4 && partes[2] === "items" && /^[\w-]{1,80}$/.test(partes[3]!) : partes.length === 2;
}

export async function dnaAprovados(b: Backend, ws: string, cli: string): Promise<number> {
  const e = (((await b.getDoc(ws, `cos_dna/${cli}`)) ?? {}).entries ?? []) as any[];
  return e.filter((x) => x?.status === "approved").length;
}

/** Por que esta gravação do plano não pode acontecer agora, ou null. */
export async function travaDaGravacao(b: Backend, ws: string, cli: string, objetos: Set<Objeto>): Promise<string | null> {
  if (objetos.has("estrategia") && (await dnaAprovados(b, ws, cli)) < DNA_MINIMO)
    return `A estratégia só entra com pelo menos ${DNA_MINIMO} registros do Content DNA aprovados.`;
  const temEstr = objetos.has("estrategia") || !!(await b.getDoc(ws, `cos_strategy/${cli}`));
  if (objetos.has("editorial") && !temEstr) return "A linha editorial só entra depois da estratégia aprovada.";
  const temEdit = objetos.has("editorial") || !!(await b.getDoc(ws, `cos_editorial/${cli}`));
  if (objetos.has("ideias") && !temEdit) return "As ideias só entram depois da linha editorial aprovada.";
  return null;
}

export type Estado = "feita" | "atual" | "bloqueada";
export type Etapa = {
  n: number;
  id: "briefing" | "entender" | "planejar" | "produzir" | "publicar" | "medir";
  nome: string;
  estado: Estado;
  feito: number;
  total: number;
  /** O que falta para destravar, em uma frase. */
  falta: string | null;
  /** Quem precisa agir agora nesta etapa. */
  quem: "equipe" | "cliente" | "agente" | null;
};

const PUBLICADA = new Set(["PUBLISHED"]);
const APROVADA = new Set(["APPROVED", "SCHEDULED", "PUBLISHED"]);

/**
 * A etapa de cada cliente, calculada do banco. As etapas 4 a 6 olham as peças
 * do mês corrente (o ciclo recomeça todo mês); 1 a 3 são a fundação.
 */
export async function etapasDoCliente(b: Backend, ws: string, cli: string, agora: Date): Promise<{ atual: number; etapas: Etapa[] }> {
  const c = (await b.getDoc(ws, `cos_clients/${cli}`)) ?? {};
  const dna = (((await b.getDoc(ws, `cos_dna/${cli}`)) ?? {}).entries ?? []) as any[];
  const aprov = dna.filter((x) => x?.status === "approved").length, pend = dna.filter((x) => x?.status === "pending").length;
  const temEstr = !!(await b.getDoc(ws, `cos_strategy/${cli}`)), temEdit = !!(await b.getDoc(ws, `cos_editorial/${cli}`));
  const ideias = (await b.listDocs(ws, `cos_ideas/${cli}/items`)).length;
  const mes = agora.toISOString().slice(0, 7), hoje = agora.toISOString().slice(0, 10);
  const pecas = (await b.listDocs(ws, `cos_calendar/${cli}/items`)).map((d) => d.data).filter((i) => String(i.data ?? "").slice(0, 7) === mes);
  const temTexto = (i: any) => !!(i.content || i.carousel || i.stories);
  const aprovadas = pecas.filter((i) => APROVADA.has(i.status)).length;
  const vencidas = pecas.filter((i) => String(i.data) <= hoje);
  const publicadas = vencidas.filter((i) => PUBLICADA.has(i.status)).length;
  const medidas = pecas.filter((i) => PUBLICADA.has(i.status) && i.metrics && Number(i.metrics.alcance) > 0).length;
  const pubTotal = pecas.filter((i) => PUBLICADA.has(i.status)).length;
  const briefingOk = !!String(c.briefing ?? "").trim() || dna.length > 0;
  const planoFeito = [temEstr, temEdit, ideias > 0, pecas.length > 0 || (await b.listDocs(ws, `cos_calendar/${cli}/items`)).length > 0];

  const et: Etapa[] = [
    { n: 1, id: "briefing", nome: "Briefing", estado: "bloqueada", feito: briefingOk ? 1 : 0, total: 1,
      falta: briefingOk ? null : "O cliente ainda não respondeu o briefing.", quem: briefingOk ? null : "cliente" },
    { n: 2, id: "entender", nome: "Entender", estado: "bloqueada", feito: Math.min(aprov, DNA_MINIMO), total: DNA_MINIMO,
      falta: aprov >= DNA_MINIMO ? null : pend ? `${pend} registro(s) do DNA esperando aprovação; faltam ${DNA_MINIMO - aprov} aprovados.` : "A Íris ainda não leu o briefing.",
      quem: aprov >= DNA_MINIMO ? null : pend ? "equipe" : "agente" },
    { n: 3, id: "planejar", nome: "Planejar", estado: "bloqueada", feito: planoFeito.filter(Boolean).length, total: 4,
      falta: !temEstr ? "Falta a estratégia aprovada." : !temEdit ? "Falta a linha editorial aprovada." : !ideias ? "Faltam as ideias aprovadas." : !planoFeito[3] ? "Falta distribuir as ideias no calendário." : null,
      quem: null },
    { n: 4, id: "produzir", nome: "Produzir", estado: "bloqueada", feito: aprovadas, total: pecas.length,
      falta: pecas.length && aprovadas < pecas.length ? `${pecas.length - aprovadas} peça(s) do mês sem aprovação.` : null,
      quem: pecas.some((i) => temTexto(i) && !APROVADA.has(i.status)) ? "equipe" : pecas.some((i) => !temTexto(i)) ? "agente" : null },
    { n: 5, id: "publicar", nome: "Publicar", estado: "bloqueada", feito: publicadas, total: vencidas.length,
      falta: vencidas.length > publicadas ? `${vencidas.length - publicadas} peça(s) com data passada não marcadas como publicadas.` : null,
      quem: vencidas.length > publicadas ? "equipe" : null },
    { n: 6, id: "medir", nome: "Medir", estado: "bloqueada", feito: medidas, total: pubTotal,
      falta: pubTotal > medidas ? `${pubTotal - medidas} peça(s) publicadas sem resultado registrado.` : null,
      quem: pubTotal > medidas ? "equipe" : null },
  ];
  // Quem age no Planejar: proposta esperando a equipe, ou o agente ainda trabalhando.
  if (et[2]!.falta) et[2]!.quem = (await b.propostasPendentes(ws, cli)) > 0 ? "equipe" : "agente";

  // Fundação (1 a 3): em ordem, uma de cada vez; a primeira não pronta é a atual e as seguintes ficam bloqueadas.
  const prontas = [briefingOk, aprov >= DNA_MINIMO, !et[2]!.falta];
  let atual = prontas.findIndex((x) => !x) + 1;
  if (atual) {
    for (let i = 0; i < atual - 1; i++) et[i]!.estado = "feita";
    et[atual - 1]!.estado = "atual";
  } else {
    // Ciclo do mês (4 a 6), liberado depois do plano: cada etapa pela sua pendência.
    for (let i = 0; i < 3; i++) et[i]!.estado = "feita";
    for (let i = 3; i < 6; i++) { const e = et[i]!; e.estado = e.falta ? "atual" : e.total ? "feita" : "bloqueada"; }
    atual = (et.findIndex((e, i) => i >= 3 && e.estado === "atual") + 1) || 4;
  }
  return { atual, etapas: et };
}
