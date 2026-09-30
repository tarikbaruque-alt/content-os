import { describe, it, expect } from "vitest";
import {
  NICHES, DIMENSOES, PAINS, HEADER_PARTS, SERVICES, ARGUMENTS, GARGALOS, OBJECTIONS, DIM_KEYS, QUAL_KEYS, OBJETIVO_KEYS,
  allNiches, nicheOf, analyzeRaioX, effectiveDims, analyzeQualification, QUAL_LABEL, OBJETIVO_LABEL,
  recommendOffer, whyUs, scoreLead, pickArguments, buildMiniAudit, buildApproach, isRefusal, OPENING_QUESTIONS,
  objectionPlaybook, detectObjections, OBJECTION_LIST, buildPitch, buildSearchPlan, parseHandles,
  DELIVERABLE_COUNT, FIRST_MESSAGE_FORBIDDEN, validateOutbound, extractNumericClaims, findUnsupportedNumbers,
  parseAiRaioX, buildAiRaioXPrompt, aiSourceText, validatePolish, buildPolishPrompt,
  newLead, normalizeLead, normalizeOperacao, analyzeLead, OPERACAO_VAZIA, SERVICE_BY_KEY,
  type Lead, type Operacao,
} from "../../src/prospect/index.js";
import { demoLead, DEMO_OP } from "../../src/demo/sample-prospect.js";

const mk = (patch: Partial<Lead["profile"]> = {}, extra: Partial<Lead> = {}): Lead => {
  const l = newLead("teste");
  l.profile = { ...l.profile, nome: "Studio Teste", nicho: "medicos", ...patch };
  return { ...l, ...extra };
};
const talk = (l: Lead, ...t: string[]): Lead => ({ ...l, conversa: [...l.conversa, ...t.map((texto) => ({ autor: "lead" as const, texto }))] });
const ids = (l: Lead) => analyzeRaioX(l).gargalos.map((g) => g.def.id);

describe("Catálogos pedidos", () => {
  it("nichos: os 18 exemplos e cadastro manual de novos", () => {
    expect(NICHES.length).toBe(18);
    for (const n of ["Médicos", "Clínicas", "Psicólogos", "Arquitetos", "Educadores físicos", "Academias", "Restaurantes", "Cafeterias", "Lojas", "Marcas de moda", "E-commerces", "Fotógrafos", "Profissionais liberais", "Infoprodutores", "Consultores", "Prestadores de serviços", "Negócios locais"]) {
      expect(NICHES.map((x) => x.nome)).toContain(n);
    }
    expect(allNiches(DEMO_OP).map((n) => n.nome)).toContain("Pet shops");
    expect(nicheOf(mk({ nicho: "pet_shops" }), DEMO_OP)?.custom).toBe(true);
    expect(nicheOf(mk({ nicho: "Pet Shops" }), DEMO_OP)?.key).toBe("pet_shops");
    expect(nicheOf(mk({ nicho: "nicho que não existe" }), DEMO_OP)).toBeNull(); // sem chute
  });
  it("Raio-X: as 19 dimensões pedidas + checagem de cabeçalho", () => {
    expect(DIMENSOES.length).toBe(19);
    expect(DIM_KEYS.length).toBe(19);
    for (const l of ["Bio", "Posicionamento", "Clareza da oferta", "Frequência de postagem", "Tipos de conteúdo", "Qualidade percebida", "Consistência visual", "Uso de Reels", "Stories", "Carrosséis", "Prova social", "Autoridade", "Humanização", "Conteúdo educativo", "Conteúdo comercial", "Conteúdo de descoberta", "Conteúdo de consideração", "Conteúdo de conversão"]) {
      expect(DIMENSOES.map((d) => d.label)).toContain(l);
    }
    expect(DIMENSOES.some((d) => /^CTA/.test(d.label))).toBe(true);
    expect(HEADER_PARTS.length).toBe(8);
  });
  it("22 dores, cada uma com pergunta de investigação", () => {
    expect(PAINS.length).toBe(22);
    expect(PAINS.every((p) => p.pergunta.includes("?"))).toBe(true);
    for (const l of ["Falta de tempo para produzir", "Não sabe o que postar", "Reels sem retenção", "Dependência exclusiva de indicação", "Stories sem estratégia", "Conteúdo sem CTA"]) expect(PAINS.map((p) => p.label)).toContain(l);
  });
  it("serviços: os 14 pedidos + análise de métricas e otimização mensal", () => {
    expect(SERVICES.length).toBe(16);
    for (const n of ["Gestão de redes sociais", "Estratégia de conteúdo", "Planejamento de conteúdo", "Calendário editorial", "Criação de conteúdo", "Copywriting", "Roteiros para vídeos", "Reels", "Carrosséis", "Stories", "Posicionamento digital", "Branding de conteúdo", "Consultoria de conteúdo", "Gestão mensal de conteúdo", "Análise de métricas", "Otimização mensal"]) {
      expect(SERVICES.map((s) => s.nome)).toContain(n);
    }
  });
});

describe("Valor, não entregáveis: ENTREGÁVEL → BENEFÍCIO → IMPACTO → VALOR COMERCIAL", () => {
  it("cada serviço tem a cadeia completa e uma frase de valor sem contar posts", () => {
    for (const s of SERVICES) {
      expect(s.entregavel && s.beneficio && s.impacto && s.valorComercial && s.frase, s.key).toBeTruthy();
      for (const t of [s.frase, s.beneficio, s.impacto, s.valorComercial]) expect(DELIVERABLE_COUNT.test(t), `${s.key}: ${t}`).toBe(false);
      expect(extractNumericClaims(s.frase)).toEqual([]);
    }
  });
  it("usa os exemplos de valor que você definiu", () => {
    expect(SERVICE_BY_KEY.calendario_editorial.frase).toBe("Uma estrutura mensal de conteúdo para que sua comunicação deixe de depender de ideias de última hora e passe a trabalhar objetivos específicos de posicionamento e aquisição.");
    expect(SERVICE_BY_KEY.roteiros_video.frase).toBe("Roteiros pensados para transformar conhecimento técnico em conteúdos mais claros, interessantes e capazes de reter atenção.");
    expect(SERVICE_BY_KEY.gestao_redes.frase).toBe("Uma operação estratégica para transformar o Instagram em um ativo de posicionamento, autoridade e geração de oportunidades.");
  });
  it("guardrail barra 'N posts por mês' e afins", () => {
    for (const t of ["12 posts por mês", "4 Reels + 8 artes", "pacote com 10 stories", "entregamos 3 carrosséis semanais e 20 posts por mês"]) expect(DELIVERABLE_COUNT.test(t), t).toBe(true);
    expect(DELIVERABLE_COUNT.test("Uma estrutura mensal de conteúdo com objetivos claros.")).toBe(false);
    expect(validateOutbound("Fazemos 12 posts por mês para você", DEMO_OP).join(" ")).toMatch(/quantidade em vez de valor/);
  });
});

describe("Raio-X — gargalos como hipóteses", () => {
  it("números informados viram avaliação (critério explícito) e ficam rastreáveis", () => {
    const d = effectiveDims(mk({ posts30d: 3, reels30d: 0, carrosseis30d: 8, stories: "diario" }));
    const g = (k: string) => d.find((x) => x.key === k)!;
    expect(g("frequencia")).toMatchObject({ nota: "fraca", origem: "contagem" });
    expect(g("frequencia").base).toMatch(/3 posts nos últimos 30 dias/);
    expect(g("reels").nota).toBe("ausente");
    expect(g("carrosseis").nota).toBe("forte");
    expect(g("stories").nota).toBe("forte");
    expect(g("autoridade").nota).toBe("nao_avaliado");
  });
  it("avaliação manual tem precedência sobre a derivada da contagem", () => {
    const d = effectiveDims(mk({ posts30d: 3, dims: { frequencia: { nota: "forte", obs: "posta todo dia nos Stories" } } }));
    expect(d.find((x) => x.key === "frequencia")).toMatchObject({ nota: "forte", origem: "avaliacao" });
  });
  it("frases de exemplo: produz conteúdo mas sem estratégia", () => {
    const l = mk({ posts30d: 14, dims: { posicionamento: { nota: "fraca" } } });
    const h = analyzeRaioX(l).gargalos.find((x) => x.def.id === "sem_estrategia")!;
    expect(h.def.titulo).toBe("Produz conteúdo, mas não existe estratégia clara.");
    expect(h.certeza).toBe("HIPOTESE");
    expect(h.evidencias.join(" ")).toMatch(/14 posts/);
  });
  it("frases de exemplo: boa estética, pouco valor", () => {
    expect(ids(mk({ dims: { qualidade: { nota: "forte" }, clareza_oferta: { nota: "fraca" } } }))).toContain("estetica_sem_valor");
    expect(ids(mk({ dims: { qualidade: { nota: "fraca" }, clareza_oferta: { nota: "fraca" } } }))).not.toContain("estetica_sem_valor");
  });
  it("frases de exemplo: autoridade técnica não transformada em conteúdo", () => {
    expect(ids(mk({ dims: { autoridade: { nota: "forte" }, educativo: { nota: "fraca" } } }))).toContain("autoridade_nao_convertida");
    expect(ids(mk({ dims: { autoridade: { nota: "fraca" }, educativo: { nota: "fraca" } } }))).not.toContain("autoridade_nao_convertida");
  });
  it("frases de exemplo: pouco direcionamento comercial / institucional / baixa frequência / sem desejo / prova social", () => {
    expect(ids(mk({ dims: { comercial: { nota: "fraca" } } }))).toContain("pouco_comercial");
    expect(ids(mk({ mix: { institucional: 8, educativo: 2 } }))).toContain("institucional");
    expect(ids(mk({ mix: { institucional: 3, educativo: 7 } }))).not.toContain("institucional");
    expect(ids(mk({ posts30d: 2 }))).toContain("baixa_frequencia");
    expect(ids(mk({ dims: { clareza_oferta: { nota: "forte" }, consideracao: { nota: "fraca" } } }))).toContain("oferta_sem_desejo");
    expect(ids(mk({ dims: { prova_social: { nota: "ausente" } } }))).toContain("sem_prova_social");
  });
  it("nada avaliado → nenhum gargalo (não presume problema por falta de dado)", () => {
    const r = analyzeRaioX(mk());
    expect(r.gargalos).toEqual([]);
    expect(r.avaliadas).toBe(0);
    expect(r.confianca).toBe("baixa");
    expect(r.lacunas.join(" ")).toMatch(/dimensões avaliadas/);
  });
  it("toda a interpretação é HIPOTESE com evidência; só a fala do lead confirma", () => {
    const r = analyzeRaioX(analyzeLeadInput());
    expect(r.gargalos.length).toBeGreaterThan(5);
    for (const g of r.gargalos) { expect(g.certeza).toBe("HIPOTESE"); expect(g.evidencias.length).toBeGreaterThan(0); }
    const c = analyzeRaioX(talk(mk(), "A gente vive só de indicação mesmo."));
    expect(c.gargalos.find((g) => g.def.id === "dependencia_indicacao")?.certeza).toBe("CONFIRMADO");
    // o que NÓS escrevemos não confirma nada
    const n = analyzeRaioX({ ...mk(), conversa: [{ autor: "nos", texto: "Você depende só de indicação?" }] });
    expect(n.gargalos.find((g) => g.def.id === "dependencia_indicacao")).toBeUndefined();
  });
  it("dores: nunca assumidas — hipótese só com sinal; sem sinal fica 'sem indício' ou 'só a conversa revela'", () => {
    const r = analyzeRaioX(mk({ posts30d: 2 }));
    const st = (k: string) => r.dores.find((d) => d.key === k)!.status;
    expect(st("falta_constancia")).toBe("HIPOTESE");
    expect(st("perfil_parado")).toBe("HIPOTESE");
    expect(st("falta_tempo")).toBe("SO_CONVERSA");
    expect(st("reels_sem_retencao")).toBe("SO_CONVERSA");
    expect(st("dificuldade_roteiro")).toBe("SO_CONVERSA");
    expect(st("dificuldade_aparecer")).toBe("SEM_INDICIO");
    expect(r.dores.some((d) => d.status === "CONFIRMADO")).toBe(false);
  });
  it("dor só vira CONFIRMADA por fala do lead ou por você marcar", () => {
    expect(analyzeRaioX(talk(mk(), "Eu não tenho tempo pra isso, é corrido.")).dores.find((d) => d.key === "falta_tempo")!.status).toBe("CONFIRMADO");
    const l = mk(); l.doresConfirmadas = ["falta_criatividade"];
    expect(analyzeRaioX(l).dores.find((d) => d.key === "falta_criatividade")!.status).toBe("CONFIRMADO");
  });
  it("cabeçalho: nome sem palavra-chave e vários pontos fracos geram hipóteses", () => {
    const g = ids(mk({ header: { nome_busca: { nota: "fraca" }, destaques: { nota: "fraca" }, fixados: { nota: "ausente" } } }));
    expect(g).toContain("pouco_encontravel");
    expect(g).toContain("cabecalho_fraco");
  });
  it("pontos fortes só vêm do que foi informado (sem elogio inventado)", () => {
    expect(analyzeRaioX(mk()).pontosFortes).toEqual([]);
    const r = analyzeRaioX(mk({ temaDominado: "ortopedia", dims: { autoridade: { nota: "forte", obs: "Bio cita residência" } } }));
    expect(r.pontosFortes.map((c) => c.texto).join(" ")).toMatch(/ortopedia/);
    expect(r.pontosFortes.every((c) => c.certeza === "OBSERVADO" && !!c.evidencia)).toBe(true);
  });
  it("ordena por peso: gargalos estratégicos primeiro", () => {
    const g = analyzeRaioX(mk({ dims: { posicionamento: { nota: "fraca" }, reels: { nota: "fraca" } } })).gargalos;
    expect(g[0]!.def.peso).toBeGreaterThanOrEqual(g.at(-1)!.def.peso);
  });
});
function analyzeLeadInput(): Lead { return demoLead(); }

describe("Primeira mensagem — observação real + oportunidade + pergunta", () => {
  const l = demoLead();
  const r = analyzeRaioX(l);
  const qual = analyzeQualification(l);
  const a = buildApproach(l, r, qual, DEMO_OP);
  it("gera 3 variantes com pergunta, sem vender e sem violar guardrails", () => {
    if (isRefusal(a)) throw new Error("não deveria recusar");
    expect(a.variantes.length).toBe(3);
    for (const v of a.variantes) {
      expect(v.texto).toContain("?");
      expect(validateOutbound(v.texto, DEMO_OP, { primeiraMensagem: true, extraAllowed: [a.observacaoUsada.texto, l.profile.nome, ...l.profile.notas.map((n) => n.texto)] }), v.rotulo).toEqual([]);
    }
    expect(a.avisos.join(" ")).not.toMatch(/proibid|vende|Promessa|Número sem fonte/);
    for (const v of a.variantes.filter((x) => x.canal === "mensagem_curta")) expect(v.texto.length).toBeLessThanOrEqual(430);
  });
  it("usa um fato real do perfil e trata pelo primeiro nome", () => {
    if (isRefusal(a)) throw new Error("x");
    expect(a.variantes[0]!.texto.startsWith("Oi, Helena!")).toBe(true);
    expect(a.observacaoUsada.base.length).toBeGreaterThan(3);
    expect(a.motivoReal).toContain(a.observacaoUsada.texto);
  });
  it("com autoridade forte + pouco educativo, cita o tema dominado e pergunta quem produz", () => {
    const x = mk({ temaDominado: "ortopedia", contato: "Carlos", dims: { autoridade: { nota: "forte" }, educativo: { nota: "fraca" } } });
    const ap = buildApproach(x, analyzeRaioX(x), analyzeQualification(x), DEMO_OP);
    if (isRefusal(ap)) throw new Error("x");
    expect(ap.gargaloId).toBe("autoridade_nao_convertida");
    expect(ap.variantes[0]!.texto).toContain("Percebi que você domina ortopedia.");
    expect(ap.variantes[0]!.texto).toContain("transformar mais desse conhecimento em conteúdo");
    expect(ap.variantes[0]!.texto).toContain("Hoje vocês produzem internamente ou alguém ajuda vocês nessa parte?");
  });
  it("as 6 perguntas de abertura estão disponíveis", () => {
    expect(OPENING_QUESTIONS.length).toBe(6);
    if (isRefusal(a)) throw new Error("x");
    expect(a.perguntasAlternativas.length).toBe(5);
    expect(a.perguntasAlternativas).toContain("Existe alguma meta específica que vocês gostariam que o Instagram ajudasse a alcançar?");
  });
  it("NUNCA vende gestão de redes sociais na 1ª mensagem (validado em todos os gargalos)", () => {
    for (const g of GARGALOS) {
      const x = mk({ temaDominado: "nutrição", contato: "Ana", posts30d: 14, dims: {} });
      const ap = buildApproach(x, { ...analyzeRaioX(x), gargalos: [{ def: g, evidencias: ["fato informado"], certeza: "HIPOTESE" }], avaliadas: 10, confianca: "media" }, analyzeQualification(x), DEMO_OP, { gargaloId: g.id });
      if (isRefusal(ap)) continue;
      for (const v of ap.variantes) expect(validateOutbound(v.texto, DEMO_OP, { primeiraMensagem: true, extraAllowed: [ap.observacaoUsada.texto, x.profile.nome] }), `${g.id}: ${v.texto}`).toEqual([]);
    }
  });
  it("sem fato registrado, RECUSA (não há motivo legítimo de contato)", () => {
    const x = mk();
    const ap = buildApproach(x, analyzeRaioX(x), analyzeQualification(x), DEMO_OP);
    expect(isRefusal(ap)).toBe(true);
    if (isRefusal(ap)) expect(ap.motivo).toMatch(/observação real/);
  });
  it("sem gargalos mas com tema dominado, usa modo curiosidade (sem inventar problema)", () => {
    const x = mk({ temaDominado: "psicologia infantil", contato: "Bia" });
    const ap = buildApproach(x, analyzeRaioX(x), analyzeQualification(x), DEMO_OP);
    if (isRefusal(ap)) throw new Error("x");
    expect(ap.modo).toBe("curiosidade");
    expect(ap.gargaloId).toBeNull();
    expect(ap.variantes[0]!.texto).toContain("psicologia infantil");
  });
});

describe("Agente de qualificação", () => {
  it("16 campos e 9 objetivos", () => {
    expect(QUAL_KEYS.length).toBe(16);
    expect(OBJETIVO_KEYS.length).toBe(9);
    expect(Object.keys(QUAL_LABEL).length).toBe(16);
    expect(Object.values(OBJETIVO_LABEL)).toEqual(expect.arrayContaining(["Gerar leads", "Vender", "Aumentar autoridade", "Melhorar posicionamento", "Construir marca", "Aumentar reconhecimento", "Atrair clientes melhores", "Criar comunidade", "Profissionalizar presença digital"]));
  });
  it("identifica só o que o LEAD disse", () => {
    const l = talk(mk(), "Hoje a minha secretária posta quando dá, mas a maior dificuldade é constância.", "Quero atrair clientes melhores e ganhar autoridade. Eu decido tudo.", "A gente investe em anúncios no Meta ads.");
    const q = analyzeQualification(l);
    const st = (k: string) => q.campos.find((c) => c.key === k)!;
    expect(st("quemProduz").status).toBe("identificado");
    expect(st("principalDificuldade").status).toBe("identificado");
    expect(st("tomadorDecisao").status).toBe("identificado");
    expect(st("investeEmMidia").status).toBe("identificado");
    expect(q.objetivos.map((o) => o.key)).toEqual(expect.arrayContaining(["atrair_clientes_melhores", "aumentar_autoridade"]));
    const nos = analyzeQualification({ ...mk(), conversa: [{ autor: "nos", texto: "Sua maior dificuldade é tempo? Você decide? Investe em anúncios?" }] });
    expect(nos.campos.every((c) => c.status === "lacuna")).toBe(true);
  });
  it("respostas informadas por você valem e não são perguntadas de novo", () => {
    const l = mk({}, { qual: { orcamento: "até R$ 3.000", temDesigner: "sim, freelancer" }, objetivos: ["gerar_leads"] });
    const q = analyzeQualification(l);
    expect(q.campos.find((c) => c.key === "orcamento")).toMatchObject({ status: "identificado", origem: "informado" });
    expect(q.proximasPerguntas.map((p) => p.campo)).not.toContain("orcamento");
    expect(q.proximasPerguntas.map((p) => p.campo)).not.toContain("objetivoInstagram");
    expect(q.objetivos[0]).toMatchObject({ key: "gerar_leads", origem: "informado" });
  });
  it("cada pergunta tem finalidade comercial; nada genérico", () => {
    const q = analyzeQualification(mk());
    expect(q.proximasPerguntas.length).toBeGreaterThan(0);
    expect(q.proximasPerguntas.length).toBeLessThanOrEqual(5);
    for (const p of q.proximasPerguntas) { expect(p.finalidade.length).toBeGreaterThan(20); expect(p.pergunta).toContain("?"); }
    expect(q.proximasPerguntas[0]!.pergunta).toBe("Hoje quem cuida dessa parte de conteúdo?");
    expect(q.qualificada).toBe(false);
  });
  it("a estrutura atual é montada com o que foi dito", () => {
    const q = analyzeQualification(mk({}, { qual: { quemProduz: "a equipe interna", temSocialMedia: "não", temDesigner: "freelancer" } }));
    expect(q.estruturaAtual.join(" ")).toMatch(/Quem produz conteúdo hoje: a equipe interna/);
    expect(q.estruturaAtual.length).toBe(3);
  });
});

describe("POR QUE ESTE PROSPECT PRECISARIA DE NÓS?", () => {
  const l = demoLead();
  const r = analyzeRaioX(l), q = analyzeQualification(l);
  const w = whyUs(l, r, q, DEMO_OP);
  it("responde as 7 perguntas com base nos gargalos", () => {
    expect(w.semBase).toBe(false);
    expect(w.oportunidade?.certeza).toBe("HIPOTESE");
    expect(w.possivelProblema).not.toBeNull();
    expect(w.oQueMelhorar.length).toBeGreaterThan(0);
    expect(w.servicoPrincipal?.nome).toBeTruthy();
    expect(w.resultadoEstrategico).toMatch(/→/);
    expect(w.argumentoComercial?.frase).toBeTruthy();
    expect(w.perguntaPrimeiro).toContain("?");
    expect(w.contratoRecorrente).toMatch(/gestão mensal de conteúdo/i);
  });
  it("sem base, diz que não sabe em vez de inventar", () => {
    const x = mk();
    const ww = whyUs(x, analyzeRaioX(x), analyzeQualification(x), DEMO_OP);
    expect(ww.semBase).toBe(true);
    expect(ww.servicoPrincipal).toBeNull();
    expect(ww.oportunidade).toBeNull();
    expect(ww.avisos.join(" ")).toMatch(/Ainda não há base/);
    expect(ww.perguntaPrimeiro).toContain("?");
  });
  it("nunca recomenda serviço desativado: sem opção ativa, avisa; com outro gargalo, usa o próximo", () => {
    const off = { ativo: false };
    const tudoOff: Operacao = { ...DEMO_OP, catalogo: { ...DEMO_OP.catalogo, roteiros_video: off, carrosseis: off, criacao_conteudo: off, gestao_mensal_conteudo: off } };
    const x = mk({ dims: { autoridade: { nota: "forte" }, educativo: { nota: "fraca" } } });
    const a = whyUs(x, analyzeRaioX(x), analyzeQualification(x), tudoOff);
    expect(a.servicoPrincipal).toBeNull();
    expect(a.resultadoEstrategico).toBeNull();
    expect(a.avisos.join(" ")).toMatch(/desativados em 'Minha operação'/);
    // com um 2º gargalo atendido por serviço ativo, a recomendação usa esse
    const y = mk({ posts30d: 2, dims: { autoridade: { nota: "forte" }, educativo: { nota: "fraca" } } });
    const b = whyUs(y, analyzeRaioX(y), analyzeQualification(y), tudoOff);
    expect(b.servicoPrincipal).toBeTruthy();
    expect(["roteiros_video", "carrosseis", "criacao_conteudo", "gestao_mensal_conteudo"]).not.toContain(b.servicoPrincipal!.key);
    expect(b.avisos.join(" ")).toMatch(/usa outro gargalo/);
  });
});

describe("Foco em contratos recorrentes", () => {
  const l = demoLead();
  const offer = recommendOffer(l, analyzeRaioX(l), analyzeQualification(l), DEMO_OP);
  it("potencial alto quando há vários gargalos de continuidade", () => {
    expect(offer.potencialRecorrente).toBe("alto");
    expect(offer.contratoRecorrente.nome).toBe("Gestão mensal de conteúdo");
    expect(offer.contratoRecorrente.ticket).toMatch(/R\$ 3\.000–R\$ 6\.000\/mês/);
  });
  it("escada: percepção de valor → entrada → recorrente → expansão", () => {
    expect(offer.escada.map((e) => e.etapa.replace(/^\d · /, ""))).toEqual(["Percepção de valor", "Porta de entrada", "Contrato recorrente (prioridade)", "Expansão"]);
    expect(offer.escada[0]!.servicos).toContain("Mini auditoria de conteúdo");
    expect(offer.escada[2]!.servicos).toEqual(["Gestão mensal de conteúdo"]);
  });
  it("'quando oferecer' cobre os 9 itens pedidos, como hipótese", () => {
    expect(offer.quandoOferecer.map((x) => x.nome)).toEqual(["Gestão mensal de conteúdo", "Planejamento de conteúdo", "Estratégia de conteúdo", "Calendário editorial", "Copywriting", "Roteiros para vídeos", "Criação de conteúdo", "Análise de métricas", "Otimização mensal"]);
    expect(offer.quandoOferecer[0]!.indicado).toBe("sim");
    expect(offer.quandoOferecer.find((x) => x.key === "analise_metricas")!.motivo).toMatch(/depois do primeiro ciclo/);
  });
  it("não inventa ticket: só mostra o que você cadastrou", () => {
    const sem = recommendOffer(l, analyzeRaioX(l), analyzeQualification(l), { ...DEMO_OP, catalogo: {} });
    expect(sem.contratoRecorrente.ticket).toBeNull();
    expect(sem.quandoOferecer.every((x) => x.ticket === null)).toBe(true);
  });
  it("com poucos dados, potencial 'indefinido'", () => {
    const x = mk();
    expect(recommendOffer(x, analyzeRaioX(x), analyzeQualification(x), DEMO_OP).potencialRecorrente).toBe("indefinido");
  });
});

describe("Pontuação do prospect (6 critérios)", () => {
  it("prospect demo: prioridade ALTA com critérios explicados", () => {
    const l = demoLead();
    const s = scoreLead(l, analyzeRaioX(l), analyzeQualification(l), DEMO_OP);
    expect(s.criterios.length).toBe(6);
    expect(s.prioridade).toBe("ALTA");
    expect(s.criterios.every((c) => c.evidencia.length > 3)).toBe(true);
  });
  it("desconhecido nunca vira 'bom': pesa pouco e é avisado", () => {
    const x = mk({ dims: { bio: { nota: "fraca" }, posicionamento: { nota: "fraca" }, reels: { nota: "fraca" }, stories: { nota: "fraca" }, frequencia: { nota: "fraca" } } });
    const s = scoreLead(x, analyzeRaioX(x), analyzeQualification(x), DEMO_OP);
    expect(s.criterios.find((c) => c.criterio === "Tem um bom negócio")!.nivel).toBe("desconhecido");
    expect(s.avisos.join(" ")).toMatch(/Sem informação sobre/);
    expect(s.prioridade).not.toBe("ALTA");
  });
  it("capacidade de investimento fraca limita a prioridade a MÉDIA", () => {
    const l = demoLead();
    l.profile.capacidade = { nota: "ausente", obs: "negócio muito pequeno" };
    const s = scoreLead(l, analyzeRaioX(l), analyzeQualification(l), DEMO_OP);
    expect(s.prioridade).not.toBe("ALTA");
  });
  it("poucas dimensões avaliadas → prioridade INDEFINIDA", () => {
    const x = mk({ dims: { bio: { nota: "fraca" } } });
    expect(scoreLead(x, analyzeRaioX(x), analyzeQualification(x), DEMO_OP).prioridade).toBe("INDEFINIDA");
  });
  it("nicho fora do catálogo: 'depende de imagem/autoridade' fica desconhecido (sem chute)", () => {
    const x = mk({ nicho: "algo aleatório" });
    expect(scoreLead(x, analyzeRaioX(x), analyzeQualification(x), DEMO_OP).criterios[2]!.nivel).toBe("desconhecido");
  });
});

describe("Mini auditoria de conteúdo", () => {
  const l = demoLead();
  const r = analyzeRaioX(l), q = analyzeQualification(l);
  const m = buildMiniAudit(l, r, q, DEMO_OP);
  it("6 partes, curta e visual", () => {
    expect(m.semBase).toBe(false);
    expect(m.jaFazBem.length).toBeGreaterThan(0);
    expect(m.oportunidade?.certeza).toBe("HIPOTESE");
    expect(m.problema?.certeza).toBe("HIPOTESE");
    expect(m.melhoria).toBeTruthy();
    expect(m.estrategiaInicial).toMatch(/Reels para descoberta/);
    expect(m.proximoPasso).toBeTruthy();
    expect(m.semaforo.length).toBeGreaterThan(0);
    expect(m.texto.length).toBeLessThanOrEqual(1500);
    for (const t of ["O que já faz bem", "Oportunidade", "Pode estar causando", "Possível melhoria", "Estratégia inicial", "Próximo passo"]) expect(m.texto).toContain(t);
  });
  it("a linguagem do problema é de possibilidade e passa nos guardrails", () => {
    expect(m.problema!.texto).toMatch(/\bpode\b/);
    expect(m.texto).toMatch(/a validar com você/);
    expect(m.avisos.join(" ")).not.toMatch(/proibid|Número sem fonte|quantidade/);
  });
  it("sem pontos fortes registrados, NÃO inventa elogio e avisa", () => {
    const x = mk({ dims: { posicionamento: { nota: "fraca" }, frequencia: { nota: "fraca" }, reels: { nota: "fraca" } } });
    const mm = buildMiniAudit(x, analyzeRaioX(x), analyzeQualification(x), DEMO_OP);
    expect(mm.jaFazBem).toEqual([]);
    expect(mm.texto).toContain("O que já faz bem: —");
    expect(mm.avisos.join(" ")).toMatch(/sem inventar elogio/);
  });
  it("sem gargalos, admite que não há base", () => {
    const x = mk();
    const mm = buildMiniAudit(x, analyzeRaioX(x), analyzeQualification(x), DEMO_OP);
    expect(mm.semBase).toBe(true);
    expect(mm.texto).toMatch(/sem base/i);
  });
});

describe("Banco de argumentos", () => {
  it("10 argumentos sem números nem promessas", () => {
    expect(ARGUMENTS.map((a) => a.rotulo)).toEqual(["POSICIONAMENTO", "AUTORIDADE", "CONSISTÊNCIA", "PROFISSIONALIZAÇÃO", "TEMPO", "ESTRATÉGIA", "AQUISIÇÃO", "CONVERSÃO", "MARCA", "DIFERENCIAÇÃO"]);
    for (const a of ARGUMENTS) {
      for (const t of [a.tese, ...a.frases]) { expect(extractNumericClaims(t), a.key).toEqual([]); expect(validateOutbound(t, DEMO_OP), t).toEqual([]); }
    }
  });
  it("escolhe conforme o problema real", () => {
    const x = mk({ dims: { autoridade: { nota: "forte" }, educativo: { nota: "fraca" } }, posts30d: 2 });
    const top = pickArguments(analyzeRaioX(x), x, analyzeQualification(x), 3).map((a) => a.key);
    expect(top).toContain("autoridade");
    expect(top).toContain("consistencia");
    const y = mk({ dims: { qualidade: { nota: "fraca" } } });
    expect(pickArguments(analyzeRaioX(y), y, analyzeQualification(y), 2).map((a) => a.key)).toEqual(expect.arrayContaining(["profissionalizacao"]));
  });
  it("sem problema identificado, não empurra argumento", () => {
    const x = mk();
    expect(pickArguments(analyzeRaioX(x), x, analyzeQualification(x))).toEqual([]);
  });
  it("objetivo do lead influencia a escolha", () => {
    const x = mk({}, { objetivos: ["aumentar_reconhecimento"] });
    expect(pickArguments(analyzeRaioX(x), x, analyzeQualification(x)).map((a) => a.key)).toContain("consistencia");
  });
});

describe("Objeções comuns em conteúdo", () => {
  const amostras: Record<string, string> = {
    eu_mesmo_faco: "Eu mesmo faço meu conteúdo.",
    secretaria_faz: "Minha secretária faz.",
    tenho_alguem_posta: "Tenho alguém que posta pra mim.",
    sem_tempo_gravar: "Não tenho tempo para gravar.",
    nao_gosta_aparecer: "Não gosto de aparecer.",
    instagram_nao_traz_clientes: "Instagram não me traz clientes.",
    ja_tentei_social_media: "Já tentei social media e não deu certo.",
    nao_preciso_postar_tanto: "Não preciso postar tanto.",
    cliente_vem_por_indicacao: "Meu cliente vem por indicação.",
    esta_caro: "Achei caro.",
    nao_consigo_videos: "Não consigo produzir vídeos.",
    nao_sei_se_consigo_acompanhar: "Não sei se vou conseguir acompanhar.",
    nao_tenho_material: "Não tenho material.",
  };
  it("são 13, e cada uma é detectada", () => {
    expect(OBJECTIONS.length).toBe(13);
    expect(OBJECTION_LIST.length).toBe(13);
    for (const [k, t] of Object.entries(amostras)) expect(detectObjections(t).map((d) => d.key), t).toContain(k);
  });
  it("cada objeção traz: o que há por trás, pergunta, resposta, argumento, redução de risco e próximo passo", () => {
    for (const o of OBJECTIONS) {
      const pb = objectionPlaybook(o.key, DEMO_OP)!;
      expect(pb.oQueExistePorTras.length, o.key).toBeGreaterThan(1);
      expect(pb.perguntaSugerida, o.key).toContain("?");
      expect(pb.resposta.length, o.key).toBeGreaterThan(80);
      expect(pb.argumento.frase && pb.argumento.rotulo, o.key).toBeTruthy();
      expect(pb.argumento.fraseDoBanco.length, o.key).toBeGreaterThan(0);
      expect(pb.reducaoDeRisco.length, o.key).toBeGreaterThan(1);
      expect(pb.proximoPasso.length, o.key).toBeGreaterThan(15);
      expect(pb.naoFazer.join(" ")).toMatch(/Não discutir/);
    }
  });
  it("as respostas não afirmam experiência, números nem resultados", () => {
    for (const o of OBJECTIONS) {
      const txt = [o.resposta, o.pergunta, o.argumento.frase, ...o.reducaoRisco].join(" ");
      expect(validateOutbound(txt, DEMO_OP), o.key).toEqual([]);
      expect(txt, o.key).not.toMatch(/costumo (ver|encontrar)|muita gente|na minha experi[eê]ncia|j[aá] vi (isso|muitos)|garanto/i);
    }
  });
  it("preço: entende antes, não abre com desconto; desconto só com regra cadastrada", () => {
    const pb = objectionPlaybook("esta_caro", DEMO_OP)!;
    expect(pb.preco!.entenderPrimeiro.join(" ")).toMatch(/comparando/);
    expect(pb.preco!.entenderPrimeiro.join(" ")).toMatch(/orçamento/);
    expect(pb.preco!.desconto.permitido).toBe(false);
    expect(pb.resposta).not.toMatch(/desconto/i);
    expect(pb.naoFazer.join(" ")).toMatch(/Não sugerir desconto/);
    const com = objectionPlaybook("esta_caro", { ...DEMO_OP, regras: { descontoMaximoPct: 8 } })!;
    expect(com.preco!.desconto).toMatchObject({ permitido: true, ate: 8 });
    expect(com.resposta).not.toMatch(/desconto/i);
  });
  it("usa o processo cadastrado na redução de risco", () => {
    expect(objectionPlaybook("ja_tentei_social_media", DEMO_OP)!.reducaoDeRisco.join(" ")).toMatch(/Diagnóstico → Estratégia/);
    expect(objectionPlaybook("ja_tentei_social_media", { ...DEMO_OP, processo: [] })!.reducaoDeRisco.join(" ")).not.toMatch(/processo cadastrado/);
  });
  it.each([
    "Quanto custa o serviço?", "Qual o preço?", "Eu adoraria ter mais tempo livre.", "Minha secretária é ótima, adoro ela.",
    "O concorrente do lado posta todo dia.", "Vamos conversar, tenho interesse.", "Meu cliente é muito exigente.",
  ])("não trata como objeção: %s", (t) => expect(detectObjections(t), t).toEqual([]));
});

describe("CRIAR PITCH", () => {
  const l = talk(demoLead(), "Quero atrair clientes melhores para a clínica.", "A maior dificuldade é constância, não tenho tempo.");
  l.qual = { quemProduz: "a recepcionista posta quando dá" };
  const r = analyzeRaioX(l), q = analyzeQualification(l);
  const offer = recommendOffer(l, r, q, DEMO_OP), why = whyUs(l, r, q, DEMO_OP);
  const p = buildPitch(l, r, q, DEMO_OP, why, offer);
  it("7 seções na ordem pedida", () => {
    expect(p.secoes.map((s) => s.titulo)).toEqual(["CENÁRIO", "PROBLEMA", "IMPACTO", "OPORTUNIDADE", "SOLUÇÃO", "DIFERENCIAL", "PRÓXIMO PASSO"]);
    expect(p.secoes.every((s) => s.texto.length > 15)).toBe(true);
  });
  it("usa nicho, objetivo, dor, posicionamento, estrutura atual e oportunidade", () => {
    expect(p.entradasUsadas.map((e) => e.entrada)).toEqual(["Nicho", "Objetivo", "Dor", "Posicionamento", "Estrutura atual", "Oportunidade"]);
    expect(p.entradasUsadas.every((e) => e.valor)).toBe(true);
    expect(p.secoes[0]!.texto).toMatch(/Médicos|dermatologia/);
    expect(p.secoes[0]!.texto).toMatch(/atrair clientes melhores/);
  });
  it("dor citada pelo lead é CONFIRMADA; sem isso, é hipótese e diz que precisa validar", () => {
    expect(p.secoes[1]!.certeza).toBe("CONFIRMADO");
    const x = demoLead();
    const px = buildPitch(x, analyzeRaioX(x), analyzeQualification(x), DEMO_OP, whyUs(x, analyzeRaioX(x), analyzeQualification(x), DEMO_OP), recommendOffer(x, analyzeRaioX(x), analyzeQualification(x), DEMO_OP));
    expect(px.secoes[1]!.certeza).toBe("HIPOTESE");
    expect(px.secoes[1]!.texto).toMatch(/validar isso com você/);
  });
  it("solução em valor e com caminho para contrato recorrente; sem contar posts", () => {
    expect(p.secoes[4]!.texto).toMatch(/gestão mensal de conteúdo/i);
    expect(DELIVERABLE_COUNT.test(p.texto)).toBe(false);
    expect(p.avisos.join(" ")).not.toMatch(/quantidade|Promessa|Número sem fonte|proibid/);
  });
  it("diferencial só vem de item cadastrado E verificado", () => {
    expect(p.semDiferencialCadastrado).toBe(false);
    expect(p.secoes[5]!.texto).toContain("Estratégia antes da produção");
    expect(p.secoes[5]!.texto).not.toContain("não verificado");
    const sem = buildPitch(l, r, q, { ...DEMO_OP, diferenciais: [] }, why, offer);
    expect(sem.semDiferencialCadastrado).toBe(true);
    expect(sem.secoes[5]!.certeza).toBe("SISTEMA");
    expect(sem.avisos.join(" ")).toMatch(/Nenhum diferencial verificado/);
    const semTudo = buildPitch(l, r, q, { ...DEMO_OP, diferenciais: [], processo: [] }, why, offer);
    expect(semTudo.secoes[5]!.texto).toMatch(/critérios de sucesso combinados por escrito/);
  });
  it("faltando dados, avisa em vez de inventar", () => {
    const x = mk({ temaDominado: "arquitetura" });
    const px = buildPitch(x, analyzeRaioX(x), analyzeQualification(x), DEMO_OP, whyUs(x, analyzeRaioX(x), analyzeQualification(x), DEMO_OP), recommendOffer(x, analyzeRaioX(x), analyzeQualification(x), DEMO_OP));
    expect(px.avisos.join(" ")).toMatch(/Sem "objetivo"/);
    expect(px.avisos.join(" ")).toMatch(/Sem "dor"/);
    expect(px.entradasUsadas.find((e) => e.entrada === "Dor")!.valor).toBeNull();
  });
});

describe("Radar de prospects", () => {
  it("gera buscas por nicho e cidade e critérios de bom prospect; não raspa nada", () => {
    const p = buildSearchPlan(DEMO_OP, "clinicas", "Campinas");
    expect(p.nicho).toBe("Clínicas");
    expect(p.instagram).toContain("clínicas em Campinas");
    expect(p.hashtags).toContain("#clinicascampinas");
    expect(p.googleMaps.length).toBeGreaterThan(0);
    expect(p.sinaisDeBomProspect.length).toBe(6);
    expect(p.aviso).toMatch(/não acessa nem raspa/);
  });
  it("aceita nicho cadastrado e texto livre", () => {
    expect(buildSearchPlan(DEMO_OP, "pet_shops", "Santos").nicho).toBe("Pet shops");
    expect(buildSearchPlan(DEMO_OP, "tatuadores", "Santos").nicho).toBe("tatuadores");
    expect(buildSearchPlan(DEMO_OP, "clinicas").hashtags.some((h) => h.includes("undefined"))).toBe(false);
  });
  it("importa @handles de texto, links e listas", () => {
    expect(parseHandles("@Dra.Helena, https://www.instagram.com/clinica.sol/?hl=pt\nloja_x  @loja_x  invalido!! @a")).toEqual(["dra.helena", "clinica.sol", "loja_x", "a"]);
    expect(parseHandles("")).toEqual([]);
  });
});

describe("IA com validação (nada de invenção)", () => {
  const l = mk({ nome: "Clínica Sol", bio: "Dermatologia estética | Atendimento humanizado em Campinas", amostraTexto: "Hoje falamos de protetor solar. Nossa equipe atende de segunda a sexta." });
  const src = aiSourceText(l);
  it("o prompt contém a doutrina e só o texto disponível", () => {
    const p = buildAiRaioXPrompt(l, DEMO_OP);
    expect(p).toMatch(/NUNCA apresente hipótese como fato/);
    expect(p).toContain("Hoje falamos de protetor solar");
    expect(p).toMatch(/trecho exato/i);
  });
  it("descarta itens cuja evidência NÃO está no texto, ou com número inventado", () => {
    const r = parseAiRaioX({
      observacoes: [{ texto: "A bio menciona atendimento humanizado.", evidencia: "Atendimento humanizado em Campinas" }, { texto: "Tem 50 mil seguidores.", evidencia: "50 mil seguidores" }],
      pontosFortes: [{ texto: "Fala de protetor solar.", evidencia: "falamos de protetor solar" }],
      gargalos: [{ texto: "Conteúdo pode ser pouco comercial.", evidencia: "Hoje falamos de protetor solar" }, { texto: "Vendeu 300% mais.", evidencia: "Hoje falamos de protetor solar" }, { texto: "Pode faltar CTA.", evidencia: "trecho que nunca existiu no texto" }],
    }, src);
    expect(r.observacoes.length).toBe(1);
    expect(r.pontosFortes.length).toBe(1);
    expect(r.gargalos.length).toBe(1);
    expect(r.descartados).toBe(3);
    expect(r.motivos.join(" ")).toMatch(/evidência não encontrada/);
    expect(r.motivos.join(" ")).toMatch(/número sem fonte/);
  });
  it("gargalos da IA saem como HIPOTESE, com linguagem de possibilidade", () => {
    const r = parseAiRaioX({ gargalos: [{ texto: "O perfil só fala de produtos.", evidencia: "Hoje falamos de protetor solar" }] }, src);
    expect(r.gargalos[0]).toMatchObject({ certeza: "HIPOTESE" });
    expect(r.gargalos[0]!.texto).toMatch(/^Possível:/);
    expect(r.observacoes).toEqual([]);
  });
  it("entrada inválida não quebra", () => {
    expect(parseAiRaioX(null, src).descartados).toBe(0);
    expect(parseAiRaioX({ observacoes: "x", gargalos: [null, 3] }, src).gargalos).toEqual([]);
  });
  it("polir mensagem: rejeita se perder âncora/pergunta, vender ou inventar", () => {
    const original = "Oi, Helena! Percebi que você domina dermatologia estética. Hoje vocês produzem internamente ou alguém ajuda vocês nessa parte?";
    const anchors = ["dermatologia estética"];
    expect(validatePolish(original, "Oi, Helena! Vi que você domina dermatologia estética. Quem cuida do conteúdo hoje: vocês mesmos ou alguém ajuda?", DEMO_OP, anchors, true).ok).toBe(true);
    expect(validatePolish(original, "Oi, Helena! Você domina dermatologia estética.", DEMO_OP, anchors, true).motivos.join(" ")).toMatch(/perdeu a pergunta/);
    expect(validatePolish(original, "Oi, Helena! Como vai? Quem cuida do conteúdo hoje?", DEMO_OP, anchors, true).motivos.join(" ")).toMatch(/perdeu a âncora/);
    expect(validatePolish(original, "Oi! Domina dermatologia estética. Nossa agência faz gestão de redes sociais, 12 posts por mês. Topa?", DEMO_OP, anchors, true).ok).toBe(false);
    expect(validatePolish(original, "Oi! Domina dermatologia estética e tem 10 mil seguidores. Quem cuida?", DEMO_OP, anchors, true).motivos.join(" ")).toMatch(/números novos|Número sem fonte/);
    expect(buildPolishPrompt(original, anchors)).toMatch(/dermatologia estética/);
  });
});

describe("Guardrails do texto que sai", () => {
  it("promessas e 1ª mensagem vendedora são barradas", () => {
    expect(validateOutbound("Garanto resultado em 30 dias", DEMO_OP).join(" ")).toMatch(/Promessa|garantia/);
    expect(validateOutbound("Vamos dobrar suas vendas", DEMO_OP).join(" ")).toMatch(/Promessa|promessa/);
    expect(validateOutbound("Oferecemos gestão de redes sociais", DEMO_OP, { primeiraMensagem: true }).join(" ")).toMatch(/1ª mensagem não deve vender/);
    expect(validateOutbound("Oferecemos gestão de redes sociais", DEMO_OP, { primeiraMensagem: false }).join(" ")).not.toMatch(/1ª mensagem/);
    expect(FIRST_MESSAGE_FORBIDDEN.length).toBeGreaterThanOrEqual(5);
  });
  it("números só se existirem nos dados cadastrados", () => {
    expect(findUnsupportedNumbers("R$ 2.500", ["R$ 2500"])).toEqual([]);
    expect(validateOutbound("Investimento a partir de R$ 2.500", DEMO_OP).join(" ")).toBe("");
    expect(validateOutbound("Investimento a partir de R$ 777", DEMO_OP).join(" ")).toMatch(/Número sem fonte/);
  });
  it("elogio genérico é barrado", () => {
    expect(validateOutbound("Vi seu perfil e gostei muito!", DEMO_OP).length).toBeGreaterThan(0);
    expect(validateOutbound("Posso te ajudar a crescer no Instagram", DEMO_OP).length).toBeGreaterThan(0);
  });
});

describe("Persistência e normalização", () => {
  it("normaliza leads antigos/incompletos e descarta lixo", () => {
    const n = normalizeLead({ profile: { handle: "x" }, status: "invalido" });
    expect(n?.profile.dims).toEqual({});
    expect(n?.status).toBe("novo");
    expect(n?.conversa).toEqual([]);
    expect(normalizeLead(null)).toBeNull();
    expect(normalizeLead({ nada: 1 })).toBeNull();
  });
  it("normaliza operação vazia/parcial", () => {
    expect(normalizeOperacao(undefined)).toEqual(OPERACAO_VAZIA);
    const o = normalizeOperacao({ processo: ["a"], nichosCustom: "lixo" });
    expect(o.processo).toEqual(["a"]);
    expect(o.nichosCustom).toEqual([]);
  });
  it("newLead gera id e handle limpo", () => {
    const l = newLead("@Minha.Loja ");
    expect(l.profile.handle).toBe("minha.loja");
    expect(l.profile.id).toMatch(/^p_/);
  });
});

describe("Análise completa", () => {
  it("analyzeLead junta tudo sem quebrar, inclusive com lead vazio", () => {
    const a = analyzeLead(demoLead(), DEMO_OP);
    expect(a.raiox.gargalos.length).toBeGreaterThan(5);
    expect(a.score.prioridade).toBe("ALTA");
    expect(a.pitch.secoes.length).toBe(7);
    expect(a.audit.texto).toBeTruthy();
    const v = analyzeLead(mk(), OPERACAO_VAZIA);
    expect(v.why.semBase).toBe(true);
    expect(isRefusal(v.approach)).toBe(true);
    expect(v.score.prioridade).toBe("INDEFINIDA");
  });
  it("nada do que sai contém número que não veio dos dados", () => {
    const l = demoLead();
    const a = analyzeLead(l, DEMO_OP);
    const allowed = [JSON.stringify(l), JSON.stringify(DEMO_OP)];
    const texts = [a.audit.texto, a.pitch.texto, ...(isRefusal(a.approach) ? [] : a.approach.variantes.map((v) => v.texto)), ...a.args.flatMap((x) => [x.tese, ...x.frases])];
    for (const t of texts) expect(findUnsupportedNumbers(t, allowed), t.slice(0, 60)).toEqual([]);
  });
});
