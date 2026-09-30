import type { Lead, Operacao, ProofItem } from "./types.js";
import type { RaioX } from "./raiox.js";
import type { QualReport } from "./qualification.js";
import type { OfferPlan, WhyUs } from "./offer.js";
import { SERVICE_BY_KEY } from "./catalog-services.js";
import { proofUsability, validateOutbound } from "./guardrails.js";
import { lc, nicheName } from "./context.js";

export type PitchSection = { titulo: string; texto: string; certeza: "OBSERVADO" | "HIPOTESE" | "CONFIRMADO" | "SISTEMA"; nota?: string };
export type Pitch = {
  secoes: PitchSection[];
  texto: string;
  entradasUsadas: { entrada: string; valor: string | null }[];
  semDiferencialCadastrado: boolean;
  avisos: string[];
};

/**
 * CRIAR PITCH: CENÁRIO + PROBLEMA + IMPACTO + OPORTUNIDADE + SOLUÇÃO + DIFERENCIAL + PRÓXIMO PASSO.
 * Usa nicho, objetivo, dor, posicionamento, estrutura atual e oportunidade.
 * DIFERENCIAL vem só dos diferenciais que VOCÊ cadastrou e verificou.
 */
export function buildPitch(lead: Lead, raiox: RaioX, qual: QualReport, op: Operacao, why: WhyUs, offer: OfferPlan): Pitch {
  const p = lead.profile;
  const top = raiox.gargalos[0];
  const nicho = nicheName(lead, op);
  const objetivos = qual.objetivos.map((o) => o.rotulo.toLowerCase());
  const doresConf = raiox.dores.filter((d) => d.status === "CONFIRMADO");
  const posic = raiox.dims.find((d) => d.key === "posicionamento");
  const posicTxt = posic && posic.nota !== "nao_avaliado" ? `posicionamento ${posic.nota}${posic.obs ? ` (${posic.obs})` : ""}` : p.bio ? `bio: "${p.bio.slice(0, 120)}"` : null;
  const estrutura = qual.estruturaAtual;
  const avisos: string[] = [];

  const entradasUsadas = [
    { entrada: "Nicho", valor: nicho },
    { entrada: "Objetivo", valor: objetivos.length ? objetivos.join(", ") : null },
    { entrada: "Dor", valor: doresConf.length ? doresConf.map((d) => d.label).join(", ") : top ? `${top.def.titulo.replace(/\.$/, "")} (hipótese)` : null },
    { entrada: "Posicionamento", valor: posicTxt },
    { entrada: "Estrutura atual", valor: estrutura.length ? estrutura.join("; ") : null },
    { entrada: "Oportunidade", valor: why.oportunidade?.texto ?? null },
  ];
  for (const e of entradasUsadas) if (!e.valor) avisos.push(`Sem "${e.entrada.toLowerCase()}": o pitch fica mais genérico nesse ponto.`);

  const fatos = [
    p.temaDominado ? `atua com ${p.temaDominado}` : null,
    ...raiox.pontosFortes.filter((c) => !/^Demonstra domínio/.test(c.texto)).slice(0, 1).map((c) => lc(c.texto.replace(/\.$/, ""))),
  ].filter(Boolean);
  const cenario: PitchSection = {
    titulo: "CENÁRIO", certeza: "OBSERVADO",
    texto: `${p.nome} (${nicho}${p.cidade ? `, ${p.cidade}` : ""})${fatos.length ? ` ${fatos.join("; ")}` : ""}.${objetivos.length ? ` O objetivo com o Instagram é ${objetivos.join(" e ")}.` : ""}${estrutura.length ? ` Hoje: ${estrutura.join("; ").toLowerCase()}.` : ""}`,
    nota: "Fatos informados por você e ditos pelo lead.",
  };

  const problema: PitchSection = doresConf.length
    ? { titulo: "PROBLEMA", certeza: "CONFIRMADO", texto: `Você mesmo apontou: ${doresConf.map((d) => lc(d.label)).join("; ")}.`, nota: "Dor citada pelo próprio lead." }
    : top
      ? { titulo: "PROBLEMA", certeza: "HIPOTESE", texto: `Pelo que observei, ${lc(top.def.titulo.replace(/\.$/, ""))} — e quero validar isso com você.`, nota: "Hipótese: confirme antes de tratar como fato." }
      : { titulo: "PROBLEMA", certeza: "HIPOTESE", texto: "Ainda não há base para apontar um problema: comece perguntando.", nota: "Complete o Raio-X ou a qualificação." };

  const impacto: PitchSection = top
    ? { titulo: "IMPACTO", certeza: "HIPOTESE", texto: `Isso ${top.def.impacto}.`, nota: "Descrição qualitativa; sem números." }
    : { titulo: "IMPACTO", certeza: "HIPOTESE", texto: "Impacto a definir depois de entender o problema." };
  const oportunidade: PitchSection = { titulo: "OPORTUNIDADE", certeza: "HIPOTESE", texto: why.oportunidade?.texto ?? "Oportunidade a definir." };

  const svc = why.servicoPrincipal ? SERVICE_BY_KEY[why.servicoPrincipal.key] : null;
  const solucao: PitchSection = {
    titulo: "SOLUÇÃO", certeza: "SISTEMA",
    texto: svc ? `${svc.frase} ${offer.potencialRecorrente !== "indefinido" ? `O caminho natural é começar por ${offer.escada[1]!.servicos.join(" ou ").toLowerCase()} e evoluir para ${offer.contratoRecorrente.nome.toLowerCase()}: ${offer.contratoRecorrente.frase}` : ""}`.trim() : "Solução a definir após o diagnóstico.",
    nota: "Descrito em valor (entregável → benefício → impacto → valor comercial), não em quantidade de posts.",
  };

  const usaveis: ProofItem[] = op.diferenciais.filter((d) => proofUsability(d).usavel);
  const semDif = usaveis.length === 0;
  const difTxt = semDif
    ? op.processo.length
      ? `Um processo definido e transparente: ${op.processo.join(" → ")}.`
      : "Escopo, prazos e critérios de sucesso combinados por escrito antes de começar."
    : usaveis.slice(0, 2).map((d) => `${d.titulo}: ${d.descricao}`).join(" · ");
  if (semDif) avisos.push("Nenhum diferencial verificado em 'Minha operação': o DIFERENCIAL usa só processo/clareza de escopo. Cadastre seus diferenciais reais para personalizar.");
  const diferencial: PitchSection = { titulo: "DIFERENCIAL", certeza: semDif ? "SISTEMA" : "OBSERVADO", texto: difTxt, nota: semDif ? "Sem diferencial cadastrado: nada foi inventado." : "Diferencial cadastrado e verificado por você." };

  const proximo: PitchSection = { titulo: "PRÓXIMO PASSO", certeza: "SISTEMA", texto: top ? "Se fizer sentido, marcamos uma conversa curta para validar essas observações e desenhar o primeiro ciclo. Posso enviar antes uma mini auditoria com o que observei." : "Uma conversa curta para entender objetivos e rotina, antes de qualquer proposta." };

  const secoes = [cenario, problema, impacto, oportunidade, solucao, diferencial, proximo];
  const texto = secoes.map((s) => `${s.titulo}\n${s.texto}`).join("\n\n");
  const allowed = [...lead.conversa.map((m) => m.texto), ...Object.values(lead.qual), p.nome, p.bio ?? "", ...p.notas.map((n) => n.texto), ...raiox.pontosFortes.map((c) => c.texto), ...estrutura];
  const viol = validateOutbound(texto, op, { extraAllowed: allowed });
  if (viol.length) avisos.push(...viol);
  return { secoes, texto, entradasUsadas, semDiferencialCadastrado: semDif, avisos };
}
