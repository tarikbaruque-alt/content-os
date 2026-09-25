/**
 * Monta o painel para publicar na web (Vercel), em dist/content-os-painel.
 *
 *   npm run build:web
 *
 * Com SUPABASE_URL e SUPABASE_ANON_KEY no ambiente (ou no .env.supabase.local),
 * injeta o cliente do Supabase e a configuração antes do script do painel: é
 * isso que liga o login, o banco e os agentes do servidor. Sem elas, o painel
 * sai igual à cópia offline (dados no navegador). A chave anon é pública por
 * natureza: quem protege os dados é a segurança por linha do banco.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

for (const f of [".env.supabase.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const l of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*(SUPABASE_URL|SUPABASE_ANON_KEY)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2]!;
  }
}
const OUT = "dist/content-os-painel";
let html = readFileSync("apps/web/index.html", "utf8");
const url = process.env.SUPABASE_URL, anon = process.env.SUPABASE_ANON_KEY;
if (url && anon) {
  const cfg = `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/dist/umd/supabase.js"></script>\n<script>window.COS_CONFIG=${JSON.stringify({ url, anonKey: anon })};</script>\n`;
  const i = html.indexOf("<script>");
  if (i < 0) throw new Error("não achei o <script> do painel");
  html = html.slice(0, i) + cfg + html.slice(i);
}
mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/index.html`, html);
writeFileSync(`${OUT}/vercel.json`, JSON.stringify({ headers: [{ source: "/(.*)", headers: [{ key: "X-Frame-Options", value: "DENY" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }] }] }, null, 2));
console.log(`✅ ${OUT}/index.html ${url && anon ? "(modo servidor: Supabase)" : "(modo offline)"}`);
