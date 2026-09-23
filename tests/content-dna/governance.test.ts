import { describe, it, expect } from "vitest";
import { InMemoryContentDnaStore } from "../../src/core/content-dna/store.js";
import {
  ingestSuggestions,
  approveEntry,
  rejectEntry,
  editEntry,
} from "../../src/core/content-dna/governance.js";
import type { ContentDnaSuggestionSet } from "../../src/core/content-dna/types.js";

function setWith(sourceOfFirst: string): ContentDnaSuggestionSet {
  return {
    clientId: "c1",
    agent: "Íris",
    generatedAt: new Date().toISOString(),
    suggestions: [
      {
        section: "business",
        field: "ticket",
        value: "Ticket médio R$ 3.500",
        state: "FACT",
        confidence: 0.9,
        provenance: { source: sourceOfFirst, date: "2026-03-10", agent: "Íris", confidence: 0.9 },
      },
      {
        section: "audience",
        field: "persona",
        value: "Trabalhadores CLT demitidos",
        state: "FACT",
        confidence: 0.9,
        provenance: { source: "Entrevista", date: "2026-03-10", agent: "Íris", confidence: 0.9 },
      },
    ],
  };
}

describe("Governança do Content DNA", () => {
  it("ingere sugestões como PENDENTES (nunca aprovadas automaticamente)", async () => {
    const store = new InMemoryContentDnaStore();
    await store.upsertClient({ id: "c1", name: "Cliente 1" });
    const { entries } = await ingestSuggestions(store, setWith("Entrevista"));
    expect(entries.length).toBe(2);
    expect(entries.every((e) => e.status === "pending")).toBe(true);
    expect(entries.every((e) => e.version === 1)).toBe(true);
  });

  it("rebaixa FACT sem proveniência para HYPOTHESIS (não descarta, não promove)", async () => {
    const store = new InMemoryContentDnaStore();
    await store.upsertClient({ id: "c1", name: "Cliente 1" });
    const { entries, downgraded } = await ingestSuggestions(store, setWith(""));
    expect(downgraded).toBe(1);
    const ticket = entries.find((e) => e.field === "ticket")!;
    expect(ticket.state).toBe("HYPOTHESIS");
    expect(ticket.governanceNote).toContain("rebaixado");
  });

  it("APPROVE / REJECT mudam o status explicitamente", async () => {
    const store = new InMemoryContentDnaStore();
    await store.upsertClient({ id: "c1", name: "Cliente 1" });
    const { entries } = await ingestSuggestions(store, setWith("Entrevista"));
    const approved = await approveEntry(store, entries[0]!.id);
    const rejected = await rejectEntry(store, entries[1]!.id);
    expect(approved.status).toBe("approved");
    expect(rejected.status).toBe("rejected");
  });

  it("EDIT versiona e preserva o valor anterior (sem overwrite silencioso)", async () => {
    const store = new InMemoryContentDnaStore();
    await store.upsertClient({ id: "c1", name: "Cliente 1" });
    const { entries } = await ingestSuggestions(store, setWith("Entrevista"));
    const edited = await editEntry(store, entries[0]!.id, "Ticket médio R$ 4.000");
    expect(edited.value).toBe("Ticket médio R$ 4.000");
    expect(edited.previousValue).toBe("Ticket médio R$ 3.500");
    expect(edited.version).toBe(2);
  });
});
