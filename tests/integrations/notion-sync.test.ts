import { describe, it, expect } from "vitest";
import {
  parseDatabaseSchema,
  mapPage,
  buildChildren,
  NotionSyncTarget,
} from "../../src/core/integrations/notion-sync.js";
import type { NotionPage } from "../../src/pipeline/types.js";

const RAW_DB = {
  id: "db_123",
  properties: {
    Nome: { type: "title" },
    Cliente: { type: "rich_text" },
    Plataforma: { type: "select", select: { options: [{ name: "Reel" }, { name: "Carrossel" }] } },
    Funil: { type: "select" },
    "Função estratégica": { type: "select" },
    Emoção: { type: "select" },
    CTA: { type: "rich_text" },
    Status: { type: "status", status: { options: [{ name: "PLANNED" }] } },
    Prazo: { type: "date" },
    Curtidas: { type: "number" }, // fora do escopo seguro → ignorado
  },
};

const PAGE: NotionPage = {
  title: "Se você sente medo de posar, isso é pra você.",
  properties: {
    Cliente: "Studio Aurora",
    Data: "Seg 01", // não existe no schema → unmatched
    Plataforma: "Reel",
    Funil: "topo",
    "Função estratégica": "Identificação",
    Emoção: "identificação",
    CTA: "Salvar + seguir",
    Status: "PLANNED",
    Prazo: "não-iso", // date type mas valor não-ISO → ignorado
  },
  bodyPreview: "Headline aqui\n\nCorpo da copy aqui.",
};

describe("Notion sync — mapeamento schema-aware (sem rede)", () => {
  const schema = parseDatabaseSchema(RAW_DB);

  it("identifica a propriedade title do database", () => {
    expect(schema.titleProp).toBe("Nome");
  });

  it("mapeia o título para a propriedade title, não para uma coluna qualquer", () => {
    const m = mapPage(PAGE, schema);
    expect(m.properties["Nome"]).toBeTruthy();
    expect((m.properties["Nome"] as { title: unknown[] }).title).toHaveLength(1);
  });

  it("mapeia select, status e rich_text pelos tipos do schema", () => {
    const m = mapPage(PAGE, schema);
    expect(m.properties["Plataforma"]).toEqual({ select: { name: "Reel" } });
    expect(m.properties["Status"]).toEqual({ status: { name: "PLANNED" } });
    expect(m.properties["CTA"]).toEqual({
      rich_text: [{ type: "text", text: { content: "Salvar + seguir" } }],
    });
  });

  it("ignora propriedades ausentes no schema e tipos fora do escopo", () => {
    const m = mapPage(PAGE, schema);
    expect(m.skippedKeys).toContain("Data"); // não existe no schema
    expect(m.skippedKeys).toContain("Prazo"); // date não-ISO
    expect(m.properties["Curtidas"]).toBeUndefined(); // number: nunca mapeado
  });

  it("gera blocos de corpo + cadeia estratégica", () => {
    const children = buildChildren(PAGE);
    expect(children.length).toBeGreaterThan(2);
    const hasHeading = children.some((c) => (c as { type: string }).type === "heading_3");
    expect(hasHeading).toBe(true);
  });

  it("GUARDRAIL: sync sem authorize é dry-run e não faz POST", async () => {
    let posted = false;
    const target = new NotionSyncTarget({ apiKey: "k", databaseId: "db_123" });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string, init?: { method?: string }) => {
      if (init?.method === "POST") posted = true;
      // Responde ao GET do schema com o database de exemplo.
      return { ok: true, json: async () => RAW_DB } as unknown as Response;
    }) as typeof fetch;
    try {
      const outcome = await target.sync([PAGE]); // sem { authorize: true }
      expect(outcome.dryRun).toBe(true);
      expect(outcome.created).toHaveLength(0);
      expect(posted).toBe(false); // nada foi enviado
      expect(outcome.plan.unmatchedProps).toContain("Data");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("com authorize=true, cria uma página por peça", async () => {
    const target = new NotionSyncTarget({ apiKey: "k", databaseId: "db_123" });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (_url: string, init?: { method?: string }) => {
      if (init?.method === "POST")
        return { ok: true, json: async () => ({ id: "page_1", url: "https://notion.so/page_1" }) } as unknown as Response;
      return { ok: true, json: async () => RAW_DB } as unknown as Response;
    }) as typeof fetch;
    try {
      const outcome = await target.sync([PAGE], { authorize: true });
      expect(outcome.dryRun).toBe(false);
      expect(outcome.created).toHaveLength(1);
      expect(outcome.created[0]!.url).toContain("notion.so");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
