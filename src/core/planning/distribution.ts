import { z } from "zod";

/**
 * Planejador de distribuição editorial (workflow do Planejamento/Cronos).
 *
 * Recebe um total de conteúdos do mês + a intenção de mix por FUNIL
 * (topo/meio/fundo, em %) e opcionalmente pesos por FUNÇÃO de conteúdo, e
 * devolve uma distribuição em números inteiros que soma exatamente o total.
 *
 * Não é um agente novo: é uma competência determinística e testável que o
 * estrategista controla (mais topo do que fundo, ou vice-versa).
 */

export const FUNNEL_STAGES = ["topo", "meio", "fundo"] as const;
export type FunnelStage = (typeof FUNNEL_STAGES)[number];

export const CONTENT_FUNCTIONS = [
  "descoberta",
  "conscientizacao",
  "educativo",
  "conversao",
  "experiencia_propria",
  "experiencia_compartilhada",
] as const;
export type ContentFunction = (typeof CONTENT_FUNCTIONS)[number];

/** A qual etapa de funil cada função de conteúdo pertence por padrão. */
export const FUNCTION_TO_FUNNEL: Record<ContentFunction, FunnelStage> = {
  descoberta: "topo",
  conscientizacao: "topo",
  educativo: "meio",
  conversao: "fundo",
  experiencia_propria: "fundo",
  experiencia_compartilhada: "fundo",
};

export const FUNCTION_LABELS: Record<ContentFunction, string> = {
  descoberta: "Descoberta",
  conscientizacao: "Conscientização",
  educativo: "Educativo",
  conversao: "Conversão",
  experiencia_propria: "Experiência própria",
  experiencia_compartilhada: "Experiência compartilhada",
};

const funnelWeightsSchema = z.object({
  topo: z.number().min(0),
  meio: z.number().min(0),
  fundo: z.number().min(0),
});

const functionWeightsSchema = z.object({
  descoberta: z.number().min(0),
  conscientizacao: z.number().min(0),
  educativo: z.number().min(0),
  conversao: z.number().min(0),
  experiencia_propria: z.number().min(0),
  experiencia_compartilhada: z.number().min(0),
});

export const distributionInputSchema = z.object({
  total: z.number().int().min(1).max(200),
  funnel: funnelWeightsSchema,
  functions: functionWeightsSchema.optional(),
});
export type DistributionInput = z.infer<typeof distributionInputSchema>;

export type DistributionResult = {
  total: number;
  funnel: Record<FunnelStage, number>;
  funnelPercent: Record<FunnelStage, number>;
  functions: Record<ContentFunction, number>;
  warnings: string[];
};

/** Pesos-padrão por função (equilíbrio saudável), usados quando não informados. */
const DEFAULT_FUNCTION_WEIGHTS: Record<ContentFunction, number> = {
  descoberta: 30,
  conscientizacao: 15,
  educativo: 25,
  conversao: 15,
  experiencia_propria: 10,
  experiencia_compartilhada: 5,
};

/**
 * Método do maior resto (Hamilton): distribui `total` inteiro entre buckets
 * conforme os pesos, garantindo que a soma dos inteiros seja exatamente `total`.
 */
export function largestRemainder(weights: number[], total: number): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return weights.map(() => 0);
  const raw = weights.map((w) => (w / sum) * total);
  const floors = raw.map((x) => Math.floor(x));
  let remaining = total - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac);
  const counts = floors.slice();
  for (let k = 0; k < order.length && remaining > 0; k++) {
    counts[order[k]!.i]! += 1;
    remaining -= 1;
  }
  return counts;
}

export function planDistribution(rawInput: DistributionInput): DistributionResult {
  const input = distributionInputSchema.parse(rawInput);
  const warnings: string[] = [];

  const funnelSum = input.funnel.topo + input.funnel.meio + input.funnel.fundo;
  if (funnelSum <= 0) {
    throw new Error("O mix de funil precisa ter ao menos uma etapa > 0.");
  }

  const funnelCounts = largestRemainder(
    [input.funnel.topo, input.funnel.meio, input.funnel.fundo],
    input.total,
  );
  const funnel: Record<FunnelStage, number> = {
    topo: funnelCounts[0]!,
    meio: funnelCounts[1]!,
    fundo: funnelCounts[2]!,
  };
  const funnelPercent: Record<FunnelStage, number> = {
    topo: Math.round((input.funnel.topo / funnelSum) * 100),
    meio: Math.round((input.funnel.meio / funnelSum) * 100),
    fundo: Math.round((input.funnel.fundo / funnelSum) * 100),
  };

  const fw = input.functions ?? DEFAULT_FUNCTION_WEIGHTS;
  const funcCounts = largestRemainder(
    CONTENT_FUNCTIONS.map((f) => fw[f]),
    input.total,
  );
  const functions = {} as Record<ContentFunction, number>;
  CONTENT_FUNCTIONS.forEach((f, i) => {
    functions[f] = funcCounts[i]!;
  });

  // Coerência: o funil implícito pelas funções deve conversar com o funil pedido.
  const impliedTopo =
    functions.descoberta + functions.conscientizacao;
  if (funnel.topo > 0 && impliedTopo === 0) {
    warnings.push(
      "Você pediu conteúdo de topo, mas as funções escolhidas não têm descoberta/conscientização.",
    );
  }
  if (funnel.fundo > 0 && functions.conversao === 0) {
    warnings.push(
      "Há espaço de fundo de funil, mas nenhuma peça de conversão foi prevista.",
    );
  }

  return { total: input.total, funnel, funnelPercent, functions, warnings };
}
