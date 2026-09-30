import type { AuthorityPlan, CommercialContext, Lead, ProofItem } from "./types.js";
import { proofUsability } from "./guardrails.js";
import { norm } from "./util.js";

const HOW_TO_USE: Record<ProofItem["tipo"], string> = {
  case: "Contar o contexto, o que foi feito e o resultado documentado — sem extrapolar para este lead.",
  portfolio: "Mostrar trabalhos parecidos com o que o lead precisa e explicar as decisões por trás.",
  experiencia: "Citar o tempo/tipo de experiência exatamente como cadastrado.",
  metodologia: "Explicar as etapas do método e o que o lead recebe em cada uma.",
  processo: "Mostrar o passo a passo e os pontos de aprovação — reduz percepção de risco.",
  diferencial: "Conectar o diferencial a um problema concreto do lead.",
  especializacao: "Citar a especialização e ligar ao nicho do lead.",
  cliente: "Citar apenas clientes autorizados a serem mencionados.",
  resultado: "Citar o resultado exatamente como documentado, com contexto e prazo.",
  depoimento: "Usar o depoimento na íntegra ou o trecho autorizado.",
  estrutura: "Mostrar como a entrega é organizada (equipe, ferramentas, rotina).",
};

/** Quando NÃO há prova: eixos legítimos (sem inventar autoridade). */
const FALLBACK_AXES: { eixo: string; comoTrabalhar: string }[] = [
  { eixo: "Processo", comoTrabalhar: "Apresentar o passo a passo do trabalho e os pontos de aprovação." },
  { eixo: "Metodologia", comoTrabalhar: "Explicar como o diagnóstico vira estratégia e depois execução." },
  { eixo: "Clareza", comoTrabalhar: "Escopo, prazos e critérios de sucesso combinados por escrito." },
  { eixo: "Profissionalismo", comoTrabalhar: "Diagnóstico específico do negócio do lead, com observações reais e fontes." },
  { eixo: "Especialização", comoTrabalhar: "Falar do que o time realmente domina, sem ampliar o escopo da competência." },
];

/**
 * Seleciona apenas elementos LEGÍTIMOS de autoridade — só dados cadastrados e
 * verificados. Sem prova, NÃO cria: trabalha processo, metodologia, clareza,
 * profissionalismo e especialização.
 */
export function planAuthority(ctx: CommercialContext, lead: Lead): AuthorityPlan {
  const usaveis: AuthorityPlan["provasUsaveis"] = [];
  const naoUsar: AuthorityPlan["naoUsar"] = [];
  const nicho = norm(lead.nicho);

  for (const prova of ctx.provas) {
    const u = proofUsability(prova);
    if (!u.usavel) {
      naoUsar.push({ prova, motivo: u.motivo ?? "não utilizável" });
      continue;
    }
    const mesmoNicho = (prova.nichos ?? []).some((n) => norm(n) === nicho);
    usaveis.push({ prova, relevancia: mesmoNicho ? "alta" : "media", comoUsar: HOW_TO_USE[prova.tipo] });
  }
  usaveis.sort((a, b) => (a.relevancia === b.relevancia ? 0 : a.relevancia === "alta" ? -1 : 1));

  const semProvaRelevante = usaveis.length === 0;
  const avisos: string[] = [];
  if (semProvaRelevante) avisos.push("Nenhuma prova verificada disponível: não citar cases, números ou clientes. Trabalhar processo, metodologia e clareza.");
  if (naoUsar.length) avisos.push(`${naoUsar.length} item(ns) cadastrado(s) não pode(m) ser usado(s) como autoridade até serem verificados/documentados.`);
  if (usaveis.length && !usaveis.some((u) => u.relevancia === "alta")) {
    avisos.push("As provas verificadas não são do mesmo nicho do lead — apresentar como referência de método, não como resultado esperado.");
  }

  return {
    provasUsaveis: usaveis,
    naoUsar,
    semProvaRelevante,
    alternativasLegitimas: semProvaRelevante || usaveis.length < 2 ? FALLBACK_AXES : FALLBACK_AXES.slice(0, 2),
    avisos,
  };
}
