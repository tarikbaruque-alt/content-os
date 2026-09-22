import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import type { ContentDnaSection } from "../schema.js";
import type { ContentDnaStore } from "./store.js";
import {
  clientSchema,
  contentDnaEntrySchema,
  type ClientInput,
  type ClientRecord,
  type ContentDnaEntry,
} from "./types.js";
import { z } from "zod";

const clientFileSchema = z.object({
  client: clientSchema,
  entries: z.array(contentDnaEntrySchema),
});

/**
 * Adapter de arquivos: um JSON por cliente em {baseDir}/clients/{id}.json.
 * Mesmo contrato do InMemory — trocável por um banco depois.
 */
export class FileContentDnaStore implements ContentDnaStore {
  constructor(private readonly baseDir: string = process.env.CONTENT_OS_DATA_DIR ?? "./data") {}

  private clientPath(id: string): string {
    return join(this.baseDir, "clients", `${id}.json`);
  }

  private async readClientFile(id: string) {
    const path = this.clientPath(id);
    if (!existsSync(path)) return null;
    const raw = await readFile(path, "utf8");
    return clientFileSchema.parse(JSON.parse(raw));
  }

  private async writeClientFile(data: {
    client: ClientRecord;
    entries: ContentDnaEntry[];
  }) {
    const path = this.clientPath(data.client.id);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(data, null, 2), "utf8");
  }

  async upsertClient(input: ClientInput): Promise<ClientRecord> {
    const existing = await this.readClientFile(input.id);
    const record: ClientRecord = {
      id: input.id,
      name: input.name,
      niche: input.niche,
      createdAt: existing?.client.createdAt ?? new Date().toISOString(),
    };
    await this.writeClientFile({
      client: record,
      entries: existing?.entries ?? [],
    });
    return record;
  }

  async getClient(id: string): Promise<ClientRecord | null> {
    const file = await this.readClientFile(id);
    return file?.client ?? null;
  }

  async listClients(): Promise<ClientRecord[]> {
    const dir = join(this.baseDir, "clients");
    if (!existsSync(dir)) return [];
    const files = await readdir(dir);
    const clients: ClientRecord[] = [];
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      const file = await this.readClientFile(f.replace(/\.json$/, ""));
      if (file) clients.push(file.client);
    }
    return clients;
  }

  async addEntries(entries: ContentDnaEntry[]): Promise<void> {
    const byClient = new Map<string, ContentDnaEntry[]>();
    for (const e of entries) {
      const list = byClient.get(e.clientId) ?? [];
      list.push(e);
      byClient.set(e.clientId, list);
    }
    for (const [clientId, list] of byClient) {
      const file = await this.readClientFile(clientId);
      if (!file) throw new Error(`Cliente não cadastrado: ${clientId}`);
      await this.writeClientFile({
        client: file.client,
        entries: [...file.entries, ...list],
      });
    }
  }

  async getEntries(
    clientId: string,
    section?: ContentDnaSection,
  ): Promise<ContentDnaEntry[]> {
    const file = await this.readClientFile(clientId);
    if (!file) return [];
    return file.entries.filter((e) => !section || e.section === section);
  }

  async getEntry(id: string): Promise<ContentDnaEntry | null> {
    const clients = await this.listClients();
    for (const c of clients) {
      const file = await this.readClientFile(c.id);
      const found = file?.entries.find((e) => e.id === id);
      if (found) return found;
    }
    return null;
  }

  async updateEntry(
    id: string,
    patch: Partial<ContentDnaEntry>,
  ): Promise<ContentDnaEntry> {
    const clients = await this.listClients();
    for (const c of clients) {
      const file = await this.readClientFile(c.id);
      if (!file) continue;
      const idx = file.entries.findIndex((e) => e.id === id);
      if (idx >= 0) {
        const current = file.entries[idx]!;
        const updated: ContentDnaEntry = {
          ...current,
          ...patch,
          id: current.id,
          clientId: current.clientId,
          updatedAt: new Date().toISOString(),
        };
        file.entries[idx] = updated;
        await this.writeClientFile(file);
        return updated;
      }
    }
    throw new Error(`Content DNA entry não encontrada: ${id}`);
  }
}
