import { dnaView } from "./dna-view.js";
import { clean, short } from "./text.js";
import { largestRemainder } from "../core/planning/distribution.js";
import type { Dna, FunnelStage, MixItem, StrategyPath } from "./types.js";

/**
 * Biblioteca de caminhos estratégicos (Átlas). Não gera "uma" estratégia: mostra
 * caminhos possíveis, explica quando/por que usar cada um, ranqueia pela
 * aderência ao Content DNA do cliente e recomenda um MIX (ex.: 40% Autoridade +
 * 25% Rapport + ...). É repertório, não gaveta fixa — a IA pode combiná-los.
 */
type Signal = "dif" | "obj" | "des" | "dor" | "voc" | "apr" | "venda";

type Archetype = {
  key: string;
  nome: string;
  quando: string;
  porque: string;
  objetivo: string;
  funil: FunnelStage;
  jornada: string;
  funcoes: string[];
  emocoes: string[];
  tiposConteudo: string[];
  metricas: string[];
  /** foco do problema/oportunidade: qual sinal do DNA ancora este caminho. */
  ancora: "dor" | "desejo" | "objecao" | "diferencial";
  bonus: Partial<Record<Signal, number>>;
};

const LIB: Archetype[] = [
  { key: "autoridade", nome: "Autoridade", quando: "o cliente precisa ser visto como referência no tema.", porque: "posiciona a marca como quem mais entende do assunto, sustentando preço e confiança.", objetivo: "Ser referência no nicho", funil: "meio", jornada: "Consideração", funcoes: ["Autoridade", "Educação", "Prova"], emocoes: ["confiança", "inspiração"], tiposConteudo: ["Análise especializada", "Opinião fundamentada", "Framework"], metricas: ["salvamentos", "alcance qualificado", "seguidores"], ancora: "diferencial", bonus: { dif: 22, apr: 8 } },
  { key: "posicionamento", nome: "Posicionamento", quando: "há muitos concorrentes parecidos e a marca precisa de um lugar próprio.", porque: "define o que a marca defende e contra o que se opõe, criando distinção.", objetivo: "Ocupar um lugar próprio na mente do público", funil: "meio", jornada: "Consideração", funcoes: ["Posicionamento", "Diferenciação", "Autoridade"], emocoes: ["inspiração"], tiposConteudo: ["Opinião/Contraponto", "Manifesto", "Ponto de vista"], metricas: ["compartilhamentos", "menções", "seguidores qualificados"], ancora: "diferencial", bonus: { dif: 20, obj: 8 } },
  { key: "rapport", nome: "Rapport / Relacionamento", quando: "o público precisa sentir proximidade e confiança antes de comprar.", porque: "conteúdo que humaniza e gera identificação encurta a distância até a conversão.", objetivo: "Aproximar e criar vínculo", funil: "meio", jornada: "Consideração", funcoes: ["Rapport", "Relacionamento", "Identificação"], emocoes: ["pertencimento", "identificação"], tiposConteudo: ["Bastidores", "Vlog", "Stories de rotina"], metricas: ["respostas", "DMs", "retenção de Stories"], ancora: "dor", bonus: { voc: 16, dor: 14 } },
  { key: "educacao", nome: "Educação", quando: "o tema é complexo e o público decide melhor quando entende.", porque: "ensinar gera autoridade e reciprocidade, preparando a decisão.", objetivo: "Ensinar para capacitar a decisão", funil: "meio", jornada: "Consideração", funcoes: ["Educação", "Autoridade"], emocoes: ["confiança"], tiposConteudo: ["Tutorial", "Passo a passo", "Carrossel-framework"], metricas: ["salvamentos", "tempo de visualização"], ancora: "desejo", bonus: { dor: 14, des: 10 } },
  { key: "diferenciacao", nome: "Diferenciação", quando: "existe um diferencial real que o público ainda não percebe.", porque: "torna o diferencial visível e desejável, justificando a escolha da marca.", objetivo: "Tornar o diferencial evidente", funil: "meio", jornada: "Consideração", funcoes: ["Diferenciação", "Prova"], emocoes: ["inspiração"], tiposConteudo: ["Comparação", "Case", "Demonstração"], metricas: ["preferência de marca", "menções"], ancora: "diferencial", bonus: { dif: 24 } },
  { key: "categoria", nome: "Construção de Categoria", quando: "a marca faz algo novo que o mercado ainda não nomeou.", porque: "educar sobre a categoria faz a marca ser a dona dela.", objetivo: "Criar e liderar uma categoria", funil: "topo", jornada: "Descoberta", funcoes: ["Conscientização", "Autoridade"], emocoes: ["curiosidade", "reflexão"], tiposConteudo: ["Análise de tendência", "Manifesto", "Série educativa"], metricas: ["alcance", "novos seguidores"], ancora: "diferencial", bonus: { dif: 10 } },
  { key: "comunidade", nome: "Comunidade", quando: "já existe base de clientes que pode virar promotora.", porque: "senso de pertencimento gera recorrência, indicação e prova social.", objetivo: "Transformar clientes em comunidade", funil: "fundo", jornada: "Experiência compartilhada", funcoes: ["Comunidade", "Relacionamento"], emocoes: ["pertencimento"], tiposConteudo: ["UGC", "Desafio", "Corrente"], metricas: ["UGC gerado", "menções", "recompra"], ancora: "desejo", bonus: { voc: 16, apr: 8 } },
  { key: "demanda", nome: "Geração de Demanda", quando: "o público ainda não sente que precisa da solução.", porque: "desperta o desejo e o problema latente antes da oferta.", objetivo: "Criar consciência de necessidade", funil: "topo", jornada: "Descoberta", funcoes: ["Desejo", "Atenção", "Consideração"], emocoes: ["desejo", "curiosidade"], tiposConteudo: ["POV", "Transformação", "Antes e depois"], metricas: ["alcance", "cliques", "leads"], ancora: "desejo", bonus: { des: 18 } },
  { key: "objecoes", nome: "Quebra de Objeções", quando: "o público quer comprar mas trava em crenças e medos.", porque: "endereçar objeções de frente destrava a conversão sem pressão.", objetivo: "Remover barreiras de decisão", funil: "fundo", jornada: "Conversão", funcoes: ["Quebra de Objeção", "Prova"], emocoes: ["segurança"], tiposConteudo: ["Duplo personagem (diálogo)", "FAQ", "Comparação"], metricas: ["conversas iniciadas", "conversão"], ancora: "objecao", bonus: { obj: 28 } },
  { key: "prova", nome: "Prova", quando: "faltam evidências que sustentem a promessa.", porque: "prova social e resultados reais reduzem o risco percebido.", objetivo: "Comprovar a promessa", funil: "fundo", jornada: "Conversão", funcoes: ["Prova"], emocoes: ["confiança"], tiposConteudo: ["Case", "Depoimento", "Antes e depois"], metricas: ["conversão", "confiança percebida"], ancora: "diferencial", bonus: { voc: 14, dif: 6 } },
  { key: "desejo", nome: "Desejo", quando: "o público entende a solução mas ainda não a deseja.", porque: "projeta o futuro desejado e torna a transformação tangível.", objetivo: "Aumentar o desejo pela transformação", funil: "fundo", jornada: "Conversão", funcoes: ["Desejo"], emocoes: ["desejo"], tiposConteudo: ["Transformação", "POV", "Demonstração"], metricas: ["salvamentos", "cliques"], ancora: "desejo", bonus: { des: 20 } },
  { key: "conversao", nome: "Conversão / Vendas", quando: "há oferta clara e público quente pronto para agir.", porque: "converte a atenção construída em mensagem, agendamento ou venda.", objetivo: "Gerar leads e vendas", funil: "fundo", jornada: "Conversão", funcoes: ["Conversão", "Venda"], emocoes: ["ambição", "desejo"], tiposConteudo: ["Oferta", "Demonstração", "Prova"], metricas: ["leads", "conversas", "vendas"], ancora: "desejo", bonus: { venda: 18, des: 8 } },
  { key: "lancamento", nome: "Lançamento", quando: "há um evento/oferta com data para mobilizar.", porque: "cria antecipação e escassez real em torno de um marco.", objetivo: "Mobilizar em torno de um lançamento", funil: "fundo", jornada: "Conversão", funcoes: ["Desejo", "Conversão"], emocoes: ["antecipação", "desejo"], tiposConteudo: ["Série", "Contagem regressiva", "Bastidores"], metricas: ["inscrições", "vendas no período"], ancora: "desejo", bonus: {} },
  { key: "audiencia", nome: "Crescimento de Audiência", quando: "a base é pequena e precisa crescer com público certo.", porque: "conteúdo de identificação e trends amplia o alcance qualificado.", objetivo: "Crescer audiência qualificada", funil: "topo", jornada: "Descoberta", funcoes: ["Descoberta", "Atenção", "Identificação"], emocoes: ["curiosidade", "identificação"], tiposConteudo: ["Trend contextualizada", "Erro comum", "Mito × Verdade"], metricas: ["alcance", "novos seguidores", "compartilhamentos"], ancora: "dor", bonus: { apr: 18, dor: 8 } },
  { key: "marca_pessoal", nome: "Marca Pessoal", quando: "a pessoa por trás é o principal ativo da marca.", porque: "história, valores e presença pessoal geram conexão e autoridade.", objetivo: "Fortalecer a marca pessoal", funil: "meio", jornada: "Consideração", funcoes: ["Autoridade", "Rapport", "Posicionamento"], emocoes: ["inspiração", "pertencimento"], tiposConteudo: ["História pessoal", "Bastidores", "Opinião"], metricas: ["seguidores", "engajamento", "menções"], ancora: "diferencial", bonus: { voc: 10, dif: 10 } },
];

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export function deriveStrategyPaths(dna: Dna): { paths: StrategyPath[]; mix: MixItem[] } {
  const v = dnaView(dna);
  const dor = short(v.dores[0] ?? "", 46);
  const desejo = short(v.desejos[0] ?? "", 46);
  const objecao = short(v.objecoes[0] ?? "", 52);
  const dif = short(v.diferenciais[0] ?? "", 46);
  const persona = v.persona ? clean(v.persona) : "público-alvo";

  const sig: Record<Signal, boolean> = {
    dif: v.diferenciais.length > 0,
    obj: v.objecoes.length > 0,
    des: v.desejos.length > 0,
    dor: v.dores.length > 0,
    voc: v.voc.length > 0,
    apr: v.aprendizados.length > 0,
    venda: !!(v.ticket || v.oferta),
  };

  const ancoraText = (a: Archetype["ancora"]) =>
    a === "dor" ? dor : a === "desejo" ? desejo : a === "objecao" ? objecao : dif;

  const bigMsgFor = (a: Archetype): string => {
    switch (a.key) {
      case "rapport": return `A gente entende ${(dor || "o que você sente").toLowerCase()} — e está do seu lado.`;
      case "educacao": return `Você pode ${(desejo || "chegar lá").toLowerCase()} quando entende o que ninguém te explicou.`;
      case "objecoes": return `"${cap(objecao || "será que vale?")}"? Vamos olhar isso com honestidade.`;
      case "conversao": return `Se ${(desejo || "isso").toLowerCase()} faz sentido, o próximo passo é simples.`;
      case "desejo": return `Imagina ${(desejo || "o resultado").toLowerCase()} — e por que isso é possível pra você.`;
      case "prova": return `Não é promessa: ${(dif || "o resultado").toLowerCase()}, com prova.`;
      default: return `${cap(dif || "o diferencial")} — e é por isso que ${(desejo || "o que você quer").toLowerCase()} deixa de ser distante.`;
    }
  };

  const paths: StrategyPath[] = LIB.map((a) => {
    let rel = 34;
    (Object.keys(a.bonus) as Signal[]).forEach((k) => {
      if (sig[k]) rel += a.bonus[k]!;
    });
    rel = Math.max(10, Math.min(100, rel));
    return {
      key: a.key,
      nome: a.nome,
      quando: `Use quando ${a.quando}`,
      porque: a.porque,
      objetivo: a.objetivo,
      publico: persona,
      problemaOportunidade: ancoraText(a.ancora) || "oportunidade a mapear",
      bigMessage: bigMsgFor(a),
      percepcao: `De "${(objecao || "marca comum").toLowerCase()}" para "${(dif || a.nome).toLowerCase()}, em quem eu confio".`,
      emocoes: a.emocoes,
      jornada: a.jornada,
      funil: a.funil,
      funcoes: a.funcoes,
      pilares: [`${a.nome}`, ...a.tiposConteudo.slice(0, 2)],
      tiposConteudo: a.tiposConteudo,
      metricas: a.metricas,
      relevancia: rel,
    };
  }).sort((x, y) => y.relevancia - x.relevancia);

  // Mix recomendado: top 4 caminhos, ponderados pelo sinal acima da base
  // (amplia a diferença entre eles), somando 100%.
  const top = paths.slice(0, 4);
  const pcts = largestRemainder(top.map((p) => Math.max(1, p.relevancia - 25)), 100);
  const mix: MixItem[] = top.map((p, i) => ({ key: p.key, nome: p.nome, pct: pcts[i]! }));

  return { paths, mix };
}
