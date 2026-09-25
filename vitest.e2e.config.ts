import { defineConfig } from "vitest/config";

// Ponta a ponta do painel num navegador real (mais lento; fora do `npm test`).
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/e2e/**/*.e2e.ts"],
    fileParallelism: false,
  },
});
