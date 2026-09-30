import type { ServiceCategory, ValueChain, ServiceOffer } from "./types.js";
import { VALUE_CHAINS } from "./knowledge.js";

/**
 * VALUE BUILDER — transforma característica do serviço em valor percebido.
 *   ENTREGÁVEL → BENEFÍCIO → IMPACTO → VALOR PARA O NEGÓCIO
 * Só descreve o que o serviço PODE gerar (sem prometer números).
 */
export function buildValueChain(categoria: ServiceCategory): ValueChain {
  const d = VALUE_CHAINS[categoria];
  return {
    categoria,
    entregavel: d.entregavel,
    beneficio: d.beneficio,
    impacto: d.impacto,
    valorParaONegocio: d.valor,
    frase: d.frase,
  };
}

/** Cadeia de valor de um serviço do catálogo, listando seus entregáveis cadastrados. */
export function buildServiceValue(service: ServiceOffer): ValueChain & { entregaveisCadastrados: string[] } {
  return { ...buildValueChain(service.categoria), entregaveisCadastrados: service.entregaveis };
}

export const ALL_CATEGORIES = Object.keys(VALUE_CHAINS) as ServiceCategory[];
