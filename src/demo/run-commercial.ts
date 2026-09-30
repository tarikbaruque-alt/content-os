import { DEMO_CTX, DEMO_CTX_WITH_RULES, DEMO_LEAD } from "./sample-commercial.js";
import {
  analyzeOpportunity, buildFirstApproach, analyzeDiscovery, analyzeObjection, adviseNegotiation,
  coachDeal, prepareClosing, renderDiagnosis, renderFirstApproach, renderDiscovery, renderObjection,
  renderNegotiation, renderCoach, renderClosing,
} from "../commercial/index.js";

/** Demonstração do módulo comercial com DADOS FICTÍCIOS. Uso: npm run commercial [diagnostico|abordagem|descoberta|objecao|negociacao|coach|fechamento] */
const which = process.argv[2] ?? "diagnostico";
const lead = { ...DEMO_LEAD, conversa: [...DEMO_LEAD.conversa, { autor: "lead" as const, texto: "Recebi a proposta, mas achei caro. Preciso falar com meu sócio." }] };
const sep = "\n" + "=".repeat(70) + "\n";
console.log("⚠ DADOS FICTÍCIOS DE DEMONSTRAÇÃO" + sep);
const out: Record<string, () => string> = {
  diagnostico: () => renderDiagnosis(analyzeOpportunity(DEMO_CTX, DEMO_LEAD)),
  abordagem: () => renderFirstApproach(buildFirstApproach(DEMO_CTX, DEMO_LEAD)),
  descoberta: () => renderDiscovery(analyzeDiscovery(DEMO_LEAD)),
  objecao: () => renderObjection(analyzeObjection(DEMO_CTX, lead)),
  negociacao: () => renderNegotiation(adviseNegotiation(DEMO_CTX_WITH_RULES, lead, { objecao: "esta_caro" })),
  coach: () => renderCoach(coachDeal(DEMO_CTX, { lead, propostaEnviada: true, diasSemResposta: 2 })),
  fechamento: () => renderClosing(prepareClosing(DEMO_CTX, lead)),
};
const fn = out[which];
if (!fn) { console.error(`Opções: ${Object.keys(out).join(", ")}`); process.exit(1); }
console.log(fn());
