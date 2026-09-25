/**
 * Briefing por link: o cliente responde sem login. Tudo o que chega daqui é
 * texto de um visitante anônimo, então entra limpo e com teto: só chaves
 * simples, só texto, tamanho limitado, e poucas respostas por link por dia.
 */
export const MAX_CAMPOS = 60;
export const MAX_TEXTO = 6000;
export const MAX_POR_DIA = 10;

export function limparRespostas(entrada: unknown): Record<string, string> | null {
  if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) return null;
  const out: Record<string, string> = {};
  let n = 0;
  for (const [k, v] of Object.entries(entrada as Record<string, unknown>)) {
    if (!/^[a-z][a-z0-9_]{0,39}$/i.test(k)) continue;
    if (typeof v !== "string" && typeof v !== "number") continue;
    const t = String(v).replace(/\u0000/g, "").trim().slice(0, MAX_TEXTO);
    if (!t) continue;
    out[k] = t;
    if (++n >= MAX_CAMPOS) break;
  }
  // Sem o nome da empresa não dá para criar o cliente.
  return out.name ? out : null;
}

export const tokenValido = (t: unknown): t is string => typeof t === "string" && /^[0-9a-f]{32}$/.test(t);
