import { describe, it, expect } from "vitest";
import { parseDotenv, loadDotenv } from "../../src/core/env.js";

describe("Carregador de .env (configure uma vez, fica conectado)", () => {
  it("parseia KEY=VALUE, ignora comentários e linhas vazias", () => {
    const raw = ["# comentário", "", "ANTHROPIC_API_KEY=sk-ant-123", "NOTION_DATABASE_ID = abc123 ", "  # outro", 'ANTHROPIC_MODEL="claude-sonnet-5"'].join("\n");
    const p = parseDotenv(raw);
    expect(p.ANTHROPIC_API_KEY).toBe("sk-ant-123");
    expect(p.NOTION_DATABASE_ID).toBe("abc123");
    expect(p.ANTHROPIC_MODEL).toBe("claude-sonnet-5"); // aspas removidas
    expect(Object.keys(p)).not.toContain("# comentário");
  });

  it("loadDotenv NÃO sobrescreve variáveis já definidas (ambiente vence)", () => {
    // arquivo inexistente → no-op, sem lançar
    const env: NodeJS.ProcessEnv = { NOTION_API_KEY: "já-definida" };
    loadDotenv("/caminho/inexistente/.env", env);
    expect(env.NOTION_API_KEY).toBe("já-definida");
  });
});
