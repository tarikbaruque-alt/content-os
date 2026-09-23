import { describe, it, expect } from "vitest";
import { mapWithConcurrency } from "../../src/core/concurrency.js";

describe("mapWithConcurrency", () => {
  it("processa todos os itens, na ordem certa, respeitando o resultado de cada um", async () => {
    const items = [1, 2, 3, 4, 5, 6, 7];
    const out = await mapWithConcurrency(items, 3, async (n) => {
      await new Promise((r) => setTimeout(r, Math.random() * 5));
      return n * 10;
    });
    expect(out).toEqual([10, 20, 30, 40, 50, 60, 70]);
  });

  it("nunca roda mais que `limit` chamadas ao mesmo tempo", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const items = Array.from({ length: 10 }, (_, i) => i);
    await mapWithConcurrency(items, 3, async (n) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight--;
      return n;
    });
    expect(maxInFlight).toBeLessThanOrEqual(3);
  });

  it("funciona com lista vazia", async () => {
    const out = await mapWithConcurrency([], 4, async (n: number) => n);
    expect(out).toEqual([]);
  });
});
