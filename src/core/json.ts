/**
 * Extrai o primeiro objeto JSON completo de um texto (LLMs podem envolver em
 * prosa ou cercas de markdown). Conta profundidade de chaves — respeitando
 * strings — em vez de pegar da primeira "{" até a última "}", que quebra se
 * a resposta trouxer texto/chaves depois do JSON ou vier truncada (nesse
 * caso o "}" mais à direita pertence a um objeto interno, não ao externo,
 * e o parse falha silenciosamente).
 */
export function extractJsonBlock(text: string): string | null {
  const start = text.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}
