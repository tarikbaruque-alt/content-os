import { enforceProvenance, findSourceInventions } from "../../core/guardrails/index.js";
import type { AgentContext, AgentRunner } from "../../core/orchestrator/types.js";
import { Trace } from "../../core/observability.js";
import type { ContentDnaSuggestion } from "../../core/content-dna/types.js";
import {
  intelligenceInputSchema,
  intelligenceOutputSchema,
  type IntelligenceInput,
  type IntelligenceOutput,
} from "./schema.js";
import { buildIntelligencePrompt } from "./prompt.js";

/**
 * Extrai o primeiro objeto JSON completo de um texto (LLMs podem envolver em
 * prosa). Conta profundidade de chaves — respeitando strings — em vez de só
 * pegar da primeira "{" até a última "}", que quebra se houver texto/chaves
 * depois do JSON (ou dá erro de parse confuso se a resposta veio truncada).
 */
function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  if (start < 0) throw new Error("Resposta do provider não contém JSON.");
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
    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) return JSON.parse(text.slice(start, i + 1));
    }
  }
  throw new Error("Resposta do provider não contém JSON completo — pode ter sido truncada (aumente maxTokens).");
}

/**
 * Íris — agente de Inteligência. Estrutura o Content DNA a partir do material
 * do cliente, aplica guardrails (proveniência + anti-invenção) e devolve
 * SUGESTÕES (que precisam de aprovação humana).
 */
export const runIntelligenceAgent: AgentRunner<IntelligenceInput, IntelligenceOutput> = async (
  rawInput,
  ctx: AgentContext,
  trace: Trace,
) => {
  const input = intelligenceInputSchema.parse(rawInput);
  trace.step("input.validated", { rawInputs: input.rawInputs.length });

  const knowledge = await ctx.knowledge.retrieveForAgent("intelligence");
  trace.step("knowledge.retrieved", { pillars: knowledge.map((k) => k.id) });

  const { system, userContent } = buildIntelligencePrompt(input, knowledge);
  const result = await ctx.llm.generate({
    system,
    messages: [{ role: "user", content: userContent }],
    temperature: 0,
    // Generoso de propósito: com pensamento adaptativo ligado (provider real),
    // o orçamento de tokens é compartilhado entre "pensar" e a saída em JSON —
    // pouco espaço aqui cortava o JSON no meio (era a causa do erro de parse).
    maxTokens: 8192,
  });
  trace.usage = result.usage;
  trace.step("llm.generated", { provider: result.provider, model: result.model });

  const parsed = intelligenceOutputSchema.parse(extractJson(result.text));
  trace.step("output.validated", { suggestions: parsed.suggestions.length });

  // --- Guardrails ---
  const warnings: string[] = [];
  const allowedSources = input.rawInputs.map((r) => r.source);

  // 1) Proveniência: FACT sem fonte é rebaixado para HYPOTHESIS.
  const provChecked: ContentDnaSuggestion[] = parsed.suggestions.map((s) => {
    const check = enforceProvenance(s);
    if (check.changed && check.reason) warnings.push(`${s.field}: ${check.reason}`);
    return check.suggestion;
  });

  // 2) Anti-invenção: FACT/LEARNING que citam fonte inexistente são removidos.
  const inventions = findSourceInventions(provChecked, allowedSources);
  const inventedIdx = new Set(inventions.map((v) => v.index));
  for (const v of inventions) warnings.push(`invenção evitada — ${v.field}: ${v.reason}`);
  const clean = provChecked.filter((_, i) => !inventedIdx.has(i));

  trace.step("guardrails.applied", {
    downgraded: warnings.filter((w) => w.includes("rebaixado")).length,
    inventionsRemoved: inventions.length,
  });

  const output: IntelligenceOutput = {
    clientId: input.clientId,
    agent: parsed.agent,
    generatedAt: parsed.generatedAt,
    suggestions: clean,
  };

  return { output, warnings, needsHumanApproval: true };
};
