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

/**
 * Guardrail de VOZ — compartilhado por Rima, Mosaico e Enredo. Combate
 * "cara de IA" de forma concreta (não um "seja autêntico" vago). Some
 * modelos, mesmo bem instruídos, caem em tiques genéricos por padrão —
 * isto lista os tiques e dá a alternativa.
 */
export const ANTI_AI_VOICE = `VOZ HUMANA — nunca "cara de IA". Evite ativamente:
- Clichês: "no mundo de hoje", "é fundamental", "destravar", "elevar", "mergulhar", "jornada" fora de contexto, "não é só X, é Y", "imagine só".
- Frases perfeitamente simétricas em sequência (parece lista gerada por máquina).
- Entusiasmo genérico sem substância ("incrível!", "imperdível!", "revolucionário") — mostre o específico, não anuncie o genérico.
- Todo parágrafo com a mesma cadência/abertura (varie o ritmo das frases: curtas e longas).
- Travessões e negritos em excesso como muleta de ênfase.
Em vez disso: use o VOCABULÁRIO REAL do cliente (VoC — as palavras que ele/a persona realmente usam), seja específico ao ponto de um concorrente não conseguir copiar trocando só o nome, e prefira uma frase imperfeita e concreta a uma frase "redonda" demais. Se soa como texto que qualquer marca do nicho poderia ter publicado, reescreva.`;

/** Termos de busca visual derivados do território do cliente (não genéricos). */
export function visualTerms(ctx: CreativeContext, extra: string[] = []): string[] {
  const seed = [
    ctx.strategy.persona.split(" ").slice(0, 4).join(" "),
    ctx.diferencial.split(" ").slice(0, 4).join(" "),
    ...extra,
  ];
  return [...new Set(seed.map((t) => t.replace(/[.,;:]/g, "").trim()).filter((t) => t.length > 2))].slice(0, 3);
}
