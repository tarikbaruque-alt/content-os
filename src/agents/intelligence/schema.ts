import { z } from "zod";
import { contentDnaSuggestionSetSchema } from "../../core/content-dna/types.js";

export const rawInputTypeSchema = z.enum([
  "interview",
  "document",
  "note",
  "url",
  "transcript",
  "message",
  "form",
]);
export type RawInputType = z.infer<typeof rawInputTypeSchema>;

export const rawInputSchema = z.object({
  type: rawInputTypeSchema,
  /** Conteúdo bruto fornecido (transcrição, nota, documento, etc.). */
  content: z.string().min(1),
  /** Origem legível (ex.: "Entrevista de onboarding — 12/03"). */
  source: z.string().min(1),
  /** Data ISO opcional. */
  date: z.string().optional(),
});
export type RawInput = z.infer<typeof rawInputSchema>;

export const intelligenceInputSchema = z.object({
  clientId: z.string().min(1),
  rawInputs: z.array(rawInputSchema).min(1),
  /** Foco opcional (ex.: "priorizar persona e objeções"). */
  focus: z.string().optional(),
});
export type IntelligenceInput = z.infer<typeof intelligenceInputSchema>;

/** A saída de Íris é um conjunto de sugestões de Content DNA. */
export const intelligenceOutputSchema = contentDnaSuggestionSetSchema;
export type IntelligenceOutput = z.infer<typeof intelligenceOutputSchema>;
