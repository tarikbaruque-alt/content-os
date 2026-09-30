import type { Claim, Lead, Operacao } from "./types.js";
import { extractNumericClaims, findBannedPhrases, findUnsupportedNumbers, validateOutbound } from "./guardrails.js";
import { norm } from "./context.js";

/** Doutrina para qualquer camada de IA desta ferramenta (o app usa `sample` do Claude do próprio usuário). */
export const PROSPECT_DOCTRINE = `Você é a IA de prospecção de uma pessoa que vende serviços de conteúdo (gestão de redes sociais, estratégia, planejamento, calendário editorial, criação, copywriting, roteiros, Reels, carrosséis, Stories, posicionamento, branding e consultoria de conteúdo) para negócios e profissionais no Instagram.
Você é consultiva, específica e honesta. Não é agressiva nem manipuladora.

REGRAS INEGOCIÁVEIS
1. NUNCA apresente hipótese como fato. Fato = o que está no texto fornecido. Interpretação = sempre com "pode", "talvez" ou "possível".
2. NUNCA invente cases, números, clientes, resultados, depoimentos, dores ou dados do prospect. Só use o que está no texto fornecido.
3. Toda afirmação precisa de uma evidência: um TRECHO EXATO copiado do texto fornecido.
4. NUNCA assuma que o prospect tem uma dor. Dores são hipóteses a investigar por pergunta.
5. A primeira mensagem NÃO vende: gera conversa. Estrutura: observação real + oportunidade + pergunta. Sem elogio genérico, sem promessa, sem falar de preço, pacote ou gestão de redes sociais.
6. Nunca venda quantidade ("12 posts por mês"). Venda valor: entregável → benefício → impacto → valor comercial.
7. Sem urgência ou escassez artificial. Sem garantia de resultado.`;

export function aiSourceText(lead: Lead): string {
  const p = lead.profile;
  return [p.bio ?? "", p.amostraTexto ?? "", ...p.notas.map((n) => n.texto), p.temaDominado ?? ""].filter(Boolean).join("\n");
}

export function buildAiRaioXPrompt(lead: Lead, op: Operacao): string {
  const p = lead.profile;
  const src = aiSourceText(lead);
  return `${PROSPECT_DOCTRINE}

TAREFA: analisar o perfil de Instagram abaixo (apenas o texto fornecido) e apontar observações, pontos fortes e possíveis gargalos de conteúdo.

PERFIL
- Nome: ${p.nome} (@${p.handle})
- Nicho: ${p.nicho}${p.cidade ? ` · ${p.cidade}` : ""}
- Tema que o perfil domina (informado): ${p.temaDominado ?? "não informado"}

TEXTO DISPONÍVEL (bio, legendas coladas e notas). É a ÚNICA fonte permitida:
"""
${src.slice(0, 12000) || "(vazio)"}
"""

Responda SOMENTE com JSON neste formato:
{"observacoes":[{"texto":"fato observável","evidencia":"trecho exato do texto"}],
 "pontosFortes":[{"texto":"o que já faz bem","evidencia":"trecho exato do texto"}],
 "gargalos":[{"texto":"possível gargalo, com 'pode' ou 'talvez'","evidencia":"trecho exato do texto"}]}
No máximo 4 itens por lista. Se o texto não sustentar um item, NÃO o inclua. Sem números que não estejam no texto.`;
}

export type AiRaioXResult = { observacoes: Claim[]; pontosFortes: Claim[]; gargalos: Claim[]; descartados: number; motivos: string[] };

const HEDGE = /\b(pode|podem|talvez|possível|possivel|parece|sugere)\b/i;
const squash = (s: string) => norm(s).replace(/\s+/g, " ");

/**
 * Valida a resposta da IA: descarta qualquer item cuja evidência NÃO seja um
 * trecho real do texto fornecido, ou que traga número/frase proibida. Gargalos
 * saem sempre como HIPOTESE, com linguagem de possibilidade.
 */
export function parseAiRaioX(data: unknown, source: string): AiRaioXResult {
  const out: AiRaioXResult = { observacoes: [], pontosFortes: [], gargalos: [], descartados: 0, motivos: [] };
  const src = squash(source);
  const d = (data ?? {}) as Record<string, unknown>;
  const take = (arr: unknown, kind: "observacoes" | "pontosFortes" | "gargalos") => {
    if (!Array.isArray(arr)) return;
    for (const raw of arr.slice(0, 4)) {
      const it = (raw ?? {}) as { texto?: unknown; evidencia?: unknown };
      const texto = typeof it.texto === "string" ? it.texto.trim() : "";
      const ev = typeof it.evidencia === "string" ? it.evidencia.trim() : "";
      const drop = (m: string) => { out.descartados++; out.motivos.push(m); };
      if (!texto || texto.length > 260) { drop("texto vazio ou longo demais"); continue; }
      if (ev.length < 8 || !src.includes(squash(ev))) { drop(`evidência não encontrada no texto: "${ev.slice(0, 50)}"`); continue; }
      if (findBannedPhrases(texto).length) { drop("frase proibida"); continue; }
      const nums = findUnsupportedNumbers(texto, [source]);
      if (nums.length) { drop(`número sem fonte: ${nums.join(", ")}`); continue; }
      if (kind === "gargalos") {
        out.gargalos.push({ texto: HEDGE.test(texto) ? texto : `Possível: ${texto}`, certeza: "HIPOTESE", evidencia: ev });
      } else {
        out[kind].push({ texto, certeza: "OBSERVADO", evidencia: ev });
      }
    }
  };
  take(d.observacoes, "observacoes");
  take(d.pontosFortes, "pontosFortes");
  take(d.gargalos, "gargalos");
  return out;
}

// ------------------------------------------------------- polir uma mensagem
export function buildPolishPrompt(message: string, anchors: string[]): string {
  return `${PROSPECT_DOCTRINE}

TAREFA: reescrever a mensagem abaixo para soar mais natural e humana, no mesmo tamanho ou menor.
PRESERVE exatamente estas âncoras (fatos reais do perfil): ${anchors.map((a) => `"${a}"`).join(", ") || "(nenhuma)"}.
NÃO acrescente fatos, números, elogios, promessas nem oferta de serviço. Mantenha a pergunta final.
Responda SOMENTE com o texto da mensagem.

MENSAGEM:
"""
${message}
"""`;
}

export function validatePolish(original: string, polished: string, op: Operacao, anchors: string[], primeiraMensagem: boolean): { ok: boolean; motivos: string[] } {
  const motivos: string[] = [];
  const t = polished.trim();
  if (!t) return { ok: false, motivos: ["resposta vazia"] };
  if (!t.includes("?")) motivos.push("perdeu a pergunta final");
  for (const a of anchors) if (a && !squash(t).includes(squash(a))) motivos.push(`perdeu a âncora "${a}"`);
  if (t.length > original.length * 1.5 + 40) motivos.push("ficou bem mais longa que a original");
  motivos.push(...validateOutbound(t, op, { primeiraMensagem, extraAllowed: [original] }));
  const novosNumeros = extractNumericClaims(t).filter((n) => !extractNumericClaims(original).includes(n));
  if (novosNumeros.length) motivos.push(`números novos: ${novosNumeros.join(", ")}`);
  return { ok: motivos.length === 0, motivos };
}
