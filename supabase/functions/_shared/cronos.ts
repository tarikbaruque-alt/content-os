// Cronos no servidor: monta o PRÓXIMO TRECHO VAZIO do calendário a partir das ideias
// aprovadas. Mesmas regras do botão "Montar calendário" do painel
// (apps/web/src/33-criacao-e-gatilhos.js, runGerarPlanejamento): dias de
// postagem da rotina, limite de peças gravadas por semana, mix de funil pelo
// foco do cliente, sem repetir ideia. Diferença: acrescenta o período seguinte
// e não apaga nada do que já está marcado. É cálculo, não usa IA.

const DIAS_PADRAO: Record<number, number[]> = { 1: [3], 2: [2, 4], 3: [2, 3, 5], 4: [2, 3, 4, 5], 5: [1, 2, 3, 4, 5], 6: [1, 2, 3, 4, 5, 6], 7: [0, 1, 2, 3, 4, 5, 6] };
const CAPACIDADE: Record<number, { total: number; grav: number }> = { 0: { total: 2, grav: 0 }, 30: { total: 3, grav: 1 }, 60: { total: 3, grav: 2 }, 120: { total: 4, grav: 3 }, 180: { total: 5, grav: 4 }, 240: { total: 6, grav: 5 } };
const MIX: Record<string, { topo: number; meio: number; fundo: number }> = {
  topo: { topo: 60, meio: 25, fundo: 15 }, meio: { topo: 30, meio: 50, fundo: 20 }, fundo: { topo: 25, meio: 30, fundo: 45 }, equilibrio: { topo: 45, meio: 35, fundo: 20 },
};
const precisaGravar = (s: string) => ["Reel", "Vídeo", "Stories", "Live"].includes(s);
const fmt = (d: Date) => d.toISOString().slice(0, 10);

type Ideia = Record<string, any> & { id: string; funil?: string; surface?: string };

/**
 * O próximo trecho do calendário que ainda está vazio: começa amanhã (ou no dia
 * seguinte à última peça já marcada) e vai até o fim daquele mês; se sobrarem
 * menos de 10 dias, vai até o fim do mês seguinte. Serve ao cliente novo
 * (começa amanhã) e ao planejamento mensal (o mês que vem).
 */
export function periodoVazio(agora: Date, datasMarcadas: string[]): { inicio: string; fim: string } {
  const br = new Date(agora.getTime() - 3 * 3600e3);
  const amanha = new Date(Date.UTC(br.getUTCFullYear(), br.getUTCMonth(), br.getUTCDate() + 1));
  const ultima = datasMarcadas.filter(Boolean).sort().at(-1);
  let ini = amanha;
  if (ultima) { const d = new Date(ultima + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + 1); if (d > ini) ini = d; }
  let fim = new Date(Date.UTC(ini.getUTCFullYear(), ini.getUTCMonth() + 1, 0));
  if ((fim.getTime() - ini.getTime()) / 864e5 < 9) fim = new Date(Date.UTC(ini.getUTCFullYear(), ini.getUTCMonth() + 2, 0));
  return { inicio: fmt(ini), fim: fmt(fim) };
}

export function diasDePostagem(rotina: Record<string, any>): number[] {
  const d = rotina?.diasPost;
  return Array.isArray(d) && d.length ? d.map(Number) : DIAS_PADRAO[3]!;
}

/** Datas de postagem entre inicio e fim (inclusive), nos dias da semana da rotina. */
export function slotsDoPeriodo(inicio: string, fim: string, dias: number[]): string[] {
  const out: string[] = [];
  for (let d = new Date(inicio + "T00:00:00Z"); fmt(d) <= fim; d = new Date(d.getTime() + 864e5)) if (dias.includes(d.getUTCDay())) out.push(fmt(d));
  return out;
}

export function montarPeriodo(ideias: Ideia[], rotina: Record<string, any>, inicio: string, fim: string) {
  const slots = slotsDoPeriodo(inicio, fim, diasDePostagem(rotina));
  const total = slots.length;
  const mix = MIX[rotina?.foco ?? "equilibrio"] ?? MIX.equilibrio!;
  const cap = rotina?.tempoGrav == null || rotina.tempoGrav === "" ? null : (() => {
    const c = CAPACIDADE[+rotina.tempoGrav] ?? CAPACIDADE[60]!;
    return { grav: rotina.maxGrav != null ? +rotina.maxGrav : c.grav };
  })();
  const alvo = { topo: Math.round((total * mix.topo) / 100), meio: Math.round((total * mix.meio) / 100), fundo: 0 };
  alvo.fundo = total - alvo.topo - alvo.meio;
  const usadas = new Set<string>();
  const gravSemana: Record<string, number> = {};
  const semanaDe = (ds: string) => { const d = new Date(ds + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return fmt(d); };
  const livres = () => ideias.filter((x) => !usadas.has(x.id));
  function pegar(etapa: string, slot: string): Ideia | null {
    let pool = livres();
    if (!pool.length) return null; // sem ideia nova, a data fica vazia: melhor que repetir
    const semana = semanaDe(slot);
    if (cap && (gravSemana[semana] ?? 0) >= cap.grav) {
      const semGravar = pool.filter((x) => !precisaGravar(x.surface ?? "Reel"));
      if (semGravar.length) pool = semGravar;
    }
    const p = pool.find((x) => x.funil === etapa) ?? pool[0]!;
    usadas.add(p.id);
    if (precisaGravar(p.surface ?? "Reel")) gravSemana[semana] = (gravSemana[semana] ?? 0) + 1;
    return p;
  }
  const ct = { topo: 0, meio: 0, fundo: 0 };
  const itens: Record<string, any>[] = [];
  slots.forEach((slot, i) => {
    // Intercala topo/meio/fundo: sempre a etapa mais atrasada em relação ao alvo.
    let etapa: "topo" | "meio" | "fundo" = "topo", melhor = -1;
    for (const e of ["topo", "meio", "fundo"] as const) { const sc = alvo[e] ? (alvo[e] - ct[e]) / alvo[e] : -1; if (sc > melhor) { melhor = sc; etapa = e; } }
    ct[etapa]++;
    const idea = pegar(etapa, slot);
    if (!idea) return;
    const chave = slot.replace(/-/g, "");
    itens.push({ ord: Number(chave), id: `cal-${chave}-${i + 1}`, data: slot, idea, content: null, carousel: null, stories: null, status: "PLANNED" });
  });
  return { itens, total, faltaram: total - itens.length, mix: ct };
}
