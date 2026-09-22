import type { LlmProvider } from "../../core/llm/provider.js";
import { produceContent } from "../../pipeline/stages.js";
import type { CreativeContext } from "./context.js";
import type { Idea, ProducedContent, RoteiroStep } from "../../pipeline/types.js";

/**
 * Rima — a escritora criativa do Content OS.
 *
 * Quando há um provider REAL (não-mock), ela transforma a ideia + o Content DNA
 * do cliente em conteúdo pronto para publicar (headline, roteiro/copy, CTA,
 * gatilhos, emoção estratégica e direção visual) — mantendo TODOS os guardrails:
 * nunca inventa dados, provas, números, depoimentos, autoridade, urgência ou
 * escassez; escreve só a partir do que está no DNA.
 *
 * Se o provider for mock, ou a resposta vier inválida, cai no produtor
 * determinístico (produceContent) — o pipeline nunca quebra.
 */

const SYSTEM = `Você é Rima, redatora-chefe de um sistema de estratégia de conteúdo.
Escreve em português do Brasil, para redes sociais, com voz humana e específica.

REGRAS INEGOCIÁVEIS (guardrails):
- NUNCA invente dados, fontes, tendências, métricas, provas, depoimentos, resultados, números, autoridade, urgência ou escassez.
- Use SOMENTE o que está no Content DNA fornecido. Se algo não está no DNA, não afirme.
- Escreva prosa publicável de verdade — não rótulos, não placeholders, não "[inserir aqui]".
- A emoção é uma DECISÃO estratégica: escolha uma emoção coerente com persona + Big Message + objetivo + jornada + posicionamento e explique por quê.
- Teste do concorrente: se um concorrente pudesse publicar o mesmo texto só trocando o nome, aprofunde no que é específico deste cliente.

Responda SOMENTE com um objeto JSON válido (sem markdown, sem cercas), no formato:
{
  "headline": string,
  "roteiro": [{"label": string, "text": string}],
  "copy": string,
  "copyCurta": string,
  "copyMedia": string,
  "copyLonga": string,
  "cta": string,
  "gatilhos": [string],
  "recursos": [string],
  "emocao": string,
  "emocaoPor": string,
  "direcaoVisual": string
}
As três versões de copy (curta/média/longa) devem manter coerência estratégica e ter Hook + desenvolvimento + CTA.
Para Carrossel use "roteiro" como a sequência de slides; para Stories, a sequência de stories.`;

export function buildWriterPrompt(idea: Idea, ctx: CreativeContext): string {
  const v = ctx.view;
  const strategy = ctx.strategy;
  const list = (xs: string[]) => (xs.length ? xs.map((x) => `- ${x}`).join("\n") : "- (não informado)");
  return [
    `CLIENTE — CONTENT DNA (única fonte de verdade):`,
    `Persona: ${v.persona || "(não informado)"}`,
    `Tom de voz: ${v.tom || "(não informado)"}`,
    `Dores:\n${list(v.dores)}`,
    `Desejos:\n${list(v.desejos)}`,
    `Objeções:\n${list(v.objecoes)}`,
    `Diferenciais:\n${list(v.diferenciais)}`,
    `Posicionamento:\n${list(v.posicionamento)}`,
    `Vocabulário do cliente (VoC):\n${list(v.voc)}`,
    ``,
    `ESTRATÉGIA:`,
    `Big Message: ${strategy.bigMessage}`,
    `Percepção-alvo: ${strategy.percepcao}`,
    ``,
    `PEÇA A ESCREVER:`,
    `Superfície/Formato: ${idea.surface} — ${idea.format}`,
    `Função estratégica: ${idea.funcao} (funil: ${idea.funil}, jornada: ${idea.jornada})`,
    `Objetivo: ${idea.objetivo}`,
    `Dor/Desejo desta peça: ${idea.dorDesejo}`,
    `Ângulo: ${idea.angulo}`,
    `Emoção sugerida (pode refinar, mas justifique): ${idea.emocao}`,
    `Hook de partida: ${idea.hook}`,
    `CTA base: ${idea.cta}`,
    ``,
    `Escreva a peça completa em JSON conforme o formato pedido.`,
  ].join("\n");
}

type WriterJson = {
  headline?: unknown;
  roteiro?: unknown;
  copy?: unknown;
  copyCurta?: unknown;
  copyMedia?: unknown;
  copyLonga?: unknown;
  cta?: unknown;
  gatilhos?: unknown;
  recursos?: unknown;
  emocao?: unknown;
  emocaoPor?: unknown;
  direcaoVisual?: unknown;
};

function asSteps(x: unknown): RoteiroStep[] | undefined {
  if (!Array.isArray(x)) return undefined;
  const steps = x
    .map((s) => {
      if (s && typeof s === "object") {
        const o = s as Record<string, unknown>;
        const label = typeof o.label === "string" ? o.label : "";
        const text = typeof o.text === "string" ? o.text : "";
        if (text) return { label: label || "—", text };
      }
      if (typeof s === "string" && s.trim()) return { label: "—", text: s.trim() };
      return null;
    })
    .filter((s): s is RoteiroStep => s !== null);
  return steps.length ? steps : undefined;
}

function asStrings(x: unknown): string[] | undefined {
  if (!Array.isArray(x)) return undefined;
  const out = x.filter((s): s is string => typeof s === "string" && s.trim().length > 0);
  return out.length ? out : undefined;
}

/** Extrai o primeiro objeto JSON do texto (tolerante a cercas/ruído). */
export function extractJson(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

/**
 * Valida a resposta do LLM e monta um ProducedContent, preenchendo com o
 * fallback determinístico o que vier faltando. Retorna null se a resposta
 * não tiver o mínimo (headline + copy).
 */
export function parseWriterJson(
  text: string,
  idea: Idea,
  fallback: ProducedContent,
): ProducedContent | null {
  const block = extractJson(text);
  if (!block) return null;
  let parsed: WriterJson;
  try {
    parsed = JSON.parse(block) as WriterJson;
  } catch {
    return null;
  }
  const headline = typeof parsed.headline === "string" && parsed.headline.trim() ? parsed.headline.trim() : "";
  const copy = typeof parsed.copy === "string" && parsed.copy.trim() ? parsed.copy.trim() : "";
  if (!headline || copy.length < 10) return null;

  const str = (x: unknown): string => (typeof x === "string" && x.trim() ? x.trim() : "");
  const steps = asSteps(parsed.roteiro);
  const content: ProducedContent = {
    ideaId: idea.id,
    headline,
    kind: fallback.kind,
    copy,
    // Variantes: usa as do LLM quando vierem; senão mantém as determinísticas.
    copyVariants: {
      curta: str(parsed.copyCurta) || fallback.copyVariants.curta,
      media: str(parsed.copyMedia) || copy || fallback.copyVariants.media,
      longa: str(parsed.copyLonga) || fallback.copyVariants.longa,
    },
    cta: typeof parsed.cta === "string" && parsed.cta.trim() ? parsed.cta.trim() : fallback.cta,
    gatilhos: asStrings(parsed.gatilhos) ?? fallback.gatilhos,
    recursos: asStrings(parsed.recursos) ?? fallback.recursos,
    // Recomendações estruturadas (com porquê) vêm sempre do motor determinístico.
    gatilhosRec: fallback.gatilhosRec,
    elementosRec: fallback.elementosRec,
    emocao: typeof parsed.emocao === "string" && parsed.emocao.trim() ? parsed.emocao.trim() : fallback.emocao,
    emocaoPor:
      typeof parsed.emocaoPor === "string" && parsed.emocaoPor.trim() ? parsed.emocaoPor.trim() : fallback.emocaoPor,
    direcaoVisual:
      typeof parsed.direcaoVisual === "string" && parsed.direcaoVisual.trim()
        ? parsed.direcaoVisual.trim()
        : fallback.direcaoVisual,
  };
  // Encaixa a sequência no campo certo por tipo de peça.
  if (steps) {
    if (content.kind === "reel" || content.kind === "outro") content.roteiro = steps;
    else if (content.kind === "carrossel") content.slides = steps;
    else if (content.kind === "stories") content.stories = steps;
  } else {
    content.roteiro = fallback.roteiro;
    content.slides = fallback.slides;
    content.stories = fallback.stories;
  }
  return content;
}

/**
 * Produz conteúdo para uma ideia usando o LLM real; cai no determinístico
 * em qualquer falha (provider mock, erro de rede, JSON inválido, guardrail).
 */
export async function writeContent(
  idea: Idea,
  ctx: CreativeContext,
  llm: LlmProvider,
): Promise<ProducedContent> {
  const fallback = produceContent(idea, ctx.dna, ctx);
  if (llm.name === "mock") return fallback;
  try {
    const res = await llm.generate({
      system: SYSTEM,
      messages: [{ role: "user", content: buildWriterPrompt(idea, ctx) }],
      maxTokens: 2200,
    });
    const parsed = parseWriterJson(res.text, idea, fallback);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}
