import { describe, it, expect } from "vitest";
import { FORMATOS, FORMATO_BY_KEY, recommendFormat } from "../../src/pipeline/formats.js";
import { NICHE_PROFILES, GENERIC_PROFILE, buildFormatGuide, detectNiche, profileByKey } from "../../src/pipeline/niche-formats.js";
import { runPipeline } from "../../src/pipeline/run.js";
import { PIPELINE_CLIENTS } from "../../src/demo/pipeline-client.js";

describe("Musa — guia de formatos por nicho", () => {
  it("cada perfil só usa formatos da biblioteca, com mix de superfícies que soma 100", () => {
    for (const p of [...NICHE_PROFILES, GENERIC_PROFILE]) {
      expect(p.formatos.length).toBeGreaterThanOrEqual(4);
      expect(p.formatos[0]!.papel).toBe("Carro-chefe");
      for (const f of p.formatos) expect(FORMATO_BY_KEY.has(f.key), `${p.key}: ${f.key}`).toBe(true);
      for (const e of p.evitar) if (e.key) expect(FORMATO_BY_KEY.has(e.key), `${p.key}: ${e.key}`).toBe(true);
      expect(p.superficies.reduce((s, x) => s + x.pct, 0)).toBe(100);
      expect(p.cuidados.length).toBeGreaterThan(0);
    }
    expect(new Set(NICHE_PROFILES.map((p) => p.key)).size).toBe(NICHE_PROFILES.length);
  });

  it("identifica o nicho pelo texto, sem depender de acento", () => {
    expect(detectNiche(["Advocacia Trabalhista"]).profile.key).toBe("juridico");
    expect(detectNiche(["Fotografia de casamento"]).profile.key).toBe("eventos");
    expect(detectNiche(["Cosméticos naturais"]).profile.key).toBe("cosmeticos");
    expect(detectNiche(["nutricao esportiva"]).profile.key).toBe("nutricao_fitness");
    expect(detectNiche(["Clínica odontológica"]).profile.key).toBe("saude");
    expect(detectNiche(["Psicóloga — ansiedade"]).profile.key).toBe("psicologia");
  });

  it("radical casa no início da palavra (\"pet\" não casa com \"competição\")", () => {
    expect(detectNiche(["competição de dança"]).profile.key).toBe("generico");
    expect(detectNiche(["pet shop de bairro"]).profile.key).toBe("pet");
  });

  it("usa o primeiro texto que casar e cai no perfil geral quando nada casa", () => {
    const r = detectNiche([undefined, "", "Loja de roupas femininas", "Advocacia"]);
    expect(r.profile.key).toBe("moda");
    expect(r.from).toBe("Loja de roupas femininas");
    expect(detectNiche(["xyz"]).profile).toBe(GENERIC_PROFILE);
    expect(profileByKey("generico")).toBe(GENERIC_PROFILE);
  });

  it("o guia lista TODAS as opções da biblioteca, com o encaixe no nicho", () => {
    const g = buildFormatGuide(profileByKey("juridico")!, "Advocacia");
    expect(g.opcoes.length).toBe(FORMATOS.length);
    expect(g.opcoes[0]!.fit).toBe("Carro-chefe");
    const caseFit = g.opcoes.find((o) => o.key === "case")!;
    expect(caseFit.fit).toBe("Com cuidado");
    expect(caseFit.nota).toMatch(/OAB/);
    expect(g.formatos[0]!.nome).toBe("Talking Head");
    expect(g.generico).toBe(false);
    expect(g.aviso).toMatch(/Performance/);
  });

  it("recommendFormat escolhe, dentro da função, o formato que o nicho favorece", () => {
    const juridico = profileByKey("juridico")!;
    // Prova → Case por padrão; na advocacia, Case é "com cuidado" → vai para outra opção da função.
    expect(recommendFormat("Prova", "fundo").formato).toBe("Case / Estudo de Caso");
    expect(recommendFormat("Prova", "fundo", undefined, juridico).formato).toBe("Entrevista");
    // Conscientização na advocacia → Mito × Verdade (carro-chefe do nicho), com o porquê do nicho.
    const c = recommendFormat("Conscientização", "topo", undefined, juridico);
    expect(c.formato).toBe("Mito × Verdade");
    expect(c.justificativa).toContain("No nicho Advocacia & jurídico");
    // Desejo em moda → Provador.
    expect(recommendFormat("Desejo", "fundo", undefined, profileByKey("moda")!).formato).toBe("Provador / Look do Dia");
  });

  it("o pipeline entrega o guia do nicho de cada cliente-exemplo", async () => {
    const esperado: Record<string, string> = { aurora: "eventos", marina: "juridico", verde: "cosmeticos", rafa: "nutricao_fitness" };
    for (const c of PIPELINE_CLIENTS) {
      const r = await runPipeline(c, c.briefing, c.source, { total: 4, minIdeas: 15 });
      expect(r.formatGuide.nichoKey, c.id).toBe(esperado[c.id]);
      expect(r.formatGuide.detectadoPor.length).toBeGreaterThan(0);
    }
  });
});
