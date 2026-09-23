import { readFileSync } from "node:fs";

/**
 * Carregador de .env sem dependências.
 *
 * "Configure uma vez, fique sempre conectado": os comandos do Content OS
 * chamam loadDotenv() no início, então basta ter um arquivo .env na raiz com
 * as chaves — elas são lidas automaticamente em toda execução, sem precisar
 * reexportar variáveis a cada vez.
 *
 * Regras: não sobrescreve variáveis já definidas no ambiente (o ambiente vence),
 * ignora comentários (#) e linhas vazias, e suporta valores entre aspas.
 */

export function parseDotenv(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    if (!key) continue;
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

/** Lê o .env (se existir) e preenche process.env só onde ainda não há valor. */
export function loadDotenv(path = ".env", env: NodeJS.ProcessEnv = process.env): void {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return; // sem .env: segue com o ambiente atual (ex.: credenciais do Claude Code web)
  }
  const parsed = parseDotenv(raw);
  for (const [k, v] of Object.entries(parsed)) {
    if (env[k] === undefined || env[k] === "") env[k] = v;
  }
}
