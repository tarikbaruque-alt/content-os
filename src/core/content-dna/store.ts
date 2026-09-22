import type { ContentDnaSection } from "../schema.js";
import type {
  ClientInput,
  ClientRecord,
  ContentDnaEntry,
} from "./types.js";

/**
 * Contrato de persistência do Content DNA. É uma abstração: hoje há um adapter
 * em memória (testes) e outro em arquivos JSON (runtime local). Amanhã pode ser
 * Postgres, sem mudar os agentes.
 */
export interface ContentDnaStore {
  upsertClient(input: ClientInput): Promise<ClientRecord>;
  getClient(id: string): Promise<ClientRecord | null>;
  listClients(): Promise<ClientRecord[]>;

  addEntries(entries: ContentDnaEntry[]): Promise<void>;
  getEntries(
    clientId: string,
    section?: ContentDnaSection,
  ): Promise<ContentDnaEntry[]>;
  getEntry(id: string): Promise<ContentDnaEntry | null>;
  updateEntry(
    id: string,
    patch: Partial<ContentDnaEntry>,
  ): Promise<ContentDnaEntry>;
}

/** Adapter em memória — determinístico, ideal para testes. */
export class InMemoryContentDnaStore implements ContentDnaStore {
  private clients = new Map<string, ClientRecord>();
  private entries = new Map<string, ContentDnaEntry>();

  async upsertClient(input: ClientInput): Promise<ClientRecord> {
    const existing = this.clients.get(input.id);
    const record: ClientRecord = {
      id: input.id,
      name: input.name,
      niche: input.niche,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    this.clients.set(input.id, record);
    return record;
  }

  async getClient(id: string): Promise<ClientRecord | null> {
    return this.clients.get(id) ?? null;
  }

  async listClients(): Promise<ClientRecord[]> {
    return [...this.clients.values()];
  }

  async addEntries(entries: ContentDnaEntry[]): Promise<void> {
    for (const entry of entries) this.entries.set(entry.id, entry);
  }

  async getEntries(
    clientId: string,
    section?: ContentDnaSection,
  ): Promise<ContentDnaEntry[]> {
    return [...this.entries.values()].filter(
      (e) => e.clientId === clientId && (!section || e.section === section),
    );
  }

  async getEntry(id: string): Promise<ContentDnaEntry | null> {
    return this.entries.get(id) ?? null;
  }

  async updateEntry(
    id: string,
    patch: Partial<ContentDnaEntry>,
  ): Promise<ContentDnaEntry> {
    const current = this.entries.get(id);
    if (!current) throw new Error(`Content DNA entry não encontrada: ${id}`);
    const updated: ContentDnaEntry = {
      ...current,
      ...patch,
      id: current.id,
      clientId: current.clientId,
      updatedAt: new Date().toISOString(),
    };
    this.entries.set(id, updated);
    return updated;
  }
}
