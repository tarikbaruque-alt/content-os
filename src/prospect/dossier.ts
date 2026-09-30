import type { Lead, Operacao } from "./types.js";
import type { Analysis } from "./analyze.js";
import { isRefusal } from "./approach.js";
import { STAGE_LABEL, attempts } from "./pipeline.js";
import { nicheName } from "./context.js";

/** Resumo do prospect em texto, para colar em notas, CRM ou enviar a um sócio. Só o que está registrado. */
export function buildDossier(lead: Lead, a: Analysis, op: Operacao): string {
  const p = lead.profile;
  const L: string[] = [];
  L.push(`${p.nome} (@${p.handle}) — ${nicheName(lead, op)}${p.cidade ? `, ${p.cidade}` : ""}`);
  L.push(`Etapa: ${STAGE_LABEL[lead.status]} · Prioridade: ${a.score.prioridade} (${a.score.pontuacao}/100) · Qualificação: ${a.qual.qualificacaoPct}%`);
  if (lead.proximoContato) L.push(`Próximo contato: ${lead.proximoContato} · Follow-ups feitos: ${attempts(lead)}`);
  if (p.temaDominado) L.push(`Domina: ${p.temaDominado}`);
  L.push("");
  if (a.raiox.pontosFortes.length) { L.push("O QUE JÁ FAZ BEM"); for (const c of a.raiox.pontosFortes.slice(0, 3)) L.push(`- ${c.texto}`); L.push(""); }
  if (a.raiox.gargalos.length) {
    L.push("GARGALOS POSSÍVEIS (hipóteses, a validar)");
    for (const g of a.raiox.gargalos.slice(0, 4)) L.push(`- ${g.def.titulo}${g.certeza === "CONFIRMADO" ? " [confirmado pelo prospect]" : ""}`);
    L.push("");
  }
  const conf = a.raiox.dores.filter((d) => d.status === "CONFIRMADO");
  if (conf.length) { L.push("DORES CONFIRMADAS PELO PROSPECT"); for (const d of conf) L.push(`- ${d.label}`); L.push(""); }
  if (a.qual.objetivos.length) L.push(`OBJETIVOS: ${a.qual.objetivos.map((o) => o.rotulo).join(", ")}`, "");
  if (a.qual.estruturaAtual.length) { L.push("ESTRUTURA ATUAL"); for (const e of a.qual.estruturaAtual) L.push(`- ${e}`); L.push(""); }
  if (a.why.servicoPrincipal) L.push(`SERVIÇO QUE FAZ MAIS SENTIDO: ${a.why.servicoPrincipal.nome} · Potencial recorrente: ${a.offer.potencialRecorrente}`, "");
  if (a.qual.proximasPerguntas.length) { L.push("PRÓXIMAS PERGUNTAS"); for (const q of a.qual.proximasPerguntas.slice(0, 3)) L.push(`- ${q.pergunta}`); L.push(""); }
  if (!isRefusal(a.approach)) L.push("ABORDAGEM SUGERIDA", a.approach.variantes[0]!.texto, "");
  if (lead.historico?.length) { L.push("HISTÓRICO"); for (const h of lead.historico.slice(-6)) L.push(`- ${h.quando.slice(0, 10)} · ${h.evento === "contato" ? "follow-up enviado" : h.evento}`); }
  return L.join("\n").trim();
}
