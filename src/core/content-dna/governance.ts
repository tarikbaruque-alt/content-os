import { randomUUID } from "node:crypto";
import { enforceProvenance } from "../guardrails/index.js";
import type { ContentDnaStore } from "./store.js";
import type {
  ContentDnaEntry,
  ContentDnaSuggestionSet,
} from "./types.js";

/**
 * Governança de memória do Content DNA.
 *
 * - Sugestões viram registros PENDENTES (nunca aprovados automaticamente).
 * - Guardrail de proveniência é aplicado na ingestão.
 * - APPROVE / EDIT / REJECT são ações humanas explícitas.
 * - Editar preserva o valor anterior (sem overwrite silencioso) e versiona.
 */

export type IngestResult = {
  entries: ContentDnaEntry[];
  downgraded: number;
};

export async function ingestSuggestions(
  store: ContentDnaStore,
  set: ContentDnaSuggestionSet,
): Promise<IngestResult> {
  const now = new Date().toISOString();
  const entries: ContentDnaEntry[] = [];
  let downgraded = 0;

  for (const raw of set.suggestions) {
    const check = enforceProvenance(raw);
    if (check.changed) downgraded += 1;
    entries.push({
      ...check.suggestion,
      id: randomUUID(),
      clientId: set.clientId,
      status: "pending",
      version: 1,
      createdAt: now,
      updatedAt: now,
      governanceNote: check.reason,
    });
  }

  await store.addEntries(entries);
  return { entries, downgraded };
}

export async function approveEntry(
  store: ContentDnaStore,
  id: string,
): Promise<ContentDnaEntry> {
  return store.updateEntry(id, { status: "approved" });
}

export async function rejectEntry(
  store: ContentDnaStore,
  id: string,
): Promise<ContentDnaEntry> {
  return store.updateEntry(id, { status: "rejected" });
}

/**
 * Edição humana: cria uma nova versão preservando o valor anterior.
 * Não é overwrite silencioso — é uma decisão registrada e rastreável.
 */
export async function editEntry(
  store: ContentDnaStore,
  id: string,
  newValue: string,
): Promise<ContentDnaEntry> {
  const current = await store.getEntry(id);
  if (!current) throw new Error(`Content DNA entry não encontrada: ${id}`);
  return store.updateEntry(id, {
    value: newValue,
    previousValue: current.value,
    version: current.version + 1,
    status: "approved",
  });
}
