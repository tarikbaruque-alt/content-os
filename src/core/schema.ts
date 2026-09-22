import { z } from "zod";

/**
 * Estados de memória do Content OS (governança de memória).
 * Distinguir conhecimento comprovado de inferência é regra do produto.
 */
export const MEMORY_STATES = [
  "FACT",
  "HYPOTHESIS",
  "INSIGHT",
  "STRATEGIC_DECISION",
  "LEARNING",
] as const;

export const memoryStateSchema = z.enum(MEMORY_STATES);
export type MemoryState = z.infer<typeof memoryStateSchema>;

export const MEMORY_STATE_LABELS: Record<MemoryState, string> = {
  FACT: "Fato comprovado ou declarado pela fonte",
  HYPOTHESIS: "Suposição plausível — a validar",
  INSIGHT: "Interpretação derivada de fatos existentes",
  STRATEGIC_DECISION: "Decisão estratégica tomada",
  LEARNING: "Aprendizado sustentado por evidência (ex.: performance)",
};

/**
 * Seções do Content DNA (memória estratégica específica de cada cliente).
 */
export const CONTENT_DNA_SECTIONS = [
  "business",
  "audience",
  "voice_of_customer",
  "positioning",
  "communication",
  "strategic_memory",
] as const;

export const contentDnaSectionSchema = z.enum(CONTENT_DNA_SECTIONS);
export type ContentDnaSection = z.infer<typeof contentDnaSectionSchema>;

export const CONTENT_DNA_SECTION_LABELS: Record<ContentDnaSection, string> = {
  business: "Negócio",
  audience: "Público & Persona",
  voice_of_customer: "Voice of Customer",
  positioning: "Posicionamento",
  communication: "Comunicação",
  strategic_memory: "Memória Estratégica",
};

/**
 * Proveniência — de onde veio a informação. Obrigatória em todo registro:
 * sem rastreabilidade, um FACT não pode ser tratado como fato.
 */
export const provenanceSchema = z.object({
  /** Fonte legível: nome do documento, entrevista, nota, etc. */
  source: z.string().min(1),
  /** URL da fonte, quando houver. */
  url: z.string().url().optional(),
  /** Data ISO da informação/captura. */
  date: z.string().min(1),
  /** Agente que registrou (nome próprio, ex.: "Íris"). */
  agent: z.string().min(1),
  /** Confiança do registro, de 0 a 1. */
  confidence: z.number().min(0).max(1),
});
export type Provenance = z.infer<typeof provenanceSchema>;
