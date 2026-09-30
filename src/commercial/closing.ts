import type { Claim, ClosingPrep, CommercialContext, Lead, ScriptStep } from "./types.js";
import { DISCOVERY_FIELDS, SCRIPT_STEPS } from "./knowledge.js";
import { analyzeOpportunity } from "./diagnosis.js";
import { analyzeDiscovery } from "./discovery.js";
import { analyzeObjection } from "./objections.js";
import { planAuthority } from "./authority.js";
import { buildValueChain } from "./value.js";
import { fmtBRL, leadTexts } from "./util.js";

/**
 * PREPARAR FECHAMENTO — resumo executivo + roteiro dinâmico de reunião.
 * O roteiro se ADAPTA: etapas já respondidas viram "confirmar"; as abertas
 * viram "descobrir"; as de apresentação usam os argumentos do diagnóstico.
 */
export function prepareClosing(ctx: CommercialContext, lead: Lead): ClosingPrep {
  const diag = analyzeOpportunity(ctx, lead);
  const disc = analyzeDiscovery(lead);
  const auth = planAuthority(ctx, lead);
  const obj = analyzeObjection(ctx, lead);
  const campo = (k: string) => disc.campos.find((c) => c.campo === k);
  const claimDe = (k: string): Claim[] => {
    const c = campo(k);
    return c?.status === "identificado" && c.evidencia
      ? [{ texto: c.evidencia, certeza: "CONFIRMADO", evidencia: "fala do próprio lead / cadastro" }]
      : [];
  };

  const melhor = diag.avaliacao.melhorServico?.servico;
  const servicos = diag.comoNossosServicosAjudam.map((c) => c.servico);

  const entrada = ctx.servicos.find((s) => s.nome === diag.melhorPortaDeEntrada?.servico) ?? ctx.servicos.find((s) => s.portaDeEntrada);
  const recorrente = ctx.servicos.find((s) => s.recorrente);
  const pacotes: ClosingPrep["possiveisPacotes"] = [];
  if (entrada && recorrente && entrada.key !== recorrente.key) {
    pacotes.push({ nome: "Entrada + continuidade", servicos: [entrada.nome, recorrente.nome], motivo: "Começa com baixo atrito e cria base para contrato recorrente." });
  }
  if (servicos.length >= 2) {
    pacotes.push({ nome: "Solução integrada", servicos: servicos.slice(0, 3), motivo: "Cobre mais de uma lacuna observada em uma única proposta, com etapas." });
  }
  if (!pacotes.length && melhor) pacotes.push({ nome: `Fase inicial — ${melhor.nome}`, servicos: [melhor.nome], motivo: "Único serviço aderente cadastrado." });

  const objecoes: ClosingPrep["objecoes"] = [];
  if (obj.explicita) objecoes.push({ objecao: obj.explicita.rotulo, certeza: "CONFIRMADO" });
  obj.secundarias.forEach((s) => objecoes.push({ objecao: s.rotulo, certeza: "CONFIRMADO" }));
  if (!campo("investimento") || campo("investimento")?.status === "lacuna") objecoes.push({ objecao: "Preço/orçamento (a antecipar)", certeza: "HIPOTESE" });
  if (campo("outrosDecisores")?.status === "identificado") objecoes.push({ objecao: "Sócio / outros decisores (a antecipar)", certeza: "HIPOTESE" });

  const roteiro: ScriptStep[] = SCRIPT_STEPS.map((def, i) => {
    const ordem = i + 1;
    if (def.tipo === "discovery" && def.campos) {
      const abertos = def.campos.filter((k) => campo(k)?.status === "lacuna");
      const conhecidos = def.campos.filter((k) => campo(k)?.status === "identificado");
      if (abertos.length === 0) {
        return {
          ordem, etapa: def.etapa, modo: "confirmar", objetivo: def.objetivo,
          perguntasOuFalas: conhecidos.map((k) => `Confirmar o que entendi: "${campo(k)?.evidencia}". Está correto? Algo mudou?`),
        };
      }
      return {
        ordem, etapa: def.etapa, modo: "descobrir", objetivo: def.objetivo,
        perguntasOuFalas: [
          ...conhecidos.map((k) => `(já sabemos) Confirmar: "${campo(k)?.evidencia}"`),
          ...abertos.map((k) => DISCOVERY_FIELDS[k].pergunta(lead.nicho, diag.avaliacao.possiveisProblemas[0]?.evidencia ? `${diag.avaliacao.possiveisProblemas[0].evidencia}` : "")),
        ],
      };
    }
    return { ordem, etapa: def.etapa, modo: def.tipo === "apresentacao" ? "apresentar" : "conduzir", objetivo: def.objetivo, perguntasOuFalas: falasFixas(def.etapa, ctx, lead, diag, auth, obj, melhor?.categoria) };
  });

  const objetivo = claimDe("resultadoEsperado");
  const proximoPasso = disc.qualificada
    ? "Sair da reunião com decisão ou data de decisão, responsável e próximo entregável definidos."
    : "Sair da reunião com as lacunas críticas respondidas e uma data para apresentar a proposta.";

  const resumo = [
    `${lead.nome} (${lead.nicho}${lead.cidade ? `, ${lead.cidade}` : ""}).`,
    `Prioridade: ${diag.avaliacao.prioridade}. Qualificação: ${disc.qualificacaoPct}%${disc.qualificada ? " (campos críticos completos)" : ` — faltam: ${disc.camposCriticosEmFalta.map((k) => DISCOVERY_FIELDS[k].rotulo.toLowerCase()).join(", ")}`}.`,
    melhor ? `Melhor entrada: ${melhor.nome}.` : "Sem serviço aderente no catálogo.",
    obj.detectada && obj.explicita ? `Objeção em aberto: ${obj.explicita.rotulo}.` : "Sem objeção declarada.",
  ].join(" ");

  return {
    leadId: lead.id,
    resumoExecutivo: resumo,
    objetivoDoLead: objetivo,
    dores: [...claimDe("problema"), ...diag.possiveisDores.filter((c) => c.certeza === "HIPOTESE")],
    impacto: [...claimDe("impacto"), ...diag.impactoDosGargalos.filter((c) => c.certeza === "HIPOTESE")],
    desejos: [...claimDe("querer"), ...objetivo],
    objecoes,
    orcamento: lead.orcamentoInformado ?? (campo("investimento")?.evidencia ?? "Não informado — descobrir na reunião."),
    decisores: lead.decisores?.length ? lead.decisores : campo("autoridadeDeDecisao")?.status === "identificado" ? [campo("autoridadeDeDecisao")!.evidencia ?? ""] : ["Não confirmado — perguntar."],
    concorrentes: lead.concorrentes?.length ? lead.concorrentes : ["Não informado."],
    oportunidades: diag.oportunidadesDeCrescimento.map((c) => c.texto),
    perguntasEssenciais: disc.proximasPerguntas.map((p) => `${p.pergunta}  — (${p.finalidade})`),
    argumentos: diag.argumentosParaGerarValor,
    casesRelevantes: auth.provasUsaveis.length
      ? auth.provasUsaveis.map((u) => `${u.prova.titulo} (${u.relevancia})`)
      : ["Nenhum case/prova verificado cadastrado — não citar."],
    servicos,
    possivelSolucao: melhor
      ? `${melhor.nome}${diag.melhorPortaDeEntrada ? ` como porta de entrada` : ""}${diag.potencialDeContratoRecorrente.existe ? `, com continuidade em "${diag.potencialDeContratoRecorrente.servico}"` : ""}.`
      : "A definir após a descoberta.",
    possiveisPacotes: pacotes,
    estrategiaDeFechamento: disc.qualificada
      ? "Apresentar a solução ancorada no problema e no objetivo confirmados, tratar objeções entendendo a causa e fechar com um próximo passo datado."
      : "Não apresentar valores ainda: completar a descoberta, depois propor a solução — proposta genérica reduz a chance de fechar.",
    proximoPasso,
    roteiro,
  };
}

function falasFixas(
  etapa: string, ctx: CommercialContext, lead: Lead,
  diag: ReturnType<typeof analyzeOpportunity>, auth: ReturnType<typeof planAuthority>,
  obj: ReturnType<typeof analyzeObjection>, categoria?: Parameters<typeof buildValueChain>[0],
): string[] {
  switch (etapa) {
    case "Contexto": return ["Alinhar objetivo da conversa, tempo disponível e o que cada um espera sair com."];
    case "Rapport": {
      const s = lead.sinais.find((x) => x.avaliacao === "forte") ?? lead.sinais[0];
      return [s ? `Abrir com algo real e específico: "${s.observacao}" (${s.fonte}).` : "Abrir com curiosidade genuína sobre a história do negócio."];
    }
    case "Solução": return [diag.melhorPortaDeEntrada ? `Apresentar "${diag.melhorPortaDeEntrada.servico}" como resposta direta ao problema confirmado.` : "Apresentar a solução só depois de confirmar o problema."];
    case "Demonstração de valor": return categoria ? [buildValueChain(categoria).frase] : diag.argumentosParaGerarValor.slice(0, 1);
    case "Redução de risco":
      return [
        ...(ctx.agencia.processo?.length ? [`Mostrar o processo: ${ctx.agencia.processo.join(" → ")}.`] : ["Mostrar etapas, entregáveis e pontos de aprovação (cadastre o processo para personalizar)."]),
        ...(auth.provasUsaveis[0] ? [`Prova verificada: ${auth.provasUsaveis[0].prova.titulo}.`] : ["Sem provas verificadas: não citar cases; trabalhar clareza de escopo e critérios de sucesso."]),
      ];
    case "Investimento (apresentação)": {
      const t = diag.avaliacao.possivelTicket;
      return [t ? `Ancorar no valor antes do preço. Faixa cadastrada do serviço-base: ${fmtBRL(t.minimo)}–${fmtBRL(t.maximo)}${t.periodicidade === "mensal" ? "/mês" : ""}.` : "Ancorar no valor antes do preço (sem faixa cadastrada: definir antes da reunião)."];
    }
    case "Tratamento de objeções":
      return obj.detectada ? [`Objeção em aberto: ${obj.explicita?.rotulo}. Pergunta de causa: ${obj.perguntaParaEntenderACausa}`] : ["Perguntar: o que ainda ficou em aberto? Ouvir antes de responder."];
    case "Próximo passo": return ["Combinar próximo passo com data e responsável (decisão, reunião com decisor, ou envio de proposta)."];
    default: return [];
  }
}
export { leadTexts };
