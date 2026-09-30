import { describe, it, expect } from "vitest";
import {
  BANNED_PHRASES, findBannedPhrases, findUnsupportedNumbers, extractNumericClaims, discountPolicy,
  proofUsability, enforceClaimEvidence, validateOutboundText, allowedNumberSources,
  assessLead, analyzeOpportunity, buildFirstApproach, isRefusal, analyzeDiscovery, buildValueChain,
  planAuthority, analyzeObjection, adviseNegotiation, coachDeal, prepareClosing,
  COMMERCIAL_AGENTS, OBJECTION_KEYS, SERVICE_CATEGORIES,
  renderDiagnosis, renderClosing, renderObjection,
  type CommercialContext, type Lead, type Claim,
} from "../../src/commercial/index.js";
import { AGENTS } from "../../src/core/agents-registry.js";
import { DEMO_CTX, DEMO_CTX_WITH_RULES, DEMO_LEAD } from "../../src/demo/sample-commercial.js";

const withMsg = (lead: Lead, texto: string): Lead => ({ ...lead, conversa: [...lead.conversa, { autor: "lead", texto }] });
const allClaims = (d: ReturnType<typeof analyzeOpportunity>): Claim[] => [
  ...d.situacaoAtual, ...d.possiveisDores, ...d.oportunidadesDeCrescimento, ...d.gargalosPercebidos,
  ...d.impactoDosGargalos, ...d.oQueOnegocioPodeEstarPerdendo,
];

describe("Guardrails comerciais", () => {
  it("bloqueia aberturas genéricas e promessas", () => {
    for (const t of ["Vi seu perfil e gostei muito!", "Tenho uma proposta incrível", "Posso te ajudar a crescer", "Somos uma agência de marketing", "Garanto que você vai vender mais", "Últimas vagas, só hoje!"]) {
      expect(findBannedPhrases(t).length, t).toBeGreaterThan(0);
    }
  });
  it("não dá falso positivo em palavras comuns (limite de palavra)", () => {
    expect(findBannedPhrases("Como vocês enxergam isso hoje?")).toEqual([]);
    expect(findBannedPhrases("O site não mostra o cardápio.")).toEqual([]);
    expect(BANNED_PHRASES.length).toBeGreaterThanOrEqual(8);
  });
  it("detecta números sem fonte e aceita os cadastrados", () => {
    expect(extractNumericClaims("Aumente 300% suas vendas e ganhe R$ 5.000")).toEqual(expect.arrayContaining(["300%", "r$ 5.000"]));
    expect(findUnsupportedNumbers("Resultado de 300%", ["fonte sem números"])).toEqual(["300%"]);
    expect(findUnsupportedNumbers("Resultado de 300%", ["Case: 300% documentado"])).toEqual([]);
    expect(findUnsupportedNumbers("Investimento R$ 1.800", allowedNumberSources(DEMO_CTX))).toEqual([]);
    expect(findUnsupportedNumbers("Investimento R$ 999", allowedNumberSources(DEMO_CTX))).toEqual(["r$ 999"]);
  });
  it("desconto só existe com regra cadastrada", () => {
    expect(discountPolicy({}).permitido).toBe(false);
    expect(discountPolicy({ descontoMaximoPct: 0 }).permitido).toBe(false);
    expect(discountPolicy({ descontoMaximoPct: 8, descontoCondicoes: ["à vista"] })).toMatchObject({ permitido: true, ate: 8, condicoes: ["à vista"] });
  });
  it("prova: só verificada; resultado exige documentação", () => {
    const base = { titulo: "t", descricao: "d", fonte: "f" };
    expect(proofUsability({ ...base, tipo: "metodologia", verificado: false }).usavel).toBe(false);
    expect(proofUsability({ ...base, tipo: "metodologia", verificado: true }).usavel).toBe(true);
    expect(proofUsability({ ...base, tipo: "case", verificado: true }).usavel).toBe(false);
    expect(proofUsability({ ...base, tipo: "case", verificado: true, resultadoDocumentado: "doc" }).usavel).toBe(true);
    expect(proofUsability({ ...base, fonte: " ", tipo: "processo", verificado: true }).usavel).toBe(false);
  });
  it("OBSERVADO/CONFIRMADO sem evidência é rebaixado a HIPOTESE (nunca promovido)", () => {
    expect(enforceClaimEvidence({ texto: "x", certeza: "OBSERVADO" }).certeza).toBe("HIPOTESE");
    expect(enforceClaimEvidence({ texto: "x", certeza: "CONFIRMADO", evidencia: " " }).certeza).toBe("HIPOTESE");
    expect(enforceClaimEvidence({ texto: "x", certeza: "OBSERVADO", evidencia: "site" }).certeza).toBe("OBSERVADO");
    expect(enforceClaimEvidence({ texto: "x", certeza: "HIPOTESE" }).certeza).toBe("HIPOTESE");
  });
});

describe("Garimpo — avaliação de lead", () => {
  it("prioriza com base nas observações e mostra a evidência", () => {
    const a = assessLead(DEMO_CTX, DEMO_LEAD);
    expect(a.prioridade).toBe("ALTA");
    expect(a.dimensoes.length).toBeGreaterThanOrEqual(12);
    expect(a.melhorServico?.servico.key).toBe("landing"); // dor confirmada pelo lead (site/cardápio) pesa mais
    expect(a.possivelTicket).toMatchObject({ minimo: 1800, maximo: 3500, periodicidade: "unico" });
    expect(a.possiveisProblemas.every((c) => c.certeza === "HIPOTESE" && !!c.evidencia)).toBe(true);
    expect(a.motivoDeInteresse.every((c) => c.certeza === "OBSERVADO" && !!c.evidencia)).toBe(true);
  });
  it("área sem observação fica 'desconhecido' e vira lacuna — nunca é presumida", () => {
    const a = assessLead(DEMO_CTX, DEMO_LEAD);
    expect(a.dimensoes.find((d) => d.dimensao === "Oferta")?.nivel).toBe("desconhecido");
    expect(a.lacunas.some((l) => /oferta/i.test(l))).toBe(true);
  });
  it("com menos de 2 áreas observadas a prioridade é INDEFINIDA", () => {
    const lead: Lead = { ...DEMO_LEAD, sinais: [DEMO_LEAD.sinais[0]!] };
    const a = assessLead(DEMO_CTX, lead);
    expect(a.prioridade).toBe("INDEFINIDA");
    expect(a.lacunas.join(" ")).toMatch(/Poucas observações/);
  });
  it("sem faixa de ticket cadastrada, não estima valor", () => {
    const ctx: CommercialContext = { ...DEMO_CTX, servicos: DEMO_CTX.servicos.map((s) => ({ ...s, ticketMin: undefined, ticketMax: undefined })) };
    const a = assessLead(ctx, DEMO_LEAD);
    expect(a.possivelTicket).toBeNull();
    expect(a.lacunas.join(" ")).toMatch(/faixa de ticket/);
  });
  it("sem serviço aderente no catálogo, não inventa recomendação", () => {
    const ctx: CommercialContext = { ...DEMO_CTX, servicos: [] };
    const a = assessLead(ctx, DEMO_LEAD);
    expect(a.melhorServico).toBeNull();
    expect(a.possivelTicket).toBeNull();
  });
});

describe("ANALISAR OPORTUNIDADE — diagnóstico", () => {
  const d = analyzeOpportunity(DEMO_CTX, DEMO_LEAD);
  it("entrega todas as seções pedidas", () => {
    expect(d.situacaoAtual.length).toBeGreaterThan(0);
    expect(d.possiveisDores.length).toBeGreaterThan(0);
    expect(d.oportunidadesDeCrescimento.length).toBeGreaterThan(0);
    expect(d.gargalosPercebidos.length).toBeGreaterThan(0);
    expect(d.impactoDosGargalos.length).toBeGreaterThan(0);
    expect(d.oQueOnegocioPodeEstarPerdendo.length).toBeGreaterThan(0);
    expect(d.comoNossosServicosAjudam.length).toBeGreaterThan(0);
    expect(d.melhorPortaDeEntrada?.servico).toBe("Landing page de encomendas");
    expect(d.melhorPortaDeEntrada?.ticket).toMatchObject({ minimo: 1800, maximo: 3500 });
    expect(d.oportunidadesDeUpsell.length).toBeGreaterThan(0);
    expect(d.potencialDeContratoRecorrente.existe).toBe(true);
    expect(d.argumentosParaGerarValor.length).toBeGreaterThan(0);
    expect(d.perguntasParaConfirmarHipoteses.length).toBeGreaterThan(0);
    const md = renderDiagnosis(d);
    for (const h of ["SITUAÇÃO ATUAL", "POSSÍVEIS DORES", "OPORTUNIDADES DE CRESCIMENTO", "GARGALOS PERCEBIDOS", "IMPACTO DESSES GARGALOS", "O QUE O NEGÓCIO PODE ESTAR PERDENDO", "COMO NOSSOS SERVIÇOS PODEM AJUDAR", "MELHOR PORTA DE ENTRADA", "OPORTUNIDADES DE UPSELL", "POTENCIAL DE CONTRATO RECORRENTE", "ARGUMENTOS PARA GERAR VALOR", "PERGUNTAS PARA CONFIRMAR AS HIPÓTESES"]) {
      expect(md).toContain(h);
    }
  });
  it("nunca trata hipótese como fato: inferências são HIPOTESE, fatos têm evidência", () => {
    for (const c of d.gargalosPercebidos.concat(d.oportunidadesDeCrescimento, d.oQueOnegocioPodeEstarPerdendo)) expect(c.certeza).toBe("HIPOTESE");
    for (const c of allClaims(d)) if (c.certeza !== "HIPOTESE") expect(c.evidencia?.trim()).toBeTruthy();
  });
  it("a fala do próprio lead vira CONFIRMADO e aparece primeiro", () => {
    expect(d.possiveisDores[0]?.certeza).toBe("CONFIRMADO");
    expect(d.impactoDosGargalos[0]?.certeza).toBe("CONFIRMADO");
  });
  it("impacto e perda são descritos como possibilidade, sem números inventados", () => {
    for (const c of [...d.impactoDosGargalos, ...d.oQueOnegocioPodeEstarPerdendo].filter((c) => c.certeza === "HIPOTESE")) {
      expect(c.texto).toMatch(/\bpode\b/i);
    }
    const tudo = JSON.stringify(d);
    expect(findUnsupportedNumbers(tudo, allowedNumberSources(DEMO_CTX, [JSON.stringify(DEMO_LEAD)]))).toEqual([]);
  });
  it("sem prova verificada, não inventa autoridade e avisa", () => {
    const ctx: CommercialContext = { ...DEMO_CTX, provas: [] };
    const dd = analyzeOpportunity(ctx, DEMO_LEAD);
    expect(dd.argumentosParaGerarValor.join(" ")).toMatch(/Sem provas verificadas/);
    expect(JSON.stringify(dd)).not.toMatch(/Prova verificada —/);
  });
});

describe("Abertura — primeira abordagem", () => {
  const r = buildFirstApproach(DEMO_CTX, DEMO_LEAD);
  it("gera observação real + oportunidade + pergunta, sem frases proibidas nem números soltos", () => {
    if (isRefusal(r)) throw new Error("não deveria recusar");
    expect(r.variantes.length).toBeGreaterThanOrEqual(3);
    for (const v of r.variantes) {
      expect(v.texto).toContain("?");
      expect(v.texto.toLowerCase()).toContain(r.observacaoUsada.observacao.replace(/\.$/, "").toLowerCase());
      expect(validateOutboundText(v.texto, DEMO_CTX, [r.observacaoUsada.observacao])).toEqual([]);
    }
    for (const v of r.variantes.filter((x) => x.canal === "mensagem_curta")) expect(v.texto.length).toBeLessThanOrEqual(420);
    expect(r.avisos.join(" ")).not.toMatch(/Frase proibida/);
  });
  it("prefere a dor que o lead confirmou (site/cardápio)", () => {
    if (isRefusal(r)) throw new Error("x");
    expect(r.observacaoUsada.area).toBe("site");
  });
  it("chama o contato pelo primeiro nome", () => {
    if (isRefusal(r)) throw new Error("x");
    expect(r.variantes[0]!.texto.startsWith("Oi, Marina!")).toBe(true);
  });
  it("RECUSA gerar sem observação real (não há motivo legítimo de contato)", () => {
    const vazio: Lead = { ...DEMO_LEAD, sinais: [], conversa: [] };
    const rr = buildFirstApproach(DEMO_CTX, vazio);
    expect(isRefusal(rr)).toBe(true);
    if (isRefusal(rr)) expect(rr.motivo).toMatch(/observação real/);
    const semFonte: Lead = { ...DEMO_LEAD, sinais: [{ area: "site", avaliacao: "fraca", observacao: "Algo", fonte: "" }] };
    expect(isRefusal(buildFirstApproach(DEMO_CTX, semFonte))).toBe(true);
    const soPositivo: Lead = { ...DEMO_LEAD, sinais: [{ area: "site", avaliacao: "forte", observacao: "Site excelente.", fonte: "site" }] };
    expect(isRefusal(buildFirstApproach(DEMO_CTX, soPositivo))).toBe(true);
  });
});

describe("Sonda — descoberta de necessidade", () => {
  it("identifica o que o lead disse e aponta o que falta, com finalidade em cada pergunta", () => {
    const r = analyzeDiscovery(DEMO_LEAD);
    const st = (k: string) => r.campos.find((c) => c.campo === k)?.status;
    expect(st("problema")).toBe("identificado");
    expect(st("impacto")).toBe("identificado");
    expect(st("urgencia")).toBe("identificado");
    expect(st("investimento")).toBe("lacuna");
    expect(r.qualificada).toBe(false);
    expect(r.camposCriticosEmFalta).toEqual(expect.arrayContaining(["resultadoEsperado", "investimento", "autoridadeDeDecisao"]));
    expect(r.proximasPerguntas.length).toBeGreaterThan(0);
    for (const p of r.proximasPerguntas) {
      expect(p.finalidade.length).toBeGreaterThan(10);
      expect(p.pergunta).toContain("?");
      expect(p.pergunta).not.toMatch(/seu Gastronomia/);
    }
  });
  it("não pergunta o que já sabe; dados cadastrados contam como evidência", () => {
    const lead: Lead = { ...DEMO_LEAD, orcamentoInformado: "até R$ 3.000", decisores: ["Marina", "sócio Paulo"], solucoesTentadas: ["freelancer de Instagram"] };
    const r = analyzeDiscovery(lead);
    expect(r.campos.find((c) => c.campo === "investimento")?.status).toBe("identificado");
    expect(r.proximasPerguntas.map((p) => p.campo)).not.toContain("investimento");
    expect(r.proximasPerguntas.map((p) => p.campo)).not.toContain("solucoesJaTentadas");
  });
  it("só considera o que o LEAD escreveu (não o que nós escrevemos)", () => {
    const lead: Lead = { ...DEMO_LEAD, conversa: [{ autor: "nos", texto: "Qual é o seu orçamento? O problema é urgente, certo?" }] };
    const r = analyzeDiscovery(lead);
    expect(r.campos.every((c) => c.status === "lacuna")).toBe(true);
  });
  it("marca como qualificada quando os campos críticos estão completos", () => {
    const lead = withMsg(DEMO_LEAD, "Meu objetivo é dobrar as encomendas de fim de ano. Eu decido, tenho orçamento de R$ 3.000.");
    const r = analyzeDiscovery(lead);
    expect(r.qualificada).toBe(true);
    expect(r.qualificacaoPct).toBeGreaterThan(50);
  });
});

describe("Value Builder", () => {
  it("todas as categorias têm entregável → benefício → impacto → valor e frase pronta", () => {
    for (const c of SERVICE_CATEGORIES) {
      const v = buildValueChain(c);
      expect(v.entregavel && v.beneficio && v.impacto && v.valorParaONegocio && v.frase).toBeTruthy();
      expect(v.frase.startsWith("Vamos ")).toBe(true);
    }
    expect(SERVICE_CATEGORIES.length).toBe(10);
  });
  it("não promete números", () => {
    for (const c of SERVICE_CATEGORIES) expect(extractNumericClaims(buildValueChain(c).frase)).toEqual([]);
  });
  it("site: frase de valor, não só 'vamos criar um site'", () => {
    expect(buildValueChain("site").frase).toMatch(/credibilidade/);
    expect(buildValueChain("site").frase).toMatch(/oportunidades comerciais/);
  });
});

describe("Lastro — autoridade legítima", () => {
  it("só usa provas verificadas e documentadas; explica as excluídas", () => {
    const p = planAuthority(DEMO_CTX, DEMO_LEAD);
    expect(p.provasUsaveis.map((u) => u.prova.titulo)).toEqual([expect.stringMatching(/Método em 4 etapas/)]);
    expect(p.provasUsaveis[0]!.relevancia).toBe("alta");
    expect(p.naoUsar.length).toBe(2);
    expect(p.naoUsar.map((n) => n.motivo).join(" ")).toMatch(/não verificada/);
    expect(p.naoUsar.map((n) => n.motivo).join(" ")).toMatch(/resultadoDocumentado/);
  });
  it("sem prova: não cria; oferece processo, metodologia, clareza, profissionalismo, especialização", () => {
    const p = planAuthority({ ...DEMO_CTX, provas: [] }, DEMO_LEAD);
    expect(p.semProvaRelevante).toBe(true);
    expect(p.provasUsaveis).toEqual([]);
    expect(p.alternativasLegitimas.map((a) => a.eixo)).toEqual(["Processo", "Metodologia", "Clareza", "Profissionalismo", "Especialização"]);
    expect(p.avisos.join(" ")).toMatch(/não citar cases/);
  });
  it("avisa quando as provas são de outro nicho", () => {
    const p = planAuthority(DEMO_CTX, { ...DEMO_LEAD, nicho: "Advocacia" });
    expect(p.provasUsaveis[0]!.relevancia).toBe("media");
    expect(p.avisos.join(" ")).toMatch(/outro nicho|não são do mesmo nicho/);
  });
});

describe("OBJECTION ENGINE", () => {
  const amostras: Record<(typeof OBJECTION_KEYS)[number], string> = {
    preco: "O preço é um problema pra mim.",
    timing: "Agora não é o momento, fica pro ano que vem.",
    prioridade: "Tenho outras prioridades no momento.",
    confianca: "Ainda não te conheço, preciso de referências.",
    risco: "E se não funcionar? É arriscado.",
    autoridade: "Não decido isso sozinho, preciso de aprovação do diretor.",
    socio: "Preciso falar com meu sócio antes.",
    orcamento: "Estou sem verba esse mês.",
    concorrencia: "Estou comparando com outras propostas.",
    ja_tenho_fornecedor: "Já tenho uma agência que cuida disso.",
    preciso_pensar: "Vou pensar e te falo.",
    nao_vejo_necessidade: "Não vejo necessidade disso agora.",
    quero_fazer_depois: "Prefiro fazer isso mais tarde.",
    esta_caro: "Achei caro.",
    incerteza_retorno: "Não tenho certeza do retorno disso.",
  };
  it("cobre as 15 objeções e detecta cada uma", () => {
    expect(OBJECTION_KEYS.length).toBe(15);
    for (const k of OBJECTION_KEYS) {
      const a = analyzeObjection(DEMO_CTX, DEMO_LEAD, amostras[k]);
      expect(a.detectada, k).toBe(true);
      const todas = [a.explicita?.chave, ...a.secundarias.map((s) => s.chave)];
      expect(todas, k).toContain(k);
    }
  });
  it("cada objeção traz os 7 passos: explícita, implícitas, causa, resposta, valor, risco, próximo passo", () => {
    for (const k of OBJECTION_KEYS) {
      const a = analyzeObjection(DEMO_CTX, DEMO_LEAD, amostras[k]);
      expect(a.explicita).not.toBeNull();
      expect(a.possiveisImplicitas.length, k).toBeGreaterThan(0);
      expect(a.perguntaParaEntenderACausa, k).toContain("?");
      expect(a.respostaConsultiva.length, k).toBeGreaterThan(40);
      expect(a.reforcoDeValor.length, k).toBeGreaterThan(0);
      expect(a.reducaoDePercepcaoDeRisco.length, k).toBeGreaterThan(0);
      expect(a.proximoPasso.length, k).toBeGreaterThan(10);
      expect(a.naoFazer.join(" ")).toMatch(/Não discutir/);
      expect(a.naoFazer.join(" ")).toMatch(/Não pressionar/);
    }
  });
  it("respostas nunca oferecem desconto, nem sem nem com regra cadastrada", () => {
    for (const ctx of [DEMO_CTX, DEMO_CTX_WITH_RULES]) {
      for (const k of OBJECTION_KEYS) {
        const a = analyzeObjection(ctx, DEMO_LEAD, amostras[k]);
        expect(a.respostaConsultiva).not.toMatch(/desconto/i);
        expect(a.perguntaParaEntenderACausa).not.toMatch(/desconto/i);
        expect(a.reforcoDeValor.join(" ")).not.toMatch(/desconto/i);
        expect(validateOutboundText(a.respostaConsultiva, ctx)).toEqual([]);
      }
    }
  });
  it("preço: entende primeiro (comparação, orçamento, prioridade, valor, impacto) e reforça valor", () => {
    for (const k of ["preco", "esta_caro"] as const) {
      const a = analyzeObjection(DEMO_CTX, DEMO_LEAD, amostras[k]);
      const ent = a.abordagemDePreco!.entenderPrimeiro.join(" ");
      for (const t of [/compara/i, /or[çc]amento/i, /prioridade/i, /valor/i, /impacto/i]) expect(ent).toMatch(t);
      const ref = a.abordagemDePreco!.reforcar.join(" ");
      for (const t of [/Escopo/i, /Qualidade/i, /processo|método/i, /Entregáveis/i, /Acompanhamento/i, /Impacto/i, /tempo/i, /oportunidades/i, /Posicionamento/i]) expect(ref).toMatch(t);
      expect(a.naoFazer.join(" ")).toMatch(/Não oferecer desconto antes de entender/);
    }
  });
  it("desconto: proibido sem regra; informado (não sugerido) com regra", () => {
    const sem = analyzeObjection(DEMO_CTX, DEMO_LEAD, "Achei caro.");
    expect(sem.abordagemDePreco!.desconto.permitido).toBe(false);
    expect(sem.naoFazer.join(" ")).toMatch(/não há regra comercial cadastrada/);
    const com = analyzeObjection(DEMO_CTX_WITH_RULES, DEMO_LEAD, "Achei caro.");
    expect(com.abordagemDePreco!.desconto).toMatchObject({ permitido: true, ate: 8 });
  });
  it("sem objeção clara, não inventa uma — pergunta e ouve", () => {
    const a = analyzeObjection(DEMO_CTX, DEMO_LEAD, "Ok, obrigado pelo material!");
    expect(a.detectada).toBe(false);
    expect(a.explicita).toBeNull();
    expect(a.perguntaParaEntenderACausa).toContain("?");
    expect(renderObjection(a)).toMatch(/não identificada/);
  });
  it("usa a última mensagem do lead quando nenhuma é passada", () => {
    const a = analyzeObjection(DEMO_CTX, withMsg(DEMO_LEAD, "Está muito caro."));
    expect(a.explicita?.chave).toBe("esta_caro");
  });
  it("detecta objeção principal + secundárias ('caro' + 'sócio')", () => {
    const a = analyzeObjection(DEMO_CTX, DEMO_LEAD, "Achei caro e preciso falar com meu sócio.");
    expect(a.explicita?.chave).toBe("esta_caro");
    expect(a.secundarias.map((s) => s.chave)).toContain("socio");
  });
});

describe("OBJECTION ENGINE — sem falsos positivos", () => {
  it.each([
    "Qual o preço do pacote?",
    "Tenho orçamento de R$ 3.000 para isso.",
    "Meu sócio Paulo também participa das decisões.",
    "Meu concorrente abriu uma loja nova ao lado.",
    "Depois te mando o logo da padaria.",
    "Gostei muito, vale a pena conversarmos.",
    "Tenho confiança no trabalho de vocês.",
    "Isso é prioridade para mim agora.",
    "Quanto custa a landing page?",
  ])("não trata como objeção: %s", (texto) => {
    const a = analyzeObjection(DEMO_CTX, DEMO_LEAD, texto);
    expect(a.detectada, texto).toBe(false);
  });
});

describe("Acordo — negociação", () => {
  it("valor primeiro; desconto por último e indisponível sem regra", () => {
    const n = adviseNegotiation(DEMO_CTX, DEMO_LEAD, { objecao: "esta_caro" });
    expect(n.opcoesEmOrdem[0]!.tipo).toBe("aumentar_valor");
    expect(n.opcoesEmOrdem.at(-1)!.tipo).toBe("desconto");
    const d = n.opcoesEmOrdem.at(-1)!;
    expect(d.disponivel).toBe(false);
    expect(d.motivoIndisponivel).toMatch(/regra/);
    expect(n.opcoesEmOrdem.find((o) => o.tipo === "parcelamento")!.disponivel).toBe(false);
    expect(n.alertas.join(" ")).toMatch(/preserve margem/i);
  });
  it("com regras cadastradas, habilita parcelamento e desconto (ainda por último)", () => {
    const n = adviseNegotiation(DEMO_CTX_WITH_RULES, DEMO_LEAD, { objecao: "preco" });
    expect(n.opcoesEmOrdem.find((o) => o.tipo === "parcelamento")).toMatchObject({ disponivel: true });
    expect(n.opcoesEmOrdem.find((o) => o.tipo === "parcelamento")!.comoApresentar).toMatch(/6x/);
    const d = n.opcoesEmOrdem.at(-1)!;
    expect(d).toMatchObject({ tipo: "desconto", disponivel: true, protegeMargem: false });
    expect(d.comoApresentar).toMatch(/8%/);
    expect(n.alertas.join(" ")).toMatch(/35%/);
    expect(n.alertas.join(" ")).toMatch(/preço/i);
  });
  it("todas as opções que preservam margem vêm antes do desconto", () => {
    const n = adviseNegotiation(DEMO_CTX_WITH_RULES, DEMO_LEAD);
    const iDesc = n.opcoesEmOrdem.findIndex((o) => o.tipo === "desconto");
    expect(n.opcoesEmOrdem.slice(0, iDesc).every((o) => o.protegeMargem)).toBe(true);
    expect(iDesc).toBe(n.opcoesEmOrdem.length - 1);
  });
  it("redução de escopo é decidida com o lead (não corta entregável por conta própria)", () => {
    const o = adviseNegotiation(DEMO_CTX, DEMO_LEAD).opcoesEmOrdem.find((x) => x.tipo === "reduzir_escopo")!;
    expect(o.comoApresentar).toMatch(/COM o lead/);
  });
  it("upsell e downsell apontam serviços distintos e coerentes", () => {
    const n = adviseNegotiation(DEMO_CTX, DEMO_LEAD);
    const up = n.opcoesEmOrdem.find((o) => o.tipo === "upsell")?.comoApresentar;
    const down = n.opcoesEmOrdem.find((o) => o.tipo === "downsell")?.comoApresentar;
    expect(up).toBeTruthy();
    expect(down).toBeTruthy();
    expect(up).not.toBe(down);
    expect(down).toMatch(/Copy de oferta/); // mais barato e do mesmo tipo (não recorrente)
    expect(up).not.toMatch(/Copy de oferta/);
  });
  it("a contraproposta cita só números do catálogo e o ticket é do serviço citado", () => {
    const n = adviseNegotiation(DEMO_CTX, DEMO_LEAD);
    expect(findUnsupportedNumbers(n.contraPropostaSugerida, allowedNumberSources(DEMO_CTX))).toEqual([]);
    expect(n.contraPropostaSugerida).toContain("Landing page de encomendas");
    expect(n.contraPropostaSugerida).toMatch(/R\$ 1\.800/);
  });
  it("faseInicialPermitida=false desativa a fase inicial", () => {
    const ctx = { ...DEMO_CTX, regras: { faseInicialPermitida: false } };
    const f = adviseNegotiation(ctx, DEMO_LEAD).opcoesEmOrdem.find((o) => o.tipo === "fase_inicial")!;
    expect(f.disponivel).toBe(false);
  });
});

describe("Deal Coach", () => {
  it("com objeção: o bloqueio é a objeção e o próximo passo é entender a causa", () => {
    const lead = withMsg(DEMO_LEAD, "Achei caro.");
    const r = coachDeal(DEMO_CTX, { lead, propostaEnviada: true });
    expect(r.oQueImpedeOFechamento).toMatch(/Está caro/);
    expect(r.principalObjecao).toBe("Está caro");
    expect(r.perguntaQueDestrava).toContain("caro em relação a quê");
    expect(r.proximoMovimento).toMatch(/pergunta de causa/i);
  });
  it("sem objeção mas com lacunas críticas: o bloqueio é falta de qualificação", () => {
    const r = coachDeal(DEMO_CTX, { lead: DEMO_LEAD });
    expect(r.principalObjecao).toBeNull();
    expect(r.oQueImpedeOFechamento).toMatch(/Falta qualificação/);
    expect(r.informacoesFaltantes.length).toBeGreaterThan(0);
    expect(r.melhorCTA).toMatch(/diagnóstico/);
  });
  it("proposta enviada e silêncio ≥ 5 dias: sinaliza prioridade/timing, sem pressão", () => {
    const lead = withMsg(DEMO_LEAD, "Meu objetivo é dobrar as encomendas de fim de ano. Eu decido, tenho orçamento de R$ 3.000.");
    const r = coachDeal(DEMO_CTX, { lead: { ...lead, conversa: lead.conversa }, propostaEnviada: true, diasSemResposta: 7 });
    expect(r.oQueImpedeOFechamento).toMatch(/Silêncio há 7 dias/);
    expect(r.principalRisco).toMatch(/pressão|esfriar/);
    expect(r.forcaDaOportunidade).not.toBe("baixa");
  });
  it("não cita prova quando não há prova verificada", () => {
    const r = coachDeal({ ...DEMO_CTX, provas: [] }, { lead: DEMO_LEAD });
    expect(r.provaNecessaria).toMatch(/não citar cases/);
  });
});

describe("PREPARAR FECHAMENTO", () => {
  const lead = withMsg(DEMO_LEAD, "Achei caro. Preciso falar com meu sócio.");
  const p = prepareClosing(DEMO_CTX, lead);
  it("entrega todas as seções", () => {
    for (const k of ["resumoExecutivo", "orcamento", "estrategiaDeFechamento", "proximoPasso", "possivelSolucao"] as const) expect(p[k].length, k).toBeGreaterThan(5);
    for (const k of ["dores", "impacto", "desejos", "objecoes", "decisores", "concorrentes", "oportunidades", "perguntasEssenciais", "argumentos", "casesRelevantes", "servicos", "possiveisPacotes"] as const) expect(p[k].length, k).toBeGreaterThan(0);
    const md = renderClosing(p);
    for (const h of ["Resumo executivo", "Cases relevantes", "Estratégia de fechamento", "Roteiro dinâmico"]) expect(md).toContain(h);
  });
  it("roteiro de 15 etapas na ordem pedida", () => {
    expect(p.roteiro.length).toBe(15);
    expect(p.roteiro.map((s) => s.etapa)).toEqual([
      "Contexto", "Rapport", "Entendimento da situação", "Dor", "Impacto", "Objetivo", "Prioridade", "Investimento",
      "Autoridade de decisão", "Solução", "Demonstração de valor", "Redução de risco", "Investimento (apresentação)",
      "Tratamento de objeções", "Próximo passo",
    ]);
    expect(p.roteiro.every((s) => s.perguntasOuFalas.length > 0)).toBe(true);
  });
  it("adapta o roteiro: o que já se sabe vira 'confirmar'; o que falta vira 'descobrir'", () => {
    const modo = (e: string) => p.roteiro.find((s) => s.etapa === e)!.modo;
    expect(modo("Dor")).toBe("confirmar");
    expect(modo("Impacto")).toBe("descobrir"); // impacto conhecido, mas o custo em R$ ainda não
    expect(p.roteiro.find((s) => s.etapa === "Impacto")!.perguntasOuFalas.join(" ")).toMatch(/\(já sabemos\)/);
    expect(modo("Objetivo")).toBe("descobrir");
    expect(modo("Investimento")).toBe("descobrir");
    expect(modo("Contexto")).toBe("conduzir");
    expect(modo("Solução")).toBe("apresentar");
    expect(p.roteiro.find((s) => s.etapa === "Dor")!.perguntasOuFalas.join(" ")).toMatch(/perde muitas encomendas/);
  });
  it("não apresenta valores enquanto a descoberta está incompleta", () => {
    expect(p.estrategiaDeFechamento).toMatch(/Não apresentar valores ainda/);
  });
  it("cases: só provas verificadas; sem prova, manda não citar", () => {
    expect(p.casesRelevantes.join(" ")).toMatch(/Método em 4 etapas/);
    expect(p.casesRelevantes.join(" ")).not.toMatch(/rascunho|sem documentação/i);
    const semProva = prepareClosing({ ...DEMO_CTX, provas: [] }, lead);
    expect(semProva.casesRelevantes.join(" ")).toMatch(/não citar/i);
  });
  it("hipóteses de objeção ficam marcadas como HIPOTESE; as ditas pelo lead, CONFIRMADO", () => {
    expect(p.objecoes.find((o) => o.objecao === "Está caro")?.certeza).toBe("CONFIRMADO");
    expect(p.objecoes.filter((o) => /a antecipar/.test(o.objecao)).every((o) => o.certeza === "HIPOTESE")).toBe(true);
  });
  it("pacote de entrada usa o mesmo serviço recomendado no diagnóstico", () => {
    const entrada = p.possiveisPacotes.find((x) => x.nome === "Entrada + continuidade");
    expect(entrada?.servicos[0]).toBe("Landing page de encomendas");
  });
  it("nada inventado: nenhum número fora dos dados cadastrados/informados", () => {
    // a % de qualificação é métrica interna do sistema (não uma afirmação sobre o negócio)
    const txt = JSON.stringify({ ...p, resumoExecutivo: "" });
    expect(findUnsupportedNumbers(txt, allowedNumberSources(DEMO_CTX, [JSON.stringify(lead)]))).toEqual([]);
  });
});

describe("Registro do módulo comercial", () => {
  it("agentes com nomes e chaves únicos; ações do painel definidas", () => {
    expect(new Set(COMMERCIAL_AGENTS.map((a) => a.key)).size).toBe(COMMERCIAL_AGENTS.length);
    expect(new Set(COMMERCIAL_AGENTS.map((a) => a.name)).size).toBe(COMMERCIAL_AGENTS.length);
    expect(COMMERCIAL_AGENTS.find((a) => a.name === "Objection Engine")).toBeTruthy();
    expect(COMMERCIAL_AGENTS.find((a) => a.name === "Value Builder")).toBeTruthy();
    expect(COMMERCIAL_AGENTS.find((a) => a.name === "Deal Coach")).toBeTruthy();
    expect(COMMERCIAL_AGENTS.map((a) => a.action).filter(Boolean)).toEqual(["ANALISAR OPORTUNIDADE", "PREPARAR FECHAMENTO"]);
  });
  it("não altera o núcleo de 10 agentes (mudança de arquitetura depende de aprovação)", () => {
    expect(AGENTS.length).toBe(10);
    const nomes = new Set(AGENTS.map((a) => a.name));
    for (const a of COMMERCIAL_AGENTS) expect(nomes.has(a.name)).toBe(false);
  });
});
