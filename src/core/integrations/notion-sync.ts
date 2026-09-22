import type { NotionPage } from "../../pipeline/types.js";

/**
 * Integração REAL com o Notion (SyncTarget).
 *
 * Princípios inegociáveis:
 * - GUARDRAIL DE AÇÃO EXTERNA: nada é enviado ao Notion sem autorização
 *   explícita (authorize=true). Sem isso, o método sync() faz DRY-RUN e
 *   devolve o plano do que SERIA criado — nunca cria.
 * - SCHEMA-AWARE: primeiro lê o schema do database (GET) e só mapeia as
 *   propriedades que existem lá (title/rich_text/select/status/date),
 *   ignorando o resto. Não tenta criar propriedades nem inventar dados.
 * - Sem segredos no código: as credenciais vêm do ambiente.
 */

export type NotionSyncConfig = {
  apiKey: string;
  databaseId: string;
  baseUrl?: string;
  notionVersion?: string;
};

export type NotionPropSchema = { name: string; type: string; options: string[] };
export type NotionDbSchema = {
  id: string;
  titleProp: string;
  props: Record<string, NotionPropSchema>; // chave = nome da propriedade
};

export type MappedPage = {
  title: string;
  properties: Record<string, unknown>;
  children: unknown[];
  mappedKeys: string[];
  skippedKeys: string[];
};

export type SyncPlan = {
  databaseId: string;
  authorized: boolean;
  pages: MappedPage[];
  /** Propriedades do plano que não existem no schema do database. */
  unmatchedProps: string[];
};

export type SyncOutcome = {
  dryRun: boolean;
  plan: SyncPlan;
  created: { id: string; title: string; url?: string }[];
  errors: { title: string; error: string }[];
};

const DEFAULT_BASE = "https://api.notion.com";
const DEFAULT_VERSION = "2022-06-28";

/** Converte a resposta bruta do GET /v1/databases/{id} num schema tipado. */
export function parseDatabaseSchema(raw: unknown): NotionDbSchema {
  const r = raw as { id?: string; properties?: Record<string, { type?: string; select?: { options?: { name: string }[] }; status?: { options?: { name: string }[] } }> };
  const props: Record<string, NotionPropSchema> = {};
  let titleProp = "";
  for (const [name, def] of Object.entries(r.properties ?? {})) {
    const type = def?.type ?? "";
    if (type === "title") titleProp = name;
    const options =
      type === "select" ? def.select?.options?.map((o) => o.name) ?? [] : type === "status" ? def.status?.options?.map((o) => o.name) ?? [] : [];
    props[name] = { name, type, options };
  }
  return { id: r.id ?? "", titleProp, props };
}

function textProp(content: string) {
  return { rich_text: [{ type: "text", text: { content: content.slice(0, 2000) } }] };
}
function titleValue(content: string) {
  return { title: [{ type: "text", text: { content: content.slice(0, 2000) } }] };
}
const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

/** Mapeia uma NotionPage do pipeline para as propriedades do database, respeitando o schema. */
export function mapPage(page: NotionPage, schema: NotionDbSchema): MappedPage {
  const properties: Record<string, unknown> = {};
  const mappedKeys: string[] = [];
  const skippedKeys: string[] = [];

  // Título sempre vai para a propriedade "title" do database.
  if (schema.titleProp) {
    properties[schema.titleProp] = titleValue(page.title);
    mappedKeys.push(schema.titleProp);
  }

  const byLower = new Map(Object.keys(schema.props).map((k) => [k.toLowerCase(), k]));
  for (const [key, value] of Object.entries(page.properties)) {
    const realName = byLower.get(key.toLowerCase());
    if (!realName || realName === schema.titleProp) {
      skippedKeys.push(key);
      continue;
    }
    const def = schema.props[realName]!;
    switch (def.type) {
      case "rich_text":
        properties[realName] = textProp(value);
        mappedKeys.push(realName);
        break;
      case "select":
        properties[realName] = { select: { name: value } };
        mappedKeys.push(realName);
        break;
      case "status":
        properties[realName] = { status: { name: value } };
        mappedKeys.push(realName);
        break;
      case "date":
        if (ISO_DATE.test(value)) {
          properties[realName] = { date: { start: value } };
          mappedKeys.push(realName);
        } else {
          skippedKeys.push(key); // data não-ISO: não força
        }
        break;
      default:
        skippedKeys.push(key); // number/multi_select/etc.: fora do escopo seguro
    }
  }

  return { title: page.title, properties, children: buildChildren(page), mappedKeys, skippedKeys };
}

function paragraph(text: string) {
  return { object: "block", type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content: text.slice(0, 2000) } }] } };
}
function heading(text: string) {
  return { object: "block", type: "heading_3", heading_3: { rich_text: [{ type: "text", text: { content: text } }] } };
}
function bullet(text: string) {
  return { object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ type: "text", text: { content: text.slice(0, 2000) } }] } };
}

/** Corpo da página: a copy + a cadeia estratégica como bullets (rastreabilidade). */
export function buildChildren(page: NotionPage): unknown[] {
  const blocks: unknown[] = [];
  for (const line of page.bodyPreview.split("\n")) {
    if (line.trim()) blocks.push(paragraph(line.trim()));
  }
  blocks.push(heading("Cadeia estratégica"));
  for (const [k, v] of Object.entries(page.properties)) {
    blocks.push(bullet(`${k}: ${v}`));
  }
  return blocks;
}

export class NotionSyncTarget {
  readonly name = "notion";
  private readonly baseUrl: string;
  private readonly version: string;

  constructor(private readonly config: NotionSyncConfig) {
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE;
    this.version = config.notionVersion ?? DEFAULT_VERSION;
  }

  private headers() {
    return {
      Authorization: `Bearer ${this.config.apiKey}`,
      "Notion-Version": this.version,
      "content-type": "application/json",
    };
  }

  async fetchSchema(): Promise<NotionDbSchema> {
    const res = await fetch(`${this.baseUrl}/v1/databases/${this.config.databaseId}`, {
      method: "GET",
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`Notion schema error ${res.status}: ${await res.text()}`);
    return parseDatabaseSchema(await res.json());
  }

  /** Monta o plano (dry-run) sem tocar na rede de escrita. */
  buildPlan(pages: NotionPage[], schema: NotionDbSchema, authorized: boolean): SyncPlan {
    const mapped = pages.map((p) => mapPage(p, schema));
    const schemaNames = new Set(Object.keys(schema.props).map((s) => s.toLowerCase()));
    const unmatched = new Set<string>();
    for (const p of pages) {
      for (const k of Object.keys(p.properties)) {
        if (!schemaNames.has(k.toLowerCase())) unmatched.add(k);
      }
    }
    return { databaseId: this.config.databaseId, authorized, pages: mapped, unmatchedProps: [...unmatched] };
  }

  /**
   * Sincroniza. GUARDRAIL: sem authorize=true, NÃO cria nada — devolve o plano
   * como dry-run. Com authorize=true, cria uma página por peça.
   */
  async sync(pages: NotionPage[], opts: { authorize?: boolean } = {}): Promise<SyncOutcome> {
    const schema = await this.fetchSchema();
    const authorized = opts.authorize === true;
    const plan = this.buildPlan(pages, schema, authorized);
    if (!authorized) {
      return { dryRun: true, plan, created: [], errors: [] };
    }

    const created: SyncOutcome["created"] = [];
    const errors: SyncOutcome["errors"] = [];
    for (const mp of plan.pages) {
      try {
        const res = await fetch(`${this.baseUrl}/v1/pages`, {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify({
            parent: { database_id: this.config.databaseId },
            properties: mp.properties,
            children: mp.children,
          }),
        });
        if (!res.ok) {
          errors.push({ title: mp.title, error: `${res.status}: ${await res.text()}` });
          continue;
        }
        const data = (await res.json()) as { id: string; url?: string };
        created.push({ id: data.id, title: mp.title, ...(data.url ? { url: data.url } : {}) });
      } catch (e) {
        errors.push({ title: mp.title, error: e instanceof Error ? e.message : String(e) });
      }
    }
    return { dryRun: false, plan, created, errors };
  }
}

/** Cria o SyncTarget a partir do ambiente. Retorna null se faltar credencial. */
export function createNotionSyncFromEnv(env: NodeJS.ProcessEnv = process.env): NotionSyncTarget | null {
  const apiKey = env.NOTION_API_KEY;
  const databaseId = env.NOTION_DATABASE_ID;
  if (!apiKey || !databaseId) return null;
  return new NotionSyncTarget({
    apiKey,
    databaseId,
    ...(env.NOTION_BASE_URL ? { baseUrl: env.NOTION_BASE_URL } : {}),
    ...(env.NOTION_VERSION ? { notionVersion: env.NOTION_VERSION } : {}),
  });
}
