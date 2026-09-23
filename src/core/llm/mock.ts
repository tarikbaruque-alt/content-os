import type { LlmGenerateRequest, LlmGenerateResult, LlmProvider } from "./provider.js";
import { RAW_INPUTS_BEGIN, RAW_INPUTS_END } from "./markers.js";
import type { ContentDnaSection, MemoryState } from "../schema.js";
import type { ContentDnaSuggestion } from "../content-dna/types.js";

/**
 * Provider MOCK — determinístico e AUTO-LIMITADO ao conteúdo de entrada.
 *
 * Ele simula a extração que um LLM real faria, mas de forma controlada: só
 * produz sugestões ancoradas em trechos realmente presentes nas entradas.
 * Isso permite testar toda a arquitetura (schemas, estados, proveniência,
 * governança, guardrails) sem depender de chave de API e sem risco de
 * "invenção". Trocar por AnthropicLlmProvider não muda o contrato.
 */
export class MockLlmProvider implements LlmProvider {
  readonly name = "mock";

  async generate(req: LlmGenerateRequest): Promise<LlmGenerateResult> {
    const userContent = req.messages.map((m) => m.content).join("\n");
    const block = extractBlock(userContent);
    if (!block) {
      return { text: JSON.stringify({ clientId: "", agent: "mock", generatedAt: new Date().toISOString(), suggestions: [] }), provider: this.name };
    }
    const parsed = JSON.parse(block) as MockExtractionInput;
    const set = buildSuggestionSet(parsed);
    return {
      text: JSON.stringify(set),
      provider: this.name,
      model: "mock-extractor-v1",
      usage: { inputTokens: userContent.length, outputTokens: 0 },
    };
  }
}

type RawInput = { type: string; content: string; source: string; date?: string };
type MockExtractionInput = { clientId: string; agent: string; rawInputs: RawInput[] };

function extractBlock(text: string): string | null {
  const start = text.indexOf(RAW_INPUTS_BEGIN);
  const end = text.indexOf(RAW_INPUTS_END);
  if (start < 0 || end < 0 || end <= start) return null;
  return text.slice(start + RAW_INPUTS_BEGIN.length, end).trim();
}

type Rule = {
  test: RegExp;
  section: ContentDnaSection;
  field: string;
  state: MemoryState;
};

/** Regras de classificação. Ordem importa (mais específico primeiro). */
const RULES: Rule[] = [
  { test: /(acha|acham)\s+car[oa]|car[oa]\s+demais|n[ãa]o\s+confia|ser[áa]\s+que\s+funciona|desconfia|obje[çc]/i, section: "audience", field: "objecoes", state: "FACT" },
  { test: /p[úu]blico|persona|meu\s+cliente|clientes\s+s[ãa]o|atendo|avatar|faixa\s+et[áa]ria|mulheres|homens|donos?\s+de|empreendedor|m[ãa]es/i, section: "audience", field: "persona", state: "FACT" },
  { test: /\bdor(es)?\b|problema|dificuldade|sofre|cansad|frustra|n[ãa]o\s+consegue|luta\s+para|trava\b/i, section: "audience", field: "dores", state: "FACT" },
  { test: /deseja|desejo|quer(em)?\b|sonha|gostaria|almeja|busca(m)?\s+por|querendo/i, section: "audience", field: "desejos", state: "FACT" },
  { test: /diferencial|diferente\s+dos|s[óo]\s+n[óo]s|exclusiv|[úu]nic[oa]|nosso\s+m[ée]todo|o\s+que\s+nos\s+difere/i, section: "positioning", field: "diferenciais", state: "FACT" },
  { test: /posicion|concorrent|refer[êe]ncia|autoridade|prova\s+social|depoiment|resultado\s+comprov|\banos\s+de\b|pr[êe]mi/i, section: "positioning", field: "posicionamento", state: "FACT" },
  { test: /tom\s+de\s+voz|linguagem|fal(o|a|amos)\s+de\s+forma|evit(o|amos)|g[íi]ria|formal|informal|motivacional|nossa\s+comunica[çc][ãa]o|jeito\s+de\s+falar/i, section: "communication", field: "tom", state: "FACT" },
  { test: /decid(i|imos)|vamos\s+focar|nossa\s+estrat[ée]gia|resolvi|optamos\s+por/i, section: "strategic_memory", field: "decisao", state: "STRATEGIC_DECISION" },
  { test: /no\s+[úu]ltim[oa]|teve\s+mais|aumentou|engajou|reten[çc][ãa]o\s+de|\d+%\s|converteu|resultou\s+em|melhor\s+desempenho/i, section: "strategic_memory", field: "aprendizado", state: "LEARNING" },
  { test: /vend(o|emos)|produto|servi[çc]o|oferta|curso|mentoria|consultoria|loja|ticket|fatur(o|amos)|pre[çc]o|R\$|plano|assinatura|modelo\s+de\s+neg[óo]cio/i, section: "business", field: "oferta", state: "FACT" },
];

const CONFIDENCE: Record<MemoryState, number> = {
  FACT: 0.9,
  LEARNING: 0.8,
  STRATEGIC_DECISION: 0.9,
  INSIGHT: 0.55,
  HYPOTHESIS: 0.4,
};

function splitSegments(content: string): string[] {
  return content
    .split(/\n|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 4);
}

function extractQuotes(content: string): string[] {
  const matches = content.match(/["“”]([^"“”]{3,})["“”]/g) ?? [];
  return matches.map((m) => m.replace(/["“”]/g, "").trim());
}

export function buildSuggestionSet(input: MockExtractionInput) {
  const suggestions: ContentDnaSuggestion[] = [];
  const seen = new Set<string>();
  const today = new Date().toISOString().slice(0, 10);

  const push = (s: ContentDnaSuggestion) => {
    const key = `${s.section}|${s.field}|${s.value.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    suggestions.push(s);
  };

  const doresFound: string[] = [];
  const desejosFound: string[] = [];

  for (const raw of input.rawInputs) {
    const date = raw.date ?? today;

    // Voice of Customer: falas literais entre aspas = FACT (palavras reais).
    for (const quote of extractQuotes(raw.content)) {
      push({
        section: "voice_of_customer",
        field: "frase",
        value: quote,
        state: "FACT",
        confidence: CONFIDENCE.FACT,
        provenance: { source: raw.source, date, agent: input.agent, confidence: CONFIDENCE.FACT },
        rationale: "Fala literal do público/fonte",
      });
    }

    // Falas entre aspas já viram VoC; removê-las evita classificar o texto do
    // depoimento como fato de negócio (ex.: "vendo" de ver × vender).
    const quoteless = raw.content.replace(/["“”][^"“”]*["“”]/g, " ");
    for (const seg of splitSegments(quoteless)) {
      const rule = RULES.find((r) => r.test.test(seg));
      if (!rule) continue;
      // Refina o campo de business (ticket vs oferta).
      let field = rule.field;
      if (rule.section === "business" && /ticket|R\$|pre[çc]o|fatur/i.test(seg)) field = "ticket";
      if (rule.section === "business" && /modelo\s+de\s+neg[óo]cio/i.test(seg)) field = "modelo_negocio";

      push({
        section: rule.section,
        field,
        value: seg,
        state: rule.state,
        confidence: CONFIDENCE[rule.state],
        provenance: { source: raw.source, date, agent: input.agent, confidence: CONFIDENCE[rule.state] },
        rationale: `Classificado como ${rule.section}/${field}`,
      });

      if (rule.field === "dores") doresFound.push(seg);
      if (rule.field === "desejos") desejosFound.push(seg);
    }
  }

  // INSIGHT derivado: só combina informação JÁ presente (dor + desejo). Não é fato.
  if (doresFound.length > 0 && desejosFound.length > 0) {
    push({
      section: "strategic_memory",
      field: "insight",
      value: `Há tensão entre a dor ("${truncate(doresFound[0]!)}") e o desejo ("${truncate(desejosFound[0]!)}") — espaço para conteúdo que faça a ponte entre os dois.`,
      state: "INSIGHT",
      confidence: CONFIDENCE.INSIGHT,
      provenance: {
        source: `Íris — inferência a partir das entradas`,
        date: today,
        agent: input.agent,
        confidence: CONFIDENCE.INSIGHT,
      },
      rationale: "Derivado de dor + desejo presentes nas entradas (não é fato)",
    });
  }

  return {
    clientId: input.clientId,
    agent: input.agent,
    generatedAt: new Date().toISOString(),
    suggestions,
  };
}

function truncate(s: string, n = 60): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}
