import { describe, it, expect } from "vitest";
import { KnowledgeRetriever } from "../../src/core/knowledge/retriever.js";

describe("Acervo — recuperação da Knowledge Base", () => {
  it("recupera apenas pilares relevantes ao agente, não a KB inteira", async () => {
    const kb = new KnowledgeRetriever();
    const all = await kb.listPillars();
    const forIntelligence = await kb.retrieveForAgent("intelligence");

    // deve trazer algo relevante...
    expect(forIntelligence.length).toBeGreaterThan(0);
    expect(forIntelligence.some((r) => r.id === "estrategia-marca")).toBe(true);
    // ...mas NÃO tudo (recuperação seletiva)
    expect(forIntelligence.length).toBeLessThan(all.length);
    // e não traz o pilar de tráfego pago para Inteligência
    expect(forIntelligence.some((r) => r.id === "trafego-pago")).toBe(false);
  });
});
