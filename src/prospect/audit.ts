import type { Claim, Lead, Operacao } from "./types.js";
import type { RaioX } from "./raiox.js";
import type { QualReport } from "./qualification.js";
import { SERVICE_BY_KEY } from "./catalog-services.js";
import { serviceActive, cap } from "./context.js";
import { validateOutbound } from "./guardrails.js";

export type MiniAudit = {
  semBase: boolean;
  semaforo: { rotulo: string; nota: "forte" | "regular" | "fraca" | "ausente" }[];
  jaFazBem: Claim[];
  oportunidade: Claim | null;
  problema: Claim | null;
  melhoria: string | null;
  estrategiaInicial: string | null;
  proximoPasso: string;
  /** Versão curta, pronta para copiar e colar. */
  texto: string;
  avisos: string[];
};

const SEMAFORO_KEYS = ["bio", "posicionamento", "frequencia", "cta", "prova_social", "conversao"] as const;

/**
 * MINI AUDITORIA DE CONTEÚDO — curta e visual, para gerar percepção de valor ANTES da contratação.
 * 1 O que o perfil já faz bem · 2 Oportunidade · 3 Problema que isso pode causar ·
 * 4 Possível melhoria · 5 Estratégia inicial · 6 Próximo passo.
 * Só usa dados registrados; nunca inventa elogio.
 */
export function buildMiniAudit(lead: Lead, raiox: RaioX, qual: QualReport, op: Operacao): MiniAudit {
  const top = raiox.gargalos[0];
  const semaforo = SEMAFORO_KEYS.flatMap((k) => {
    const d = raiox.dims.find((x) => x.key === k)!;
    return d.nota === "nao_avaliado" ? [] : [{ rotulo: d.label, nota: d.nota }];
  });
  const jaFazBem = raiox.pontosFortes.slice(0, 3);
  const avisos: string[] = [];
  if (raiox.confianca === "baixa") avisos.push("Poucas dimensões avaliadas: revise antes de enviar.");
  if (!jaFazBem.length) avisos.push("Nenhum ponto forte registrado: preencha o Raio-X para não abrir sem reconhecer o que o perfil já faz bem (e sem inventar elogio).");

  if (!top) {
    return {
      semBase: true, semaforo, jaFazBem, oportunidade: null, problema: null, melhoria: null, estrategiaInicial: null,
      proximoPasso: "Conversar para entender objetivos e rotina antes de propor qualquer coisa.",
      texto: "Ainda sem base suficiente para uma mini auditoria: complete o Raio-X.",
      avisos: [...avisos, "Nenhum gargalo identificado nos dados informados."],
    };
  }

  const entrada = top.def.servicos.map((k) => SERVICE_BY_KEY[k]).find((s) => s.papel === "entrada" && serviceActive(op, s.key)) ?? SERVICE_BY_KEY.estrategia_conteudo;
  const evid = top.evidencias[0] ?? "";
  const oportunidade: Claim = { texto: cap(top.def.oportunidade) + ".", certeza: "HIPOTESE", evidencia: evid };
  const problema: Claim = { texto: `Isso ${top.def.impacto}.`, certeza: "HIPOTESE", evidencia: evid };
  const melhoria = cap(top.def.melhoria) + ".";
  const estrategiaInicial = `${cap(top.def.estrategiaInicial)}. Cada formato com um papel: Reels para descoberta, carrosséis para aprofundar e Stories para relacionamento. Ponto de partida sugerido: ${entrada.nome.toLowerCase()}.`;
  const proximoPasso = "Validar essas observações com você em uma conversa curta e, se fizer sentido, desenhar o plano do primeiro ciclo.";

  const linhas = [
    `✔ O que já faz bem: ${jaFazBem.length ? jaFazBem.map((c) => c.texto.replace(/\.$/, "")).join("; ") : "—"}.`,
    `◎ Oportunidade: ${oportunidade.texto}`,
    `⚠ Pode estar causando: ${problema.texto}`,
    `↗ Possível melhoria: ${melhoria}`,
    `▶ Estratégia inicial: ${estrategiaInicial}`,
    `→ Próximo passo: ${proximoPasso}`,
  ];
  const texto = `Mini auditoria — ${lead.profile.nome}\n(observações a validar com você, não certezas)\n\n${linhas.join("\n")}`;
  const viol = validateOutbound(texto, op, { extraAllowed: [...lead.profile.notas.map((n) => n.texto), ...raiox.pontosFortes.map((c) => c.texto), lead.profile.nome, lead.profile.bio ?? "", ...raiox.gargalos.flatMap((g) => g.evidencias)] });
  if (viol.length) avisos.push(...viol);
  return { semBase: false, semaforo, jaFazBem, oportunidade, problema, melhoria, estrategiaInicial, proximoPasso, texto, avisos };
}
