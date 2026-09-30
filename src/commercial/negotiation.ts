import type { CommercialContext, Lead, NegotiationAdvice, NegotiationOption, ObjectionKey, ServiceOffer } from "./types.js";
import { UPSELL_PATH } from "./knowledge.js";
import { discountPolicy } from "./guardrails.js";
import { pickBestService, ticketFor } from "./assessment.js";
import { buildValueChain } from "./value.js";
import { findService, fmtBRL } from "./util.js";

/**
 * NEGOCIAÇÃO — contra-propostas, escopo, prazos, fases, pacotes e recorrência.
 * Antes de qualquer concessão, avalia se dá para AUMENTAR VALOR. Prefere mexer
 * em escopo/fase/parcelamento/condição a mexer em preço. Desconto é a ÚLTIMA
 * opção e só existe se houver regra comercial cadastrada.
 */
export function adviseNegotiation(
  ctx: CommercialContext,
  lead: Lead,
  opts: { objecao?: ObjectionKey; servicoKey?: string } = {},
): NegotiationAdvice {
  const escolhido: ServiceOffer | undefined =
    ctx.servicos.find((s) => s.key === opts.servicoKey) ?? pickBestService(ctx, lead)?.servico ?? ctx.servicos[0];
  const regras = ctx.regras;
  const opcoes: NegotiationOption[] = [];

  // 1. valor
  opcoes.push({
    tipo: "aumentar_valor",
    titulo: "Reforçar o valor antes de conceder qualquer coisa",
    comoApresentar: escolhido
      ? `Reconfirmar o impacto que o lead descreveu e conectar: ${buildValueChain(escolhido.categoria).frase}`
      : "Reconfirmar o impacto que o lead descreveu e ligar a entrega ao objetivo dele.",
    protegeMargem: true,
    disponivel: true,
  });

  // 2. escopo — quem decide o que é essencial é a conversa, não o sistema
  const ents = escolhido?.entregaveis ?? [];
  opcoes.push({
    tipo: "reduzir_escopo",
    titulo: "Reduzir escopo em vez de preço",
    comoApresentar: ents.length > 1
      ? `Entregáveis cadastrados: ${ents.join("; ")}. Decida COM o lead o que é essencial para o objetivo dele, mantenha isso e adie o restante para uma 2ª fase.`
      : "Decida com o lead o que é essencial para o objetivo dele, mantenha isso e adie o restante para uma 2ª fase.",
    protegeMargem: true,
    disponivel: true,
  });

  // 3. fase inicial
  const entrada = escolhido?.portaDeEntrada ? escolhido : ctx.servicos.find((s) => s.portaDeEntrada);
  const faseOk = regras.faseInicialPermitida !== false;
  opcoes.push({
    tipo: "fase_inicial",
    titulo: "Criar uma fase inicial",
    comoApresentar: entrada
      ? `Começar por "${entrada.nome}" como fase inicial, com critério de sucesso combinado, e decidir a continuidade a partir dos resultados.`
      : "Propor uma fase inicial curta, com entregável e critério de sucesso combinados, e decidir a continuidade depois.",
    protegeMargem: true,
    disponivel: faseOk,
    ...(faseOk ? {} : { motivoIndisponivel: "fase inicial desativada nas regras comerciais" }),
  });

  // 4. parcelamento
  const parc = regras.parcelamentoMaxParcelas;
  opcoes.push({
    tipo: "parcelamento",
    titulo: "Parcelar",
    comoApresentar: parc && parc > 1 ? `Dividir o investimento em até ${parc}x, mantendo o mesmo escopo.` : "",
    protegeMargem: true,
    disponivel: !!parc && parc > 1,
    ...(!parc || parc <= 1 ? { motivoIndisponivel: "parcelamento não cadastrado nas regras comerciais" } : {}),
  });

  // 5. condição específica
  opcoes.push({
    tipo: "condicao_especifica",
    titulo: "Trocar flexibilidade por condição específica",
    comoApresentar: regras.descontoCondicoes?.length
      ? `Condições cadastradas que podem sustentar uma flexibilidade: ${regras.descontoCondicoes.join("; ")}.`
      : "Se houver flexibilidade, condicioná-la a algo em troca (ex.: prazo de decisão, compromisso recorrente) — definido por você antes da conversa.",
    protegeMargem: true,
    disponivel: true,
  });

  // 6. pacote / recorrência / upsell / downsell
  const recorrente = ctx.servicos.find((s) => s.recorrente);
  if (ctx.servicos.length >= 2) {
    opcoes.push({
      tipo: "pacote",
      titulo: "Pacote combinado",
      comoApresentar: `Unir ${[entrada ?? escolhido, recorrente].filter((x, i, a): x is ServiceOffer => !!x && a.indexOf(x) === i).map((s) => `"${s.nome}"`).join(" + ") || "os serviços aderentes"} em uma proposta única, com etapas e ganho de continuidade.`,
      protegeMargem: true,
      disponivel: true,
    });
  }
  if (recorrente) {
    opcoes.push({
      tipo: "recorrencia",
      titulo: "Transformar em contrato recorrente",
      comoApresentar: `Propor "${recorrente.nome}" como continuidade, justificando com a necessidade de acompanhamento e ajuste contínuo.`,
      protegeMargem: true,
      disponivel: true,
    });
  }
  if (escolhido) {
    const menor = ctx.servicos
      .filter((s) => s.key !== escolhido.key && s.recorrente === escolhido.recorrente && s.ticketMin != null && escolhido.ticketMin != null && s.ticketMin < escolhido.ticketMin)
      .sort((a, b) => (b.ticketMin ?? 0) - (a.ticketMin ?? 0))[0];
    const up = UPSELL_PATH[escolhido.categoria]
      .map((c) => findService(ctx, c))
      .find((s): s is ServiceOffer => !!s && s.key !== escolhido.key && s.key !== menor?.key);
    if (up) {
      opcoes.push({ tipo: "upsell", titulo: "Upsell", comoApresentar: `Depois da primeira entrega, oferecer "${up.nome}" como continuidade natural.`, protegeMargem: true, disponivel: true });
    }
    if (menor) {
      opcoes.push({ tipo: "downsell", titulo: "Downsell", comoApresentar: `Se o total pesar, começar por "${menor.nome}" e evoluir depois.`, protegeMargem: true, disponivel: true });
    }
  }

  // 7. desconto — sempre por último
  const d = discountPolicy(regras);
  opcoes.push({
    tipo: "desconto",
    titulo: "Desconto (último recurso)",
    comoApresentar: d.permitido
      ? `Regra cadastrada: até ${d.ate}%${d.condicoes ? `, sob condições: ${d.condicoes.join("; ")}` : ""}. Só usar depois de esgotar as opções acima.`
      : "",
    protegeMargem: false,
    disponivel: d.permitido,
    ...(d.permitido ? {} : { motivoIndisponivel: d.motivo ?? "sem regra" }),
  });

  const alertas = ["Sempre preserve margem: mude escopo, fase, parcelamento ou condição antes de mexer no preço."];
  if (regras.margemMinimaPct != null) alertas.push(`Margem mínima cadastrada: ${regras.margemMinimaPct}%.`);
  if (opts.objecao === "preco" || opts.objecao === "esta_caro") alertas.push("Objeção de preço: só entre na negociação depois de entender comparação, orçamento e prioridade.");

  const baseSvc = faseOk && entrada ? entrada : escolhido;
  const t = ticketFor(baseSvc);
  const base = fase(entrada, recorrente, escolhido, faseOk);
  const contraPropostaSugerida = t
    ? `${base} (faixa cadastrada de "${baseSvc?.nome}": ${fmtBRL(t.minimo)} a ${fmtBRL(t.maximo)}${t.periodicidade === "mensal" ? " por mês" : ""}).`
    : `${base}`;

  return { leadId: lead.id, opcoesEmOrdem: opcoes, contraPropostaSugerida, alertas };
}

function fase(entrada: ServiceOffer | undefined, rec: ServiceOffer | undefined, escolhido: ServiceOffer | undefined, faseOk: boolean): string {
  if (faseOk && entrada && rec && entrada.key !== rec.key) return `Contraproposta: iniciar por "${entrada.nome}" e, validados os resultados, avançar para "${rec.nome}"`;
  if (faseOk && entrada) return `Contraproposta: iniciar por "${entrada.nome}" como fase inicial, com critério de sucesso combinado`;
  if (escolhido) return `Contraproposta: manter o foco em "${escolhido.nome}" com escopo reduzido ao que move o resultado principal`;
  return "Contraproposta: reduzir o escopo ao que move o resultado principal e combinar fases";
}
