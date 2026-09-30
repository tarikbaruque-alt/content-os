import type { Claim, CommercialContext, Lead, OpportunityDiagnosis } from "./types.js";
import { AREA_INSIGHTS, UPSELL_PATH } from "./knowledge.js";
import { assessLead, ticketFor } from "./assessment.js";
import { analyzeDiscovery } from "./discovery.js";
import { planAuthority } from "./authority.js";
import { buildValueChain } from "./value.js";
import { enforceClaimEvidence } from "./guardrails.js";
import { findService, needGaps, cap } from "./util.js";

/**
 * ANALISAR OPORTUNIDADE — diagnóstico comercial completo.
 * Cada afirmação sai com seu grau de certeza: OBSERVADO (visto e registrado),
 * HIPOTESE (inferência a validar) ou CONFIRMADO (dito pelo próprio lead).
 * Impacto/perda são descritos qualitativamente ("pode…"): nenhum número é inventado.
 */
export function analyzeOpportunity(ctx: CommercialContext, lead: Lead): OpportunityDiagnosis {
  const avaliacao = assessLead(ctx, lead);
  const discovery = analyzeDiscovery(lead);
  const authority = planAuthority(ctx, lead);
  const gaps = needGaps(lead);

  const situacaoAtual: Claim[] = [
    { texto: `Negócio do nicho "${lead.nicho}"${lead.cidade ? ` em ${lead.cidade}` : ""}.`, certeza: "OBSERVADO", evidencia: "cadastro do lead" },
    ...lead.sinais.map((s): Claim => ({ texto: s.observacao, certeza: "OBSERVADO", evidencia: s.fonte })),
  ];

  const confirmadas: Claim[] = discovery.campos
    .filter((c) => c.status === "identificado" && ["problema", "impacto", "resultadoEsperado"].includes(c.campo))
    .map((c) => ({ texto: `${c.rotulo}: "${c.evidencia}"`, certeza: "CONFIRMADO" as const, evidencia: "fala do próprio lead" }));

  const insights = gaps.flatMap((g) => {
    const i = AREA_INSIGHTS[g.area];
    return i ? [{ g, i }] : [];
  });
  const ev = (g: { observacao: string; fonte: string }) => `${g.observacao} (${g.fonte})`;

  const possiveisDores: Claim[] = [
    ...confirmadas.filter((c) => c.texto.startsWith("Problema")),
    ...insights.map(({ g, i }): Claim => ({ texto: cap(i.problema) + ".", certeza: "HIPOTESE", evidencia: ev(g) })),
  ];
  const oportunidadesDeCrescimento: Claim[] = insights.map(({ g, i }) => ({ texto: cap(i.oportunidade) + ".", certeza: "HIPOTESE" as const, evidencia: ev(g) }));
  const gargalosPercebidos: Claim[] = insights.map(({ g, i }) => ({ texto: cap(i.gargalo) + ".", certeza: "HIPOTESE" as const, evidencia: ev(g) }));
  const impactoDosGargalos: Claim[] = [
    ...confirmadas.filter((c) => c.texto.startsWith("Impacto")),
    ...insights.map(({ g, i }): Claim => ({ texto: cap(i.impacto) + ".", certeza: "HIPOTESE", evidencia: ev(g) })),
  ];
  const oQueOnegocioPodeEstarPerdendo: Claim[] = insights.map(({ g, i }) => ({ texto: cap(i.perdendo) + ".", certeza: "HIPOTESE" as const, evidencia: ev(g) }));

  // Serviços que ajudam: 1 por lacuna (categoria de maior aderência disponível no catálogo), sem repetir.
  const usados = new Set<string>();
  const comoNossosServicosAjudam: OpportunityDiagnosis["comoNossosServicosAjudam"] = [];
  for (const { i } of insights) {
    for (const cat of i.categorias) {
      const s = findService(ctx, cat);
      if (s && !usados.has(s.key)) {
        usados.add(s.key);
        comoNossosServicosAjudam.push({ servico: s.nome, cadeiaDeValor: buildValueChain(s.categoria) });
        break;
      }
    }
  }

  const melhor = avaliacao.melhorServico?.servico;
  const entradaDoCatalogo = ctx.servicos.find((s) => s.portaDeEntrada && comoNossosServicosAjudam.some((c) => c.servico === s.nome));
  const porta = entradaDoCatalogo ?? melhor;
  const melhorPortaDeEntrada = porta
    ? {
        servico: porta.nome,
        motivo: entradaDoCatalogo
          ? "É o serviço marcado como porta de entrada no catálogo e responde a uma lacuna observada."
          : "É o serviço mais aderente à lacuna mais grave observada; sem porta de entrada específica cadastrada.",
        ticket: ticketFor(porta),
      }
    : null;

  const oportunidadesDeUpsell: OpportunityDiagnosis["oportunidadesDeUpsell"] = [];
  if (porta) {
    const seen = new Set<string>([porta.key]);
    for (const cat of UPSELL_PATH[porta.categoria]) {
      const s = findService(ctx, cat);
      if (s && !seen.has(s.key)) {
        seen.add(s.key);
        oportunidadesDeUpsell.push({ servico: s.nome, motivo: `Continuidade natural após "${porta.nome}": amplia o resultado da primeira entrega.` });
      }
    }
  }

  const rec = ctx.servicos.find((s) => s.recorrente && (s.key !== porta?.key || true) && (comoNossosServicosAjudam.some((c) => c.servico === s.nome) || oportunidadesDeUpsell.some((u) => u.servico === s.nome)));
  const potencialDeContratoRecorrente = rec
    ? { existe: true, servico: rec.nome, motivo: `"${rec.nome}" é recorrente e conecta-se às lacunas/entregas propostas — hipótese a validar na conversa.` }
    : { existe: false, motivo: "Nenhum serviço recorrente do catálogo se conecta, com evidência, às lacunas observadas." };

  const argumentosParaGerarValor: string[] = [
    ...comoNossosServicosAjudam.map((c) => c.cadeiaDeValor.frase),
    ...authority.provasUsaveis.slice(0, 2).map((u) => `Prova verificada — ${u.prova.titulo}: ${u.comoUsar}`),
  ];
  if (authority.semProvaRelevante) argumentosParaGerarValor.push("Sem provas verificadas: sustentar valor com processo, metodologia e clareza de escopo (não citar cases).");

  const perguntasParaConfirmarHipoteses = insights.map(({ g, i }) => ({ pergunta: i.pergunta, confirma: cap(i.problema) + "." }));

  return {
    leadId: lead.id,
    situacaoAtual: situacaoAtual.map(enforceClaimEvidence),
    possiveisDores: possiveisDores.map(enforceClaimEvidence),
    oportunidadesDeCrescimento,
    gargalosPercebidos,
    impactoDosGargalos: impactoDosGargalos.map(enforceClaimEvidence),
    oQueOnegocioPodeEstarPerdendo,
    comoNossosServicosAjudam,
    melhorPortaDeEntrada,
    oportunidadesDeUpsell,
    potencialDeContratoRecorrente,
    argumentosParaGerarValor,
    perguntasParaConfirmarHipoteses,
    avaliacao,
  };
}
