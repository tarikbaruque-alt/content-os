import type { Idea, TriggerRec } from "../../pipeline/types.js";
import type { CreativeContext } from "./context.js";
import { lc } from "./context.js";

/**
 * Biblioteca de GATILHOS MENTAIS selecionáveis.
 *
 * Guardrail: os gatilhos marcados com `requerEvidencia` (prova, autoridade,
 * urgência real, escassez real) NUNCA são inventados — só se aplicam quando há
 * base real no Content DNA. O recomendador os sugere sempre com um aviso.
 */
export type TriggerDef = { key: string; nome: string; descricao: string; requerEvidencia?: boolean };

export const GATILHOS: TriggerDef[] = [
  { key: "curiosidade", nome: "Curiosidade", descricao: "Abre uma lacuna de informação que o público quer fechar." },
  { key: "identificacao", nome: "Identificação", descricao: "A pessoa se reconhece na situação retratada." },
  { key: "autoridade", nome: "Autoridade", descricao: "Domínio real do tema gera confiança.", requerEvidencia: true },
  { key: "prova", nome: "Prova", descricao: "Evidência concreta (caso, registro, relato) sustenta a promessa.", requerEvidencia: true },
  { key: "especificidade", nome: "Especificidade", descricao: "Detalhes concretos tornam a mensagem crível." },
  { key: "contraste", nome: "Contraste", descricao: "Antes/depois ou certo/errado dá clareza pela diferença." },
  { key: "pertencimento", nome: "Pertencimento", descricao: "Sensação de fazer parte de um grupo/identidade." },
  { key: "antecipacao", nome: "Antecipação", descricao: "Expectativa pelo que vem a seguir." },
  { key: "reciprocidade", nome: "Reciprocidade", descricao: "Entregar valor de graça cria vontade de retribuir." },
  { key: "compromisso", nome: "Compromisso/Coerência", descricao: "Pequenos “sim” levam a passos maiores, coerentes." },
  { key: "novidade", nome: "Novidade", descricao: "O novo chama atenção e quebra o piloto automático." },
  { key: "familiaridade", nome: "Familiaridade", descricao: "Presença constante gera conforto e confiança." },
  { key: "reducao_risco", nome: "Redução de risco", descricao: "Diminui o medo de errar na decisão." },
  { key: "aversao_perda", nome: "Aversão à perda", descricao: "O custo de não agir pesa mais que o ganho." },
  { key: "urgencia", nome: "Urgência real", descricao: "Prazo verdadeiro para agir — nunca fabricado.", requerEvidencia: true },
  { key: "escassez", nome: "Escassez real", descricao: "Limite verdadeiro de vagas/estoque — nunca fabricado.", requerEvidencia: true },
];

const BY_KEY = new Map(GATILHOS.map((g) => [g.key, g]));
const GUARD = "Só use com base real no Content DNA — nunca invente.";

// Recomendação por funil (base) refinada pela função estratégica.
const BY_FUNNEL: Record<string, string[]> = {
  topo: ["curiosidade", "identificacao", "contraste", "novidade"],
  meio: ["autoridade", "reciprocidade", "especificidade", "familiaridade"],
  fundo: ["prova", "reducao_risco", "especificidade", "aversao_perda"],
};
const BY_FUNCTION: Record<string, string[]> = {
  Identificação: ["identificacao", "pertencimento", "curiosidade"],
  Conscientização: ["curiosidade", "contraste", "novidade"],
  Autoridade: ["autoridade", "especificidade", "prova"],
  Educação: ["reciprocidade", "especificidade", "autoridade"],
  Prova: ["prova", "especificidade", "reducao_risco"],
  "Quebra de Objeção": ["reducao_risco", "prova", "especificidade"],
  Diferenciação: ["contraste", "especificidade", "autoridade"],
  Desejo: ["antecipacao", "aversao_perda", "pertencimento"],
  Conversão: ["reducao_risco", "compromisso", "prova"],
  Relacionamento: ["pertencimento", "familiaridade", "identificacao"],
};

/** Recomenda 3–4 gatilhos coerentes, cada um com o PORQUÊ e guardrail quando cabível. */
export function recommendTriggers(idea: Idea, ctx: CreativeContext): TriggerRec[] {
  const keys = [...new Set([...(BY_FUNCTION[idea.funcao] ?? []), ...(BY_FUNNEL[idea.funil] ?? [])])].slice(0, 4);
  const dor = lc(ctx.dor);
  const desejo = lc(ctx.desejo);
  const why: Record<string, string> = {
    curiosidade: `abre um loop sobre "${idea.tema.toLowerCase()}" no topo, onde a persona ainda está descobrindo.`,
    identificacao: `faz a persona se ver em "${dor}" — base do relacionamento antes de qualquer venda.`,
    autoridade: `sustenta a percepção de referência no tema; combina com a função ${idea.funcao}.`,
    prova: `dá lastro à promessa de "${desejo}" na etapa de ${lc(idea.jornada)}.`,
    especificidade: `detalhe concreto torna "${desejo}" crível, sem generalizar.`,
    contraste: `evidencia a diferença entre o caminho comum e ${lc(ctx.diferencial)}.`,
    pertencimento: `reforça identidade e comunidade, coerente com a emoção "${idea.emocao}".`,
    antecipacao: `cria expectativa rumo ao próximo passo da jornada.`,
    reciprocidade: `entrega valor primeiro, preparando a decisão sem pressão.`,
    compromisso: `micro-compromissos levam a persona ao próximo passo de forma coerente.`,
    novidade: `quebra o piloto automático no feed e amplia alcance qualificado.`,
    familiaridade: `presença constante aproxima e reduz a distância até a confiança.`,
    reducao_risco: `endereça o medo de errar ligado a "${lc(ctx.objecao)}".`,
    aversao_perda: `mostra o custo de continuar em "${dor}".`,
    urgencia: `só se houver um prazo verdadeiro — caso contrário, não usar.`,
    escassez: `só se houver limite verdadeiro — caso contrário, não usar.`,
  };
  return keys.map((k) => {
    const def = BY_KEY.get(k)!;
    const rec: TriggerRec = { key: k, nome: def.nome, porque: why[k] ?? def.descricao };
    if (def.requerEvidencia) rec.guardrail = GUARD;
    return rec;
  });
}
