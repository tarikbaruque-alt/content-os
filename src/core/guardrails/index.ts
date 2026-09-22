import type { ContentDnaSuggestion } from "../content-dna/types.js";
import type { MemoryState } from "../schema.js";

/**
 * Guardrails do Content OS.
 *
 * Regras inegociáveis aplicadas na fronteira, ANTES de qualquer informação
 * entrar no Content DNA. Nunca inventar dados/fontes; nunca tratar hipótese
 * como fato; nunca registrar um FACT sem proveniência.
 */

export type ProvenanceCheck = {
  suggestion: ContentDnaSuggestion;
  changed: boolean;
  reason?: string;
};

/**
 * Um FACT precisa de proveniência real (fonte não-vazia). Sem isso, é rebaixado
 * para HYPOTHESIS — nunca descartado silenciosamente, nunca promovido a fato.
 */
export function enforceProvenance(
  suggestion: ContentDnaSuggestion,
): ProvenanceCheck {
  const hasSource = suggestion.provenance.source.trim().length > 0;
  if (suggestion.state === "FACT" && !hasSource) {
    return {
      suggestion: {
        ...suggestion,
        state: "HYPOTHESIS" as MemoryState,
        confidence: Math.min(suggestion.confidence, 0.5),
      },
      changed: true,
      reason: "FACT sem proveniência foi rebaixado para HYPOTHESIS",
    };
  }
  return { suggestion, changed: false };
}

export type InventionViolation = {
  index: number;
  field: string;
  declaredSource: string;
  reason: string;
};

/**
 * Anti-invenção de fontes: todo FACT/LEARNING deve citar uma fonte que exista
 * de fato entre as entradas fornecidas. Se citar uma fonte desconhecida, é uma
 * violação (o agente pode ter "inventado" uma origem).
 */
export function findSourceInventions(
  suggestions: ContentDnaSuggestion[],
  allowedSources: string[],
): InventionViolation[] {
  const allowed = new Set(allowedSources.map((s) => s.trim().toLowerCase()));
  const violations: InventionViolation[] = [];
  suggestions.forEach((s, index) => {
    const grounded = s.state === "FACT" || s.state === "LEARNING";
    if (!grounded) return;
    const src = s.provenance.source.trim().toLowerCase();
    if (!allowed.has(src)) {
      violations.push({
        index,
        field: s.field,
        declaredSource: s.provenance.source,
        reason: `Fonte "${s.provenance.source}" não consta nas entradas fornecidas`,
      });
    }
  });
  return violations;
}
