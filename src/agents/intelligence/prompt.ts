import { RAW_INPUTS_BEGIN, RAW_INPUTS_END } from "../../core/llm/markers.js";
import { CONTENT_DNA_SECTION_LABELS, MEMORY_STATE_LABELS } from "../../core/schema.js";
import type { KnowledgeRef } from "../../core/knowledge/retriever.js";
import type { IntelligenceInput } from "./schema.js";

const AGENT_NAME = "Íris";

/**
 * Monta o prompt de Íris. O texto natural serve para um LLM real; o bloco
 * machine-readable serve para o provider mock. Ambos recebem as MESMAS entradas.
 */
export function buildIntelligencePrompt(
  input: IntelligenceInput,
  knowledge: KnowledgeRef[],
): { system: string; userContent: string } {
  const states = Object.entries(MEMORY_STATE_LABELS)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");
  const sections = Object.entries(CONTENT_DNA_SECTION_LABELS)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");
  const kb = knowledge.length
    ? knowledge.map((k) => `- ${k.title} (${k.path})`).join("\n")
    : "- (nenhum pilar recuperado)";

  const system = [
    `Você é ${AGENT_NAME}, o agente de Inteligência do Content OS.`,
    `Seu trabalho é ENTENDER profundamente o cliente e estruturar o Content DNA a partir do material fornecido.`,
    ``,
    `REGRAS INEGOCIÁVEIS:`,
    `1. NUNCA invente informações, fontes, números, resultados ou depoimentos.`,
    `2. Só afirme como FACT o que estiver declarado nas entradas, com proveniência (fonte).`,
    `3. Distinga claramente os estados de memória:`,
    states,
    `4. Toda sugestão carrega proveniência (fonte, data, agente, confiança).`,
    `5. Você apenas SUGERE — nada entra no Content DNA sem aprovação humana.`,
    ``,
    `SEÇÕES do Content DNA:`,
    sections,
    ``,
    `CONHECIMENTO METODOLÓGICO DISPONÍVEL (use como lente, não copie):`,
    kb,
    ``,
    `SAÍDA: responda SOMENTE com um JSON válido no formato:`,
    `{"clientId":string,"agent":"${AGENT_NAME}","generatedAt":ISOString,"suggestions":[{"section":<seção>,"field":string,"value":string,"state":<estado>,"confidence":0..1,"provenance":{"source":string,"date":string,"agent":"${AGENT_NAME}","confidence":0..1},"rationale":string}]}`,
  ].join("\n");

  const naturalInputs = input.rawInputs
    .map((r, i) => `(${i + 1}) [${r.type}] fonte: ${r.source}${r.date ? ` — ${r.date}` : ""}\n${r.content}`)
    .join("\n\n");

  const machineBlock =
    `${RAW_INPUTS_BEGIN}\n` +
    JSON.stringify({ clientId: input.clientId, agent: AGENT_NAME, rawInputs: input.rawInputs }) +
    `\n${RAW_INPUTS_END}`;

  const userContent = [
    input.focus ? `FOCO desta análise: ${input.focus}` : ``,
    `Estruture o Content DNA do cliente "${input.clientId}" a partir das entradas abaixo.`,
    ``,
    naturalInputs,
    ``,
    machineBlock,
  ]
    .filter(Boolean)
    .join("\n");

  return { system, userContent };
}
