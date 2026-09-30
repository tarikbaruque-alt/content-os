import { describe, it, expect } from "vitest";
import {
  newLead, normalizeLead, normalizeOperacao, analyzeLead, analyzeRaioX, analyzeQualification, buildApproach, GARGALOS, VARIANT_COUNT,
  funnel, applyStatus, registerContact, dueState, followUps, addDays, daysBetween, cadenciaOf, DEFAULT_CADENCIA, buildDossier,
  validateOutbound, isRefusal, type Lead,
} from "../../src/prospect/index.js";
import { demoLead, DEMO_OP } from "../../src/demo/sample-prospect.js";

const op = normalizeOperacao(null);
const at = (s: string) => new Date(s + "T12:00:00");
const mk = (status: Lead["status"] = "novo"): Lead => ({ ...newLead("teste"), status });

describe("Datas e cadência", () => {
  it("soma e diferença de dias", () => {
    expect(addDays("2026-01-30", 3)).toBe("2026-02-02");
    expect(daysBetween("2026-01-01", "2026-01-04")).toBe(3);
    expect(cadenciaOf(op)).toEqual(DEFAULT_CADENCIA);
    expect(cadenciaOf({ ...op, cadenciaDias: [1, 3] })).toEqual([1, 3]);
  });
});

describe("Pipeline: status, contatos e atrasos", () => {
  it("abordar agenda o próximo contato e registra histórico", () => {
    const l = applyStatus(mk("raiox"), "abordado", op, at("2026-03-01"));
    expect(l.proximoContato).toBe("2026-03-03");
    expect(l.historico?.at(-1)?.status).toBe("abordado");
  });
  it("fechar ou perder remove o agendamento", () => {
    const l = applyStatus(applyStatus(mk("raiox"), "abordado", op, at("2026-03-01")), "perdido", op, at("2026-03-02"));
    expect(l.proximoContato).toBeUndefined();
  });
  it("cadência avança e esgota", () => {
    const l = applyStatus(mk("raiox"), "abordado", op, at("2026-03-01"));
    expect(registerContact(l, op, at("2026-03-03")).proximo).toBe("2026-03-08");
    expect(registerContact(l, op, at("2026-03-08")).proximo).toBe("2026-03-18");
    const r = registerContact(l, op, at("2026-03-18"));
    expect(r).toEqual({ proximo: null, esgotou: true });
    expect(l.proximoContato).toBeUndefined();
  });
  it("dueState: hoje, atrasado, futuro e encerrados", () => {
    const l = { ...mk("abordado"), proximoContato: "2026-03-05" };
    expect(dueState(l, "2026-03-05")).toEqual({ estado: "hoje", dias: 0 });
    expect(dueState(l, "2026-03-08")).toEqual({ estado: "atrasado", dias: 3 });
    expect(dueState(l, "2026-03-04")).toBeNull();
    expect(dueState({ ...l, status: "fechado" }, "2026-03-08")).toBeNull();
  });
});

describe("Funil", () => {
  it("conta quem alcançou cada etapa e só mostra % com base ≥ 5", () => {
    const few = funnel([mk("novo"), mk("abordado")]);
    expect(few.etapas.find((e) => e.etapa === "abordado")?.alcancaram).toBe(1);
    expect(few.etapas.find((e) => e.etapa === "abordado")?.daAnterior?.pct).toBeNull();
    const many = funnel([...Array(6)].map((_, i) => mk(i < 3 ? "conversa" : "novo")));
    expect(many.etapas.find((e) => e.etapa === "conversa")?.daAnterior?.pct).toBeNull(); // base 3 em "abordado"
    const base = funnel([...Array(10)].map((_, i) => mk(i < 5 ? "abordado" : "raiox")));
    expect(base.etapas.find((e) => e.etapa === "abordado")?.daAnterior).toEqual({ n: 5, d: 10, pct: 50 });
  });
  it("perdido preserva a etapa alcançada pelo histórico", () => {
    const l = applyStatus(applyStatus(mk("raiox"), "conversa", op), "perdido", op);
    expect(funnel([l]).perdidos).toBe(1);
    expect(funnel([l]).etapas.find((e) => e.etapa === "conversa")?.alcancaram).toBe(1);
  });
});

describe("Follow-ups e variantes respeitam os guardrails", () => {
  it("nenhuma retomada vende ou cria urgência", () => {
    const base = demoLead();
    for (const st of ["abordado", "conversa", "pitch", "negociacao"] as const) {
      const l = { ...base, status: st };
      const a = analyzeLead(l, DEMO_OP);
      const fu = followUps(l, a.raiox, a.qual, DEMO_OP);
      expect(fu.length).toBeGreaterThan(0);
      for (const f of fu) expect(f.avisos, f.texto).toEqual([]);
    }
  });
  it("a retomada acompanha o número de tentativas", () => {
    const base = { ...demoLead(), status: "abordado" as const };
    const a = analyzeLead(base, DEMO_OP);
    expect(followUps(base, a.raiox, a.qual, DEMO_OP)[0]!.rotulo).toBe("Retomada leve");
    const l2 = { ...base, historico: [{ quando: "x", evento: "contato" }, { quando: "y", evento: "contato" }] };
    expect(followUps(l2, a.raiox, a.qual, DEMO_OP)[0]!.rotulo).toBe("Encerrar com educação");
  });
  it("todo gargalo × variante passa na validação da 1ª mensagem e as variantes diferem", () => {
    const l = demoLead();
    const a = analyzeLead(l, DEMO_OP);
    let differ = 0;
    for (const g of GARGALOS) {
      const texts: string[] = [];
      for (let v = 0; v < VARIANT_COUNT; v++) {
        const ap = buildApproach(l, a.raiox, a.qual, DEMO_OP, { gargaloId: g.id, variante: v });
        if (isRefusal(ap)) continue;
        for (const x of ap.variantes) expect(validateOutbound(x.texto, DEMO_OP, { primeiraMensagem: true, extraAllowed: [l.profile.nome] }), `${g.id}/${v}: ${x.texto}`).toEqual([]);
        texts.push(ap.variantes[0]!.texto);
      }
      if (texts.length === 2 && texts[0] !== texts[1]) differ++;
    }
    expect(differ).toBeGreaterThan(0);
  });
});

describe("Resumo e normalização", () => {
  it("dossiê inclui o perfil e não inventa dados", () => {
    const l = demoLead();
    const t = buildDossier(l, analyzeLead(l, DEMO_OP), DEMO_OP);
    expect(t).toContain(l.profile.nome);
    expect(t.length).toBeGreaterThan(200);
  });
  it("normalizeLead preserva e valida os novos campos", () => {
    const l = normalizeLead({ ...mk("abordado"), proximoContato: "2026-03-05", motivoPerda: "preço", historico: [{ quando: "2026-03-01T00:00:00Z", evento: "contato" }, { lixo: 1 }] })!;
    expect(l.proximoContato).toBe("2026-03-05");
    expect(l.motivoPerda).toBe("preço");
    expect(l.historico).toHaveLength(1);
    expect(normalizeLead({ ...mk(), proximoContato: "ontem" })!.proximoContato).toBeUndefined();
    expect(normalizeOperacao({ cadenciaDias: [1, -2, "x", 4] }).cadenciaDias).toEqual([1, 4]);
  });
});
