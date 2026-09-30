import type { Lead, Operacao } from "./types.js";
import { OBJECTIONS, OBJECTION_BY_KEY } from "./catalog-objections.js";
import { ARG_BY_KEY } from "./catalog-arguments.js";
import { discountPolicy } from "./guardrails.js";

export type ObjectionPlaybook = {
  key: string;
  rotulo: string;
  oQueExistePorTras: string[];
  perguntaSugerida: string;
  resposta: string;
  argumento: { rotulo: string; frase: string; fraseDoBanco: string[] };
  reducaoDeRisco: string[];
  proximoPasso: string;
  preco?: { entenderPrimeiro: string[]; reforcar: string[]; desconto: { permitido: boolean; ate?: number; condicoes?: string[]; motivo?: string } };
  naoFazer: string[];
};

const NAO_FAZER = [
  "Não discutir nem tentar provar que o lead está errado.",
  "Não pressionar (sem urgência ou escassez artificial).",
  "Primeiro a pergunta, depois a resposta: entenda a causa antes de argumentar.",
  "Não prometer resultado que não possa ser documentado.",
];

export function objectionPlaybook(key: string, op: Operacao): ObjectionPlaybook | null {
  const o = OBJECTION_BY_KEY[key];
  if (!o) return null;
  const arg = ARG_BY_KEY[o.argumento.key];
  const risco = [...o.reducaoRisco];
  if (op.processo.length) risco.push(`Mostrar o processo cadastrado: ${op.processo.join(" → ")}.`);
  const pb: ObjectionPlaybook = {
    key: o.key, rotulo: o.rotulo, oQueExistePorTras: o.porTras, perguntaSugerida: o.pergunta, resposta: o.resposta,
    argumento: { rotulo: arg.rotulo, frase: o.argumento.frase, fraseDoBanco: arg.frases },
    reducaoDeRisco: risco, proximoPasso: o.proximoPasso, naoFazer: [...NAO_FAZER],
  };
  if (o.key === "esta_caro") {
    const d = discountPolicy(op.regras);
    pb.preco = {
      entenderPrimeiro: [
        "Com o que está comparando (outra proposta, orçamento previsto, outra referência)?",
        "Qual orçamento tinha em mente para este objetivo?",
        "Qual a prioridade deste investimento frente a outras demandas?",
        "Como enxerga o valor do que foi proposto — o que faltou ficar claro?",
        "Que impacto espera para considerar que valeu a pena?",
      ],
      reforcar: ["Escopo e profundidade do trabalho", "Estratégia por trás do conteúdo, não só a execução", "Processo e entregáveis descritos por escrito", "Acompanhamento e ajustes mensais", "Impacto no posicionamento e na geração de oportunidades", "Economia do seu tempo"],
      desconto: d,
    };
    pb.naoFazer.push("Não oferecer desconto antes de entender comparação, orçamento, prioridade, percepção de valor e impacto esperado.");
    if (!d.permitido) pb.naoFazer.push("Não sugerir desconto: não há regra comercial cadastrada em Minha operação.");
  }
  return pb;
}

/** Detecta objeções na fala do lead (a primeira é a principal). */
export function detectObjections(text: string): { key: string; rotulo: string }[] {
  const t = text.trim();
  if (!t) return [];
  return OBJECTIONS.filter((o) => o.padroes.some((re) => re.test(t))).map((o) => ({ key: o.key, rotulo: o.rotulo }));
}

export function analyzeObjectionText(lead: Lead, op: Operacao, mensagem?: string): { detectadas: { key: string; rotulo: string }[]; playbook: ObjectionPlaybook | null } {
  const txt = mensagem ?? lead.conversa.filter((m) => m.autor === "lead").at(-1)?.texto ?? "";
  const detectadas = detectObjections(txt);
  return { detectadas, playbook: detectadas[0] ? objectionPlaybook(detectadas[0].key, op) : null };
}

export const OBJECTION_LIST = OBJECTIONS.map((o) => ({ key: o.key, rotulo: o.rotulo }));
