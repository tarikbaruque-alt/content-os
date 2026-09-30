import type { CommercialContext, Lead, ObjectionAnalysis, ObjectionKey } from "./types.js";
import { OBJECTIONS, OBJECTION_ORDER } from "./knowledge.js";
import { discountPolicy } from "./guardrails.js";
import { pickBestService } from "./assessment.js";
import { buildValueChain } from "./value.js";
import { leadTexts } from "./util.js";

const PRICE_KEYS: ObjectionKey[] = ["esta_caro", "preco"];

const NAO_FAZER = [
  "Não discutir com o cliente nem tentar 'provar' que ele está errado.",
  "Não pressionar (sem urgência ou escassez artificial).",
  "Não responder antes de entender a causa: primeiro a pergunta, depois a resposta.",
  "Não prometer resultado que não possa ser documentado.",
];

const PRICE_UNDERSTAND = [
  "Com o que está comparando (outra proposta, um orçamento previsto, outra referência)?",
  "Qual orçamento tinha em mente para este objetivo?",
  "Qual a prioridade deste investimento frente a outras demandas do negócio?",
  "Como enxerga o valor do que foi proposto — o que faltou ficar claro?",
  "Que impacto espera do trabalho para considerar que valeu a pena?",
];

const PRICE_REINFORCE = [
  "Escopo e profundidade do trabalho",
  "Qualidade e método (processo definido)",
  "Entregáveis descritos por escrito",
  "Acompanhamento durante a execução",
  "Impacto potencial no objetivo declarado pelo lead",
  "Economia de tempo e de retrabalho",
  "Geração de oportunidades comerciais",
  "Posicionamento e percepção de valor",
];

/**
 * OBJECTION ENGINE — identifica a objeção REAL e responde de forma consultiva.
 * Para cada objeção: explícita → implícitas → pergunta de causa → resposta →
 * reforço de valor → redução de risco → próximo passo.
 *
 * Preço: NUNCA abre com desconto. Primeiro entende comparação, orçamento,
 * prioridade, percepção de valor e impacto esperado. Desconto só aparece como
 * informação se existir regra comercial cadastrada.
 */
export function analyzeObjection(ctx: CommercialContext, lead: Lead, mensagem?: string): ObjectionAnalysis {
  const texto = (mensagem ?? leadTexts(lead).at(-1) ?? "").trim();
  const hits = OBJECTION_ORDER.filter((k) => OBJECTIONS[k].padroes.some((re) => re.test(texto)));

  if (!texto || hits.length === 0) {
    return {
      detectada: false,
      explicita: null,
      secundarias: [],
      possiveisImplicitas: [],
      perguntaParaEntenderACausa: "Como você está enxergando a proposta até aqui — o que está claro e o que ainda gera dúvida?",
      respostaConsultiva: "Não identifiquei uma objeção clara nessa mensagem. Vale abrir espaço para ele dizer o que pensa, em vez de supor uma objeção.",
      reforcoDeValor: [],
      reducaoDePercepcaoDeRisco: [],
      proximoPasso: "Perguntar o que ainda está em aberto e ouvir antes de argumentar.",
      naoFazer: NAO_FAZER,
    };
  }

  const primaria = hits[0]!;
  const pb = OBJECTIONS[primaria];
  const melhor = pickBestService(ctx, lead);
  const reforco = [...pb.reforco];
  if (melhor && ["esta_caro", "preco", "incerteza_retorno", "nao_vejo_necessidade", "prioridade"].includes(primaria)) {
    reforco.push(`Conectar ao valor: ${buildValueChain(melhor.servico.categoria).frase}`);
  }
  const risco = [...pb.risco];
  if (ctx.agencia.processo?.length) risco.push(`Mostrar o processo cadastrado: ${ctx.agencia.processo.join(" → ")}.`);

  const analise: ObjectionAnalysis = {
    detectada: true,
    explicita: { chave: primaria, rotulo: pb.rotulo },
    secundarias: hits.slice(1).map((k) => ({ chave: k, rotulo: OBJECTIONS[k].rotulo })),
    possiveisImplicitas: pb.implicitas,
    perguntaParaEntenderACausa: pb.pergunta,
    respostaConsultiva: pb.resposta,
    reforcoDeValor: reforco,
    reducaoDePercepcaoDeRisco: risco,
    proximoPasso: pb.proximoPasso,
    naoFazer: [...NAO_FAZER],
  };

  if (hits.some((k) => PRICE_KEYS.includes(k))) {
    const d = discountPolicy(ctx.regras);
    analise.abordagemDePreco = { entenderPrimeiro: PRICE_UNDERSTAND, reforcar: PRICE_REINFORCE, desconto: d };
    analise.naoFazer.push("Não oferecer desconto antes de entender comparação, orçamento, prioridade, percepção de valor e impacto esperado.");
    if (!d.permitido) analise.naoFazer.push("Não sugerir desconto: não há regra comercial cadastrada.");
  }
  return analise;
}
