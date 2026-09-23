import { describe, it, expect } from "vitest";
import { MockLlmProvider } from "../../src/core/llm/mock.js";
import { KnowledgeRetriever } from "../../src/core/knowledge/retriever.js";
import { InMemoryContentDnaStore } from "../../src/core/content-dna/store.js";
import { Trace } from "../../src/core/observability.js";
import { runIntelligenceAgent } from "../../src/agents/intelligence/agent.js";
import type { IntelligenceInput } from "../../src/agents/intelligence/schema.js";
import { SAMPLE_CLIENTS } from "../../src/demo/sample-clients.js";

function ctx() {
  return {
    llm: new MockLlmProvider(),
    knowledge: new KnowledgeRetriever(),
    store: new InMemoryContentDnaStore(),
  };
}

async function run(input: IntelligenceInput) {
  const trace = new Trace("Íris", input.clientId);
  return runIntelligenceAgent(input, ctx(), trace);
}

const clientA = SAMPLE_CLIENTS[0]!;
const clientB = SAMPLE_CLIENTS[1]!; // sem preço/ticket
const clientC = SAMPLE_CLIENTS[2]!;

describe("Íris — agente de Inteligência", () => {
  it("estrutura as dimensões principais do cliente", async () => {
    const { output } = await run(clientA.input);
    const sections = new Set<string>(output.suggestions.map((s) => s.section));
    for (const s of ["business", "audience", "voice_of_customer", "positioning", "communication", "strategic_memory"]) {
      expect(sections.has(s), `faltou seção ${s}`).toBe(true);
    }
    const audienceFields = new Set(
      output.suggestions.filter((s) => s.section === "audience").map((s) => s.field),
    );
    for (const f of ["persona", "dores", "desejos", "objecoes"]) {
      expect(audienceFields.has(f), `faltou audience/${f}`).toBe(true);
    }
  });

  it("distingue os estados de memória (FACT, STRATEGIC_DECISION, LEARNING, INSIGHT)", async () => {
    const { output } = await run(clientA.input);
    const states = new Set(output.suggestions.map((s) => s.state));
    expect(states.has("FACT")).toBe(true);
    expect(states.has("STRATEGIC_DECISION")).toBe(true);
    expect(states.has("LEARNING")).toBe(true);
    expect(states.has("INSIGHT")).toBe(true);
  });

  it("todo FACT/LEARNING tem proveniência real vinda das entradas", async () => {
    const { output } = await run(clientA.input);
    const allowed = new Set(clientA.input.rawInputs.map((r) => r.source));
    for (const s of output.suggestions) {
      if (s.state === "FACT" || s.state === "LEARNING") {
        expect(s.provenance.source.length).toBeGreaterThan(0);
        expect(allowed.has(s.provenance.source), `fonte inesperada: ${s.provenance.source}`).toBe(true);
      }
    }
  });

  it("NÃO inventa: cliente sem preço não gera FACT de ticket", async () => {
    const { output } = await run(clientB.input);
    const hasTicket = output.suggestions.some((s) => s.field === "ticket");
    expect(hasTicket).toBe(false);
    // ainda assim entende o negócio (loja/produto) por outra via
    expect(output.suggestions.some((s) => s.section === "business")).toBe(true);
  });

  it("NÃO contamina informação entre clientes", async () => {
    const a = await run(clientA.input);
    const b = await run(clientB.input);
    const aText = a.output.suggestions.map((s) => s.value.toLowerCase()).join(" | ");
    const bText = b.output.suggestions.map((s) => s.value.toLowerCase()).join(" | ");
    expect(bText.includes("reforma trabalhista")).toBe(false); // exclusivo do A
    expect(aText.includes("compostáveis")).toBe(false); // exclusivo do B
  });

  it("cobre o terceiro cliente e sempre exige aprovação humana", async () => {
    const { output, needsHumanApproval } = await run(clientC.input);
    expect(needsHumanApproval).toBe(true);
    expect(output.suggestions.length).toBeGreaterThan(5);
    expect(output.suggestions.some((s) => s.field === "ticket")).toBe(true); // R$ 400/mês
  });
});
