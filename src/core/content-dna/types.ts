import { z } from "zod";
import {
  contentDnaSectionSchema,
  memoryStateSchema,
  provenanceSchema,
} from "../schema.js";

/**
 * Uma sugestão de conhecimento produzida por um agente (ex.: Íris).
 * Ainda NÃO é um registro do Content DNA — precisa de aprovação humana.
 */
export const contentDnaSuggestionSchema = z.object({
  section: contentDnaSectionSchema,
  /** Campo dentro da seção, ex.: "persona", "dores", "diferenciais". */
  field: z.string().min(1),
  /** Conteúdo da informação. */
  value: z.string().min(1),
  state: memoryStateSchema,
  confidence: z.number().min(0).max(1),
  provenance: provenanceSchema,
  /** Por que o agente propôs isto (raciocínio curto). */
  rationale: z.string().optional(),
});
export type ContentDnaSuggestion = z.infer<typeof contentDnaSuggestionSchema>;

/** Conjunto de sugestões de uma execução de agente. */
export const contentDnaSuggestionSetSchema = z.object({
  clientId: z.string().min(1),
  agent: z.string().min(1),
  generatedAt: z.string().min(1),
  suggestions: z.array(contentDnaSuggestionSchema),
});
export type ContentDnaSuggestionSet = z.infer<
  typeof contentDnaSuggestionSetSchema
>;

/** Status de aprovação humana de um registro. */
export const dnaEntryStatusSchema = z.enum(["pending", "approved", "rejected"]);
export type DnaEntryStatus = z.infer<typeof dnaEntryStatusSchema>;

/**
 * Um registro persistido no Content DNA (após ingestão da sugestão).
 * Guarda estado, proveniência, status de aprovação e versão.
 */
export const contentDnaEntrySchema = contentDnaSuggestionSchema.extend({
  id: z.string().min(1),
  clientId: z.string().min(1),
  status: dnaEntryStatusSchema,
  version: z.number().int().positive(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  /** Valor anterior, preservado quando um registro é editado (sem overwrite silencioso). */
  previousValue: z.string().optional(),
  /** Nota de governança (ex.: "FACT rebaixado para HYPOTHESIS: sem proveniência"). */
  governanceNote: z.string().optional(),
});
export type ContentDnaEntry = z.infer<typeof contentDnaEntrySchema>;

/** Cadastro básico de cliente. */
export const clientSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  niche: z.string().optional(),
  createdAt: z.string().min(1),
});
export type ClientRecord = z.infer<typeof clientSchema>;

export type ClientInput = {
  id: string;
  name: string;
  niche?: string;
};
