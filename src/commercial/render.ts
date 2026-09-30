import type { ClosingPrep, Claim, DealCoachReport, DiscoveryReport, FirstApproach, FirstApproachRefusal, NegotiationAdvice, ObjectionAnalysis, OpportunityDiagnosis } from "./types.js";
import { fmtBRL } from "./util.js";

const TAG: Record<Claim["certeza"], string> = { OBSERVADO: "[OBSERVADO]", HIPOTESE: "[HIPÓTESE]", CONFIRMADO: "[CONFIRMADO]" };
const claims = (cs: Claim[]): string => (cs.length ? cs.map((c) => `- ${TAG[c.certeza]} ${c.texto}${c.evidencia ? ` — base: ${c.evidencia}` : ""}`).join("\n") : "- (sem dados suficientes)");
const list = (xs: string[]): string => (xs.length ? xs.map((x) => `- ${x}`).join("\n") : "- (nenhum)");

export function renderDiagnosis(d: OpportunityDiagnosis): string {
  const a = d.avaliacao;
  const t = a.possivelTicket;
  return [
    `# Diagnóstico comercial — prioridade ${a.prioridade} (${a.pontuacao}/100)`,
    `\n## SITUAÇÃO ATUAL\n${claims(d.situacaoAtual)}`,
    `\n## POSSÍVEIS DORES\n${claims(d.possiveisDores)}`,
    `\n## OPORTUNIDADES DE CRESCIMENTO\n${claims(d.oportunidadesDeCrescimento)}`,
    `\n## GARGALOS PERCEBIDOS\n${claims(d.gargalosPercebidos)}`,
    `\n## IMPACTO DESSES GARGALOS\n${claims(d.impactoDosGargalos)}`,
    `\n## O QUE O NEGÓCIO PODE ESTAR PERDENDO\n${claims(d.oQueOnegocioPodeEstarPerdendo)}`,
    `\n## COMO NOSSOS SERVIÇOS PODEM AJUDAR\n${d.comoNossosServicosAjudam.map((c) => `- **${c.servico}** — ${c.cadeiaDeValor.frase}`).join("\n") || "- (nenhum serviço do catálogo aderente)"}`,
    `\n## MELHOR PORTA DE ENTRADA\n${d.melhorPortaDeEntrada ? `- ${d.melhorPortaDeEntrada.servico} — ${d.melhorPortaDeEntrada.motivo}` : "- (indefinida)"}${d.melhorPortaDeEntrada?.ticket ? `\n- Ticket da porta de entrada (faixa cadastrada): ${fmtBRL(d.melhorPortaDeEntrada.ticket.minimo)}–${fmtBRL(d.melhorPortaDeEntrada.ticket.maximo)}${d.melhorPortaDeEntrada.ticket.periodicidade === "mensal" ? "/mês" : ""}` : ""}${t && a.melhorServico && a.melhorServico.servico.nome !== d.melhorPortaDeEntrada?.servico ? `\n- Ticket de "${a.melhorServico.servico.nome}" (faixa cadastrada): ${fmtBRL(t.minimo)}–${fmtBRL(t.maximo)}${t.periodicidade === "mensal" ? "/mês" : ""}` : ""}`,
    `\n## OPORTUNIDADES DE UPSELL\n${list(d.oportunidadesDeUpsell.map((u) => `${u.servico} — ${u.motivo}`))}`,
    `\n## POTENCIAL DE CONTRATO RECORRENTE\n- ${d.potencialDeContratoRecorrente.existe ? "Sim" : "Não evidenciado"} — ${d.potencialDeContratoRecorrente.motivo}`,
    `\n## ARGUMENTOS PARA GERAR VALOR\n${list(d.argumentosParaGerarValor)}`,
    `\n## PERGUNTAS PARA CONFIRMAR AS HIPÓTESES\n${list(d.perguntasParaConfirmarHipoteses.map((p) => `${p.pergunta}  (confirma: ${p.confirma})`))}`,
    a.lacunas.length ? `\n## LACUNAS DE INFORMAÇÃO\n${list(a.lacunas)}` : "",
  ].filter(Boolean).join("\n");
}

export function renderFirstApproach(r: FirstApproach | FirstApproachRefusal): string {
  if ("recusada" in r) return `# Primeira abordagem: NÃO GERADA\n${r.motivo}\n→ ${r.proximoPasso}`;
  return [
    `# Primeira abordagem`,
    `Motivo real do contato: ${r.motivoReal}`,
    ...r.variantes.map((v, i) => `\n## Variante ${i + 1} (${v.canal})${v.assunto ? `\nAssunto: ${v.assunto}` : ""}\n${v.texto}`),
    `\n## Avisos\n${list(r.avisos)}`,
  ].join("\n");
}

export function renderDiscovery(d: DiscoveryReport): string {
  return [
    `# Descoberta — qualificação ${d.qualificacaoPct}% ${d.qualificada ? "(campos críticos completos)" : "(faltam campos críticos)"}`,
    ...d.campos.map((c) => `- ${c.status === "identificado" ? "✔" : "○"} ${c.rotulo}${c.evidencia ? `: "${c.evidencia}"` : ""}`),
    `\n## Próximas perguntas (com finalidade)\n${list(d.proximasPerguntas.map((p) => `${p.pergunta}\n  ↳ ${p.finalidade}`))}`,
  ].join("\n");
}

export function renderObjection(o: ObjectionAnalysis): string {
  if (!o.detectada) return `# Objeção: não identificada\n${o.respostaConsultiva}\nPergunta: ${o.perguntaParaEntenderACausa}`;
  return [
    `# Objeção: ${o.explicita?.rotulo}${o.secundarias.length ? ` (+ ${o.secundarias.map((s) => s.rotulo).join(", ")})` : ""}`,
    `\n## Possíveis objeções implícitas\n${list(o.possiveisImplicitas)}`,
    `\n## 1º entender a causa\n${o.perguntaParaEntenderACausa}`,
    `\n## Resposta consultiva\n${o.respostaConsultiva}`,
    `\n## Reforço de valor\n${list(o.reforcoDeValor)}`,
    `\n## Redução de risco\n${list(o.reducaoDePercepcaoDeRisco)}`,
    `\n## Próximo passo\n${o.proximoPasso}`,
    o.abordagemDePreco ? `\n## Abordagem de preço\nEntender primeiro:\n${list(o.abordagemDePreco.entenderPrimeiro)}\nDesconto: ${o.abordagemDePreco.desconto.permitido ? `permitido até ${o.abordagemDePreco.desconto.ate}% (só depois de entender)` : `NÃO sugerir — ${o.abordagemDePreco.desconto.motivo}`}` : "",
    `\n## Não fazer\n${list(o.naoFazer)}`,
  ].filter(Boolean).join("\n");
}

export function renderNegotiation(n: NegotiationAdvice): string {
  return [
    `# Negociação`,
    `Contraproposta: ${n.contraPropostaSugerida}`,
    `\n## Opções (nesta ordem)\n${n.opcoesEmOrdem.map((o, i) => `${i + 1}. ${o.disponivel ? "✔" : "✖"} **${o.titulo}**${o.disponivel ? ` — ${o.comoApresentar}` : ` — indisponível: ${o.motivoIndisponivel}`}`).join("\n")}`,
    `\n## Alertas\n${list(n.alertas)}`,
  ].join("\n");
}

export function renderCoach(c: DealCoachReport): string {
  return [
    `# DEAL COACH — O que está impedindo este negócio de fechar?`,
    `**${c.oQueImpedeOFechamento}**`,
    `- Principal risco: ${c.principalRisco}`,
    `- Principal objeção: ${c.principalObjecao ?? "nenhuma declarada"}`,
    `- Informações faltantes: ${c.informacoesFaltantes.join("; ") || "nenhuma crítica"}`,
    `- Força da oportunidade: ${c.forcaDaOportunidade}`,
    `- Próximo movimento: ${c.proximoMovimento}`,
    `- Pergunta que pode destravar: ${c.perguntaQueDestrava}`,
    `- Argumento de valor: ${c.argumentoDeValor}`,
    `- Prova necessária: ${c.provaNecessaria}`,
    `- Melhor CTA: ${c.melhorCTA}`,
  ].join("\n");
}

export function renderClosing(p: ClosingPrep): string {
  return [
    `# PREPARAR FECHAMENTO`,
    `\n## Resumo executivo\n${p.resumoExecutivo}`,
    `\n## Objetivo do lead\n${claims(p.objetivoDoLead)}`,
    `\n## Dores\n${claims(p.dores)}`,
    `\n## Impacto\n${claims(p.impacto)}`,
    `\n## Desejos\n${claims(p.desejos)}`,
    `\n## Objeções\n${list(p.objecoes.map((o) => `${o.objecao} [${o.certeza}]`))}`,
    `\n## Orçamento\n${p.orcamento}`,
    `\n## Decisores\n${list(p.decisores)}`,
    `\n## Concorrentes\n${list(p.concorrentes)}`,
    `\n## Oportunidades\n${list(p.oportunidades)}`,
    `\n## Perguntas essenciais\n${list(p.perguntasEssenciais)}`,
    `\n## Argumentos\n${list(p.argumentos)}`,
    `\n## Cases relevantes\n${list(p.casesRelevantes)}`,
    `\n## Serviços / solução / pacotes\n${list(p.servicos)}\n- Solução: ${p.possivelSolucao}\n${list(p.possiveisPacotes.map((x) => `Pacote "${x.nome}": ${x.servicos.join(" + ")} — ${x.motivo}`))}`,
    `\n## Estratégia de fechamento\n${p.estrategiaDeFechamento}\n- Próximo passo: ${p.proximoPasso}`,
    `\n## Roteiro dinâmico`,
    ...p.roteiro.map((s) => `${s.ordem}. **${s.etapa}** [${s.modo}] — ${s.objetivo}\n${s.perguntasOuFalas.map((f) => `   - ${f}`).join("\n")}`),
  ].join("\n");
}
