import { dnaView, type DnaView } from "../../pipeline/dna-view.js";
import type { Dna, StrategyArchitecture, EditorialArchitecture, ResearchOpportunity } from "../../pipeline/types.js";
import { clean } from "../../pipeline/text.js";

/**
 * Contexto criativo COMPLETO que Mosaico (carrossel) e Enredo (Stories) usam.
 * Reúne tudo que a estratégia produziu — para a execução nunca ser genérica:
 * Content DNA + Estratégia + Big Message + Linha Editorial + Research +
 * Persona + Voice of Customer.
 */
export type CreativeContext = {
  clientName: string;
  dna: Dna;
  view: DnaView;
  strategy: StrategyArchitecture;
  editorial: EditorialArchitecture;
  research: ResearchOpportunity[];
  // atalhos já limpos (sem lead-ins em 1ª pessoa)
  dor: string;
  desejo: string;
  objecao: string;
  diferencial: string;
  posicionamento: string;
  voc: string;
  tom: string;
};

export function buildCreativeContext(
  clientName: string,
  dna: Dna,
  strategy: StrategyArchitecture,
  editorial: EditorialArchitecture,
  research: ResearchOpportunity[],
): CreativeContext {
  const view = dnaView(dna);
  return {
    clientName,
    dna,
    view,
    strategy,
    editorial,
    research,
    dor: clean(view.dores[0] ?? "a dor da persona"),
    desejo: clean(view.desejos[0] ?? "o desejo da persona"),
    objecao: clean(view.objecoes[0] ?? "a objeção da persona"),
    diferencial: clean(view.diferenciais[0] ?? "o diferencial do cliente"),
    posicionamento: view.posicionamento[0] ? clean(view.posicionamento[0]) : "",
    voc: view.voc[0] ? clean(view.voc[0]) : "",
    tom: view.tom ? clean(view.tom) : "próximo e claro",
  };
}

const LC = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
export const lc = LC;

/** Termos de busca visual derivados do território do cliente (não genéricos). */
export function visualTerms(ctx: CreativeContext, extra: string[] = []): string[] {
  const seed = [
    ctx.strategy.persona.split(" ").slice(0, 4).join(" "),
    ctx.diferencial.split(" ").slice(0, 4).join(" "),
    ...extra,
  ];
  return [...new Set(seed.map((t) => t.replace(/[.,;:]/g, "").trim()).filter((t) => t.length > 2))].slice(0, 3);
}
