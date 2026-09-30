import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildProspect } from "../../src/demo/build-prospect.js";

const ROOT = join(__dirname, "..", "..");

describe("Mesa de Prospecção — app publicado", () => {
  it("apps/prospect/index.html e app.html estão em sincronia com o código-fonte (rode: npm run prospect:build)", async () => {
    const { fragment, standalone } = await buildProspect();
    expect(readFileSync(join(ROOT, "apps/prospect/index.html"), "utf8")).toBe(fragment);
    expect(readFileSync(join(ROOT, "apps/prospect/app.html"), "utf8")).toBe(standalone);
  });

  it("scripts do app têm sintaxe válida e o fragmento segue as regras do Artifact", async () => {
    const { fragment } = await buildProspect();
    const scripts = [...fragment.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]!);
    expect(scripts.length).toBe(2);
    for (const s of scripts) expect(() => new Function(s)).not.toThrow();
    expect(fragment).toMatch(/^<title>Mesa de Prospecção<\/title>/);
    expect(fragment).not.toMatch(/<!doctype|<html[\s>]|<head[\s>]|<body[\s>]/i); // o envelope é adicionado na publicação
    // só fontes do Google; nenhum outro recurso externo
    const ext = [...fragment.matchAll(/(?:src|href)="(https?:[^"]+)"/g)].map((m) => new URL(m[1]!).host);
    expect([...new Set(ext)].sort()).toEqual(["fonts.googleapis.com", "fonts.gstatic.com"]);
    expect(fragment.length).toBeLessThan(2 * 1024 * 1024);
  });

  it("todas as cores vêm de tokens e há tema claro e escuro", async () => {
    const css = readFileSync(join(ROOT, "apps/prospect/src/10-styles.css"), "utf8");
    expect(css).toMatch(/:root\s*\{[^}]*--bg:/);
    expect(css).toMatch(/prefers-color-scheme: dark/);
    expect(css).toMatch(/:root\[data-theme="dark"\]/);
    expect(css).toMatch(/body\s*\{[^}]*background: var\(--bg\)/);
  });

  it("nenhuma tela chama IA fora da validação (sample só via aiRaioX/aiPolish)", () => {
    const ui = ["30-core.js", "40-views-main.js", "41-views-lead.js", "90-boot.js"].map((f) => readFileSync(join(ROOT, "apps/prospect/src", f), "utf8")).join("\n");
    const calls = ui.match(/sampleFn(\.json)?\(/g) ?? [];
    expect(calls.length).toBe(2);
    expect(ui).toMatch(/E\.parseAiRaioX\(/);
    expect(ui).toMatch(/E\.validatePolish\(/);
  });
});
