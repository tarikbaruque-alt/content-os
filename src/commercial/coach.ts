import type { CommercialContext, Deal, DealCoachReport } from "./types.js";
import { OBJECTIONS, DISCOVERY_FIELDS } from "./knowledge.js";
import { analyzeDiscovery } from "./discovery.js";
import { analyzeObjection } from "./objections.js";
import { planAuthority } from "./authority.js";
import { pickBestService } from "./assessment.js";
import { buildValueChain } from "./value.js";
import { leadTexts, needGaps } from "./util.js";

/**
 * DEAL COACH — "O que está impedindo este negócio de fechar?"
 * Diagnostica a oportunidade e indica o próximo movimento; não decide por você.
 */
export function coachDeal(ctx: CommercialContext, deal: Deal): DealCoachReport {
  const { lead } = deal;
  const discovery = analyzeDiscovery(lead);
  const ultima = leadTexts(lead).at(-1);
  const obj = analyzeObjection(ctx, lead, ultima);
  const authority = planAuthority(ctx, lead);
  const melhor = pickBestService(ctx, lead);
  const faltantes = discovery.camposCriticosEmFalta.map((k) => DISCOVERY_FIELDS[k].rotulo);
  const silencio = !!deal.propostaEnviada && (deal.diasSemResposta ?? 0) >= 5;

  let oQueImpede: string;
  let principalRisco: string;
  if (obj.detectada && obj.explicita) {
    oQueImpede = `Objeção declarada: ${obj.explicita.rotulo}. Antes de responder, é preciso entender a causa.`;
    principalRisco = "Responder à objeção errada (a explícita pode esconder outra) e perder a confiança.";
  } else if (faltantes.length) {
    oQueImpede = `Falta qualificação: ${faltantes.join(", ")}. Sem isso a proposta tende a ser genérica.`;
    principalRisco = "Enviar proposta sem dor, impacto, objetivo, decisor ou orçamento confirmados.";
  } else if (silencio) {
    oQueImpede = `Silêncio há ${deal.diasSemResposta} dias após a proposta: possível prioridade, timing ou objeção não dita.`;
    principalRisco = "Insistir com pressão e queimar a relação; ou deixar o negócio esfriar sem próximo passo.";
  } else {
    oQueImpede = "Nenhum bloqueio claro identificado nas informações registradas: falta um próximo passo com data.";
    principalRisco = "O negócio esfriar por falta de um compromisso concreto.";
  }

  const criticosOk = discovery.camposCriticosEmFalta.length === 0;
  const forca: DealCoachReport["forcaDaOportunidade"] =
    obj.detectada ? "media" : criticosOk && discovery.qualificacaoPct >= 60 ? "alta" : discovery.qualificacaoPct >= 35 ? "media" : "baixa";

  const perguntaQueDestrava = obj.detectada
    ? obj.perguntaParaEntenderACausa
    : discovery.proximasPerguntas[0]?.pergunta ?? "O que precisaria estar claro para você decidir com segurança?";

  const argumento = melhor ? buildValueChain(melhor.servico.categoria).frase : "Reforçar o impacto que o próprio lead descreveu e conectar à solução proposta.";

  const provaNecessaria = deal.provasNecessarias?.length
    ? deal.provasNecessarias.join("; ")
    : authority.provasUsaveis[0]
      ? `Usar prova verificada: ${authority.provasUsaveis[0].prova.titulo}.`
      : "Nenhuma prova verificada cadastrada: apoiar-se em processo, metodologia e clareza de escopo (não citar cases).";

  const melhorCTA = obj.detectada
    ? obj.proximoPasso
    : faltantes.length
      ? "Propor uma conversa curta de diagnóstico para confirmar dor, objetivo, prazo e decisor."
      : deal.propostaEnviada
        ? "Propor uma conversa de 15 minutos para tirar dúvidas da proposta e definir a decisão."
        : "Propor uma reunião para apresentar a solução, ancorada no problema que ele confirmou.";

  const proximoMovimento = obj.detectada
    ? `Fazer a pergunta de causa e ouvir: "${obj.perguntaParaEntenderACausa}"`
    : faltantes.length
      ? `Completar a descoberta (${discovery.proximasPerguntas.slice(0, 2).map((p) => DISCOVERY_FIELDS[p.campo].rotulo.toLowerCase()).join(", ")}).`
      : melhorCTA;

  const informacoesFaltantes = [
    ...faltantes,
    ...(needGaps(lead).length === 0 ? ["Nenhuma observação de lacuna registrada sobre o negócio."] : []),
  ];

  return {
    leadId: lead.id,
    oQueImpedeOFechamento: oQueImpede,
    principalRisco,
    principalObjecao: obj.explicita ? OBJECTIONS[obj.explicita.chave].rotulo : null,
    informacoesFaltantes,
    forcaDaOportunidade: forca,
    proximoMovimento,
    perguntaQueDestrava,
    argumentoDeValor: argumento,
    provaNecessaria,
    melhorCTA,
  };
}
