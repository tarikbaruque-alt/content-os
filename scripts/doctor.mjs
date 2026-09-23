#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
loadEnvFile(join(rootDir, ".env"));

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail });
}

const [nodeMajor] = process.versions.node.split(".").map(Number);
check("Node.js >= 18", nodeMajor >= 18, `versão detectada: v${process.versions.node}`);

const apiKey = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN;
const credentialVar = process.env.ANTHROPIC_API_KEY
  ? "ANTHROPIC_API_KEY"
  : process.env.ANTHROPIC_AUTH_TOKEN
    ? "ANTHROPIC_AUTH_TOKEN"
    : null;

check(
  "Credencial Anthropic presente",
  Boolean(apiKey),
  credentialVar ? `usando ${credentialVar}` : "defina ANTHROPIC_API_KEY (ou ANTHROPIC_AUTH_TOKEN)"
);

if (apiKey) {
  const baseUrl = (process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com").replace(/\/$/, "");
  const headers = { "anthropic-version": "2023-06-01" };
  if (process.env.ANTHROPIC_API_KEY) headers["x-api-key"] = apiKey;
  else headers["authorization"] = `Bearer ${apiKey}`;

  try {
    const res = await fetch(`${baseUrl}/v1/models`, { headers });
    if (res.ok) {
      check("Credencial Anthropic funcionando", true, `API respondeu ${res.status} em ${baseUrl}`);
    } else if (res.status === 401 || res.status === 403) {
      check("Credencial Anthropic funcionando", false, `API rejeitou a credencial (HTTP ${res.status})`);
    } else {
      check("Credencial Anthropic funcionando", false, `resposta inesperada da API (HTTP ${res.status})`);
    }
  } catch (err) {
    check("Credencial Anthropic funcionando", false, `falha de conexão com ${baseUrl}: ${err.message}`);
  }
} else {
  check("Credencial Anthropic funcionando", false, "pulado — nenhuma credencial encontrada");
}

console.log("\ncontent-os doctor\n");
let allOk = true;
for (const { name, ok, detail } of results) {
  allOk &&= ok;
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
}
console.log();
console.log(allOk ? "Tudo certo!\n" : "Alguns itens precisam de atenção antes de continuar.\n");
process.exit(allOk ? 0 : 1);
