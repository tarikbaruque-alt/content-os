import type { DiscoveryField, DiscoveryFieldKey, DiscoveryReport, Lead } from "./types.js";
import { DISCOVERY_FIELDS } from "./knowledge.js";
import { ensureEnd, leadTexts, needGaps, snippet } from "./util.js";

const KEYS = Object.keys(DISCOVERY_FIELDS) as DiscoveryFieldKey[];

/**
 * Descoberta de necessidade — analisa o que o PRÓPRIO lead disse (e os dados
 * cadastrados) e devolve o que já está identificado e o que ainda é lacuna.
 * Cada pergunta sugerida tem finalidade comercial explícita; nada de pergunta genérica.
 */
export function analyzeDiscovery(lead: Lead): DiscoveryReport {
  const texts = leadTexts(lead);
  const campos: DiscoveryField[] = KEYS.map((key) => {
    const def = DISCOVERY_FIELDS[key];
    // dados cadastrados também valem como evidência
    let cadastrado: string | undefined;
    if (key === "investimento" && lead.orcamentoInformado) cadastrado = `Orçamento informado: ${lead.orcamentoInformado}`;
    if (key === "outrosDecisores" && lead.decisores?.length) cadastrado = `Decisores: ${lead.decisores.join(", ")}`;
    if (key === "solucoesJaTentadas" && (lead.solucoesTentadas?.length || lead.fornecedorAtual)) {
      cadastrado = `Já tentou: ${[...(lead.solucoesTentadas ?? []), lead.fornecedorAtual ? `fornecedor atual (${lead.fornecedorAtual})` : ""].filter(Boolean).join("; ")}`;
    }
    if (cadastrado) return { campo: key, rotulo: def.rotulo, status: "identificado" as const, evidencia: snippet(cadastrado) };

    const hit = texts.find((t) => def.padroes.some((re) => re.test(t)));
    return hit
      ? { campo: key, rotulo: def.rotulo, status: "identificado" as const, evidencia: snippet(hit) }
      : { campo: key, rotulo: def.rotulo, status: "lacuna" as const };
  });

  const identificados = campos.filter((c) => c.status === "identificado").length;
  const criticos = KEYS.filter((k) => DISCOVERY_FIELDS[k].critico);
  const camposCriticosEmFalta = criticos.filter((k) => campos.find((c) => c.campo === k)?.status === "lacuna");

  const hint = needGaps(lead)[0]?.observacao;
  const proximasPerguntas = campos
    .filter((c) => c.status === "lacuna")
    .sort((a, b) => DISCOVERY_FIELDS[a.campo].prioridade - DISCOVERY_FIELDS[b.campo].prioridade)
    .slice(0, 5)
    .map((c) => ({
      campo: c.campo,
      pergunta: DISCOVERY_FIELDS[c.campo].pergunta(lead.nicho, hint ? ensureEnd(hint) : ""),
      finalidade: DISCOVERY_FIELDS[c.campo].finalidade,
    }));

  return {
    leadId: lead.id,
    campos,
    qualificacaoPct: Math.round((identificados / KEYS.length) * 100),
    qualificada: camposCriticosEmFalta.length === 0,
    camposCriticosEmFalta,
    proximasPerguntas,
  };
}
