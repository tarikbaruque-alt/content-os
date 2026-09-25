import type { Backend, Proposta } from "./tipos.ts";
import type { Ferramenta } from "./executor.ts";
import { REGRAS, VOZ, ferramentasDeLeitura, postsMedidos, textoDoCliente } from "./contexto.ts";
import type { Operacao } from "./operacao.ts";
import { diasDePostagem, periodoVazio, slotsDoPeriodo } from "./cronos.ts";

/**
 * Os agentes do Content OS. Cada um tem:
 * - agenda: quando roda sozinho ("semanal:1:7" = segunda às 7h de Brasília;
 *   "mensal:1:8" = dia 1 às 8h; "diario:6"; null = só por evento ou clique);
 * - ferramentas: o que pode consultar (e se pode buscar na web);
 * - saida: o formato do que entrega;
 * - destino: o que acontece com a entrega. Ou vira PROPOSTA que o humano
 *   aprova no painel (substitui algo inteiro), ou é gravada como PENDENTE numa
 *   tela que já é de revisão (DNA, Aprovações) e só gera um aviso.
 */
export type Ctx = { b: Backend; ws: string; cli: string; agora: Date; gatilho: string; op: Operacao };
export type Entrega = { propostas: Omit<Proposta, "workspace_id" | "client_id" | "agente" | "run_id">[] };
export type Agente = {
  id: string;
  nome: string;
  papel: string;
  agenda: string | null;
  ferramentas: string[];
  buscaWeb?: number;
  sistema: string;
  /** Motivo para NÃO rodar agora (falta insumo), ou null. */
  bloqueio: (c: Ctx) => Promise<string | null>;
  pedido: (c: Ctx) => Promise<string>;
  saida: Record<string, any>;
  destino: (saida: Record<string, any>, c: Ctx) => Promise<Entrega>;
  /** Quem este agente chama quando termina (a cadeia do planejamento). */
  depois?: (c: Ctx) => Promise<{ agente: string; gatilho: string }[]>;
  /** Agente de cálculo (Cronos): não chama a IA. */
  semIA?: boolean;
};

const str = { type: "string" };
const strs = { type: "array", items: { type: "string" } };
const obj = (props: Record<string, any>, req = Object.keys(props)) => ({ type: "object", properties: props, required: req, additionalProperties: false });
const temDoc = async (c: Ctx, p: string) => !!(await c.b.getDoc(c.ws, p));
const nomeCli = async (c: Ctx) => String(((await c.b.getDoc(c.ws, `cos_clients/${c.cli}`)) ?? {}).name ?? c.cli);
const dnaDe = async (c: Ctx) => ((((await c.b.getDoc(c.ws, `cos_dna/${c.cli}`)) ?? {}).entries ?? []) as any[]);
const hoje = (d: Date) => d.toISOString().slice(0, 10);
/** a foi gravado depois de b? (para não refazer o que alguém já fez à mão) */
const depoisDe = async (c: Ctx, a: string, b: string) => { const ta = await c.b.quando(c.ws, a), tb = await c.b.quando(c.ws, b); return !!ta && !!tb && ta >= tb; };
const ultimaIdeia = async (c: Ctx) => (await c.b.listDocs(c.ws, `cos_ideas/${c.cli}/items`)).map((d) => d.updated_at ?? "").sort().at(-1) ?? null;
export const GATILHO_PLANEJAMENTO = "planejamento do mês";

/** Datas do próximo trecho vazio do calendário e as ideias ainda sem data. */
export async function vagasDoPeriodo(c: Ctx) {
  const cli = (await c.b.getDoc(c.ws, `cos_clients/${c.cli}`)) ?? {};
  const itens = (await c.b.listDocs(c.ws, `cos_calendar/${c.cli}/items`)).map((d) => d.data);
  const { inicio, fim } = periodoVazio(c.agora, itens.map((i) => i.data));
  const slots = slotsDoPeriodo(inicio, fim, diasDePostagem(cli.rotina ?? {}));
  const usadas = new Set(itens.map((i) => i.idea?.id).filter(Boolean));
  const livres = (await c.b.listDocs(c.ws, `cos_ideas/${c.cli}/items`)).map((d) => d.data).filter((x) => !usadas.has(x.id));
  return { inicio, fim, slots, livres, rotina: cli.rotina ?? {} };
}

/** Acrescenta registros ao DNA como PENDENTES (a tela do DNA é onde o humano aprova), sem repetir. */
async function acrescentarAoDna(c: Ctx, novos: { section: string; field: string; value: string; state: string }[], src: string) {
  const atuais = await dnaDe(c);
  const vistos = new Set(atuais.map((e) => `${e.section}|${e.field}|${String(e.value).toLowerCase().trim()}`));
  const add = novos
    .filter((s) => s?.field && s?.value)
    .map((s) => ({ section: s.section || "business", field: String(s.field), value: String(s.value), state: s.state || "HYPOTHESIS", status: "pending", src }))
    .filter((e) => { const k = `${e.section}|${e.field}|${e.value.toLowerCase().trim()}`; if (vistos.has(k)) return false; vistos.add(k); return true; });
  if (add.length) await c.b.setDoc(c.ws, `cos_dna/${c.cli}`, { entries: atuais.concat(add) });
  return add.length;
}

const SUGESTOES_DNA = {
  type: "array",
  items: obj({
    section: { type: "string", enum: ["business", "audience", "voice_of_customer", "positioning", "communication", "strategic_memory"] },
    field: str, value: str,
    state: { type: "string", enum: ["FACT", "HYPOTHESIS", "INSIGHT", "STRATEGIC_DECISION", "LEARNING"] },
  }),
};

export const AGENTES: Agente[] = [
  {
    id: "radar",
    nome: "Radar",
    papel: "Pesquisa externa: pautas quentes, tendências, concorrentes e palavras-chave do nicho, sempre com link e data.",
    agenda: "semanal:1:7",
    ferramentas: ["ler_cliente", "ler_estrategia", "ler_pesquisa", "buscar_conhecimento"],
    buscaWeb: 5,
    sistema: [
      "Você é Radar, o agente de pesquisa do Content OS. Toda semana você pesquisa na web o que está acontecendo no nicho do cliente e traz oportunidades de conteúdo para o Instagram dele.",
      REGRAS,
      "- Só entregue item que você viu numa fonte da busca desta semana, com a URL dessa fonte. Sem URL, não entra.",
      "- Prefira fontes brasileiras e dos últimos 30 dias. Diga a data da fonte quando ela aparecer.",
      "- Fonte com mais de 60 dias só entra se for data futura (evento, prazo) ou dado que continua valendo; diga isso no insight.",
      "- Não repita o que já está na pesquisa anterior (use ler_pesquisa).",
      "- Cada item precisa dizer por que importa PARA ESTE CLIENTE, ligado à oferta, persona ou estratégia dele.",
      "- Pauta é o que o PÚBLICO do cliente quer ver no Instagram dele. Dado de mercado que só interessa ao dono do negócio (crescimento do setor, margem, concorrência entre empresas) vai como 'Contexto de mercado', no máximo 1 item, nunca como pauta.",
      "- Seja econômico: no máximo 5 buscas, focadas no público e na região do cliente.",
    ].join("\n"),
    bloqueio: async (c) => ((await dnaDe(c)).length || (await temDoc(c, `cos_clients/${c.cli}`)) ? null : "cliente sem ficha nem DNA"),
    pedido: async (c) => `Cliente: ${await nomeCli(c)}. Hoje é ${hoje(c.agora)}. Leia o cliente, pesquise o nicho na web e entregue de 4 a 8 oportunidades desta semana.`,
    saida: obj({
      resumo: { type: "string", description: "Duas frases: o que mudou no nicho esta semana." },
      itens: {
        type: "array",
        items: obj({
          tipo: { type: "string", enum: ["Pauta quente", "Tendência", "Concorrente", "Palavra-chave", "Data comemorativa", "Contexto de mercado"] },
          insight: str, porque_importa: str, fonte_titulo: str, url: str,
          data_fonte: { type: "string", description: "AAAA-MM-DD, ou vazio se a fonte não informa." },
          relevancia: { type: "string", enum: ["alta", "média", "baixa"] },
        }),
      },
    }),
    destino: async (s, c) => {
      const itens = (s.itens ?? []).filter((i: any) => /^https?:\/\//.test(String(i.url ?? "")));
      if (!itens.length) return { propostas: [] };
      const items = itens.map((i: any) => ({
        tipo: i.tipo, insight: `${i.insight} ${i.porque_importa ? "Por que importa: " + i.porque_importa : ""}`.trim(),
        origem: i.fonte_titulo || new URL(i.url).hostname, url: i.url, data: i.data_fonte || hoje(c.agora), relevancia: i.relevancia,
      }));
      return {
        propostas: [{
          tipo: "pesquisa", titulo: `${items.length} oportunidades da semana`, resumo: s.resumo,
          payload: { items }, fontes: itens.map((i: any) => ({ titulo: i.fonte_titulo, url: i.url, data: i.data_fonte })),
        }],
      };
    },
  },
  {
    id: "iris",
    nome: "Íris",
    papel: "Lê briefing, retornos do cliente e aprendizados e sugere registros para o Content DNA.",
    agenda: null,
    ferramentas: ["ler_cliente", "buscar_conhecimento"],
    sistema: [
      "Você é Íris, o agente de inteligência do Content OS. Você mantém o Content DNA do cliente: o que é fato, o que é hipótese, o que foi decidido e aprendido.",
      REGRAS,
      "- FACT só para o que está escrito na ficha ou no briefing. Interpretação é INSIGHT; suposição é HYPOTHESIS.",
      "- Não repita o que já está no DNA. Uma sugestão por ocorrência (cada dor é um registro).",
      "- Campos: persona, dores, desejos, objecoes (audience); oferta, ticket (business); diferenciais, posicionamento (positioning); tom (communication); frase (voice_of_customer, frase literal); decisao, aprendizado (strategic_memory).",
    ].join("\n"),
    bloqueio: async (c) => (String(((await c.b.getDoc(c.ws, `cos_clients/${c.cli}`)) ?? {}).briefing ?? "").trim() || (await dnaDe(c)).length ? null : "sem briefing"),
    pedido: async (c) => `Cliente: ${await nomeCli(c)}. Motivo: ${c.gatilho}. Leia o cliente e sugira só o que falta ou mudou no Content DNA.`,
    saida: obj({ sugestoes: SUGESTOES_DNA }),
    destino: async (s, c) => {
      const n = await acrescentarAoDna(c, s.sugestoes ?? [], `Íris (agente) · ${c.gatilho}`);
      return { propostas: n ? [{ tipo: "aviso", titulo: `${n} sugestão(ões) no Content DNA`, resumo: "Estão pendentes na tela Content DNA para você aprovar ou rejeitar.", payload: { ir: "dna", n } }] : [] };
    },
    // Cliente novo (ainda sem estratégia): a Íris abre a cadeia do planejamento.
    depois: async (c) => ((await temDoc(c, `cos_strategy/${c.cli}`)) ? [] : [{ agente: "atlas", gatilho: "cliente novo" }]),
  },
  {
    id: "atlas",
    nome: "Átlas",
    papel: "Propõe a estratégia do mês seguinte (e a primeira, no cliente novo) com o que o Radar achou e o que o Pulso mediu.",
    // Sem relógio: chamado pelo Pulso no dia de planejar do cliente, ou pela Íris no cliente novo.
    agenda: null,
    ferramentas: ["ler_cliente", "ler_estrategia", "ler_pesquisa", "ler_desempenho", "buscar_conhecimento"],
    sistema: [
      "Você é Átlas, o agente de estratégia do Content OS. Todo mês você revisa a estratégia do cliente com base no Content DNA, na pesquisa da semana e nos resultados medidos.",
      REGRAS,
      "- Consulte a Knowledge Base (estratégia de marca, jornada) antes de decidir caminhos.",
      "- Se a estratégia atual continua certa, diga isso e mantenha; mude só o que os dados justificam, e explique em 'mudancas'.",
      "- Caminhos possíveis: Autoridade, Posicionamento, Rapport / Relacionamento, Educação, Diferenciação, Construção de Categoria, Comunidade, Geração de Demanda, Quebra de Objeções, Prova, Desejo, Conversão / Vendas, Lançamento, Crescimento de Audiência, Marca Pessoal.",
      "- 'mix' é um subconjunto de 2 a 4 caminhos cujos pct somam 100.",
    ].join("\n"),
    bloqueio: async (c) => ((await dnaDe(c)).length >= 3 ? null : "Content DNA com menos de 3 registros"),
    pedido: async (c) => `Cliente: ${await nomeCli(c)}. Motivo: ${c.gatilho}. ${(await temDoc(c, `cos_strategy/${c.cli}`)) ? "Revise a estratégia atual para o próximo mês." : "É a primeira estratégia deste cliente."} Hoje é ${hoje(c.agora)}.`,
    saida: obj({
      mudancas: { type: "string", description: "O que muda em relação à estratégia atual e por quê (ou por que manter)." },
      posicionamento: str, bigMessage: str, persona: str, percepcao: str, pilares: strs,
      paths: {
        type: "array",
        items: obj({
          key: str, nome: str, quando: str, porque: str, objetivo: str,
          funil: { type: "string", enum: ["topo", "meio", "fundo"] }, jornada: str,
          funcoes: strs, emocoes: strs, metricas: strs, relevancia: { type: "number" },
        }),
      },
      mix: { type: "array", items: obj({ key: str, nome: str, pct: { type: "number" } }) },
    }),
    destino: async (s) => ({
      propostas: [{ tipo: "estrategia", titulo: "Estratégia do próximo mês", resumo: s.mudancas, payload: s }],
    }),
  },
  {
    id: "bussola",
    nome: "Bússola",
    papel: "Refaz a linha editorial quando uma estratégia nova é aprovada.",
    // Por evento (estratégia gravada), não por relógio: senão rodaria sobre a estratégia
    // antiga enquanto a proposta do Átlas ainda espera aprovação.
    agenda: null,
    ferramentas: ["ler_cliente", "ler_estrategia", "ler_linha_editorial", "ler_pesquisa", "buscar_conhecimento"],
    sistema: [
      "Você é Bússola, o agente editorial do Content OS: pilar, território, tema, subtemas e tópicos. A linha editorial impede conteúdo aleatório.",
      REGRAS,
      "- Consulte a Knowledge Base (jornada e editorias). 3 a 5 pilares, cada um ligado a um caminho da estratégia.",
    ].join("\n"),
    bloqueio: async (c) => !(await temDoc(c, `cos_strategy/${c.cli}`)) ? "sem estratégia"
      : c.gatilho !== "rodado no painel" && (await depoisDe(c, `cos_editorial/${c.cli}`, `cos_strategy/${c.cli}`)) ? "a linha editorial já foi refeita depois desta estratégia" : null,
    pedido: async (c) => `Cliente: ${await nomeCli(c)}. Monte a linha editorial do mês a partir da estratégia atual.`,
    saida: obj({
      pilares: {
        type: "array",
        items: obj({ pilar: str, territorio: str, temas: { type: "array", items: obj({ tema: str, subtemas: strs, topicos: strs }) } }),
      },
    }),
    destino: async (s) => ({ propostas: [{ tipo: "editorial", titulo: "Linha editorial do mês", payload: { pilares: s.pilares ?? [] } }] }),
  },
  {
    id: "musa",
    nome: "Musa",
    papel: "Gera uma ideia por data vazia do calendário, cruzando estratégia, pesquisa e o que performou.",
    // Sem relógio: roda quando a linha editorial é aprovada.
    agenda: null,
    ferramentas: ["ler_cliente", "ler_estrategia", "ler_linha_editorial", "ler_pesquisa", "ler_desempenho", "ler_ideias", "buscar_conhecimento"],
    sistema: [
      "Você é Musa, o agente de ideias do Content OS. Cada ideia nasce do cruzamento: persona, dor ou desejo, Big Message, objetivo, emoção, jornada, pilar, pauta da pesquisa e o que os dados mostram que funciona.",
      REGRAS,
      "- Não é uma lista genérica de ideias de post: cada uma tem ângulo próprio e justificativa estratégica.",
      "- Use pautas da pesquisa (ler_pesquisa) quando fizerem sentido para o cliente, e o formato que os resultados reais favorecem (ler_desempenho).",
      "- Não repita ideias existentes (ler_ideias). funil: topo, meio ou fundo.",
    ].join("\n"),
    bloqueio: async (c) => {
      if (!(await temDoc(c, `cos_strategy/${c.cli}`))) return "sem estratégia";
      const ult = await ultimaIdeia(c), ed = await c.b.quando(c.ws, `cos_editorial/${c.cli}`);
      if (c.gatilho !== "rodado no painel" && ult && ed && ult >= ed) return "as ideias já foram feitas depois desta linha editorial";
      const v = await vagasDoPeriodo(c);
      return v.slots.length - v.livres.length > 0 ? null : "já há ideias para todas as datas do próximo período";
    },
    pedido: async (c) => {
      const v = await vagasDoPeriodo(c);
      const n = Math.min(30, Math.max(3, v.slots.length - v.livres.length));
      return `Cliente: ${await nomeCli(c)}. O calendário de ${v.inicio} a ${v.fim} tem ${v.slots.length} datas de postagem e ${v.livres.length} ideia(s) ainda sem data. Gere ${n} ideias novas para completar.`;
    },
    saida: obj({
      ideas: {
        type: "array",
        items: obj({
          titulo: str, conceito: str, angulo: str, dorDesejo: str, funcao: str,
          funil: { type: "string", enum: ["topo", "meio", "fundo"] }, jornada: str, emocao: str, pilar: str, tema: str, proposito: str,
          formato: str, formatoObjetivo: str, formatoJustificativa: str, hook: str, cta: str, justificativa: str, gatilhos: strs, elementos: strs,
        }),
      },
    }),
    destino: async (s) => ({ propostas: [{ tipo: "ideias", titulo: `${(s.ideas ?? []).length} ideias para o próximo período`, payload: { ideas: s.ideas ?? [], append: true } }] }),
  },
  {
    id: "cronos",
    nome: "Cronos",
    papel: "Distribui as ideias aprovadas nas datas do próximo trecho vazio do calendário. É cálculo, não usa IA.",
    agenda: null,
    semIA: true,
    ferramentas: [],
    sistema: "",
    bloqueio: async (c) => {
      const v = await vagasDoPeriodo(c);
      if (!v.slots.length) return "a rotina do cliente não tem dia de postagem";
      return v.livres.length ? null : "nenhuma ideia aprovada sem data";
    },
    pedido: async () => "",
    saida: {},
    destino: async () => ({ propostas: [] }),
  },
  {
    id: "estudio",
    nome: "Estúdio (Rima, Mosaico, Enredo)",
    papel: "Escreve com antecedência as peças da próxima semana que ainda não têm texto e manda para Aprovações.",
    agenda: "diario:6",
    ferramentas: ["ler_cliente", "ler_estrategia", "buscar_conhecimento"],
    sistema: [
      "Você é o Estúdio Criativo do Content OS (Rima: roteiro e copy de Reel; Mosaico: carrossel; Enredo: Stories). Você escreve a peça pronta para o estrategista revisar.",
      REGRAS, VOZ,
      "- Consulte a Knowledge Base (criação de alto valor: ganchos, ressonância) antes de escrever.",
      "- Respeite o que a ficha diz que NÃO pode aparecer.",
    ].join("\n"),
    bloqueio: async (c) => ((await pecasSemTexto(c)).length ? null : "nenhuma peça dos próximos 7 dias sem texto"),
    // A peça da vez é escolhida em executarAgente (uma execução por peça).
    pedido: async () => "",
    saida: {},
    destino: async () => ({ propostas: [] }),
  },
  {
    id: "pulso",
    nome: "Pulso",
    papel: "Lê os resultados reais e transforma em aprendizado, recomendação e próximo teste. No dia de planejar do cliente, abre a cadeia do mês seguinte.",
    // A agenda real vem da ficha do cliente (dia de planejar); ver agendaDo().
    agenda: "mensal:20:7",
    ferramentas: ["ler_cliente", "ler_estrategia", "ler_calendario", "ler_desempenho", "buscar_conhecimento"],
    sistema: [
      "Você é Pulso, o agente de performance do Content OS. Você transforma métricas em aprendizado, sempre pelo objetivo de cada peça.",
      REGRAS,
      "- Só afirme o que os números mostram. Com poucos posts, diga que é sinal inicial. Correlação não é causa.",
      "- Diferença menor que 20% entre grupos é empate: não recomende mudar por isso.",
      "- Aprendizados viram registros LEARNING no Content DNA (pendentes de aprovação): escreva cada um com a evidência (números).",
    ].join("\n"),
    bloqueio: async (c) => ((await postsMedidos(c.b, c.ws, c.cli)).length >= 3 ? null : "menos de 3 posts medidos"),
    // No planejamento, o Átlas vem logo depois (mesmo se o Pulso não tinha dados suficientes).
    depois: async (c) => (c.gatilho === GATILHO_PLANEJAMENTO ? [{ agente: "atlas", gatilho: GATILHO_PLANEJAMENTO }] : []),
    pedido: async (c) => `Cliente: ${await nomeCli(c)}. Motivo: ${c.gatilho}. Leia o desempenho e entregue a leitura.`,
    saida: obj({
      leitura: str,
      aprendizados: { type: "array", items: obj({ texto: str, evidencia: str }) },
      recomendacoes: strs,
      proximo_teste: str,
    }),
    destino: async (s, c) => {
      const n = (await postsMedidos(c.b, c.ws, c.cli)).length;
      await c.b.setDoc(c.ws, `cos_pulso/${c.cli}`, { ...s, posts: n, at: c.agora.toISOString() });
      const add = await acrescentarAoDna(c, (s.aprendizados ?? []).map((a: any) => ({ section: "strategic_memory", field: "aprendizado", value: `${a.texto} (${a.evidencia})`, state: "LEARNING" })), `Pulso (agente) · ${n} posts medidos`);
      return { propostas: [{ tipo: "aviso", titulo: "Leitura de performance", resumo: `${s.leitura}${add ? ` ${add} aprendizado(s) foram para o Content DNA como pendentes.` : ""}`, payload: { ir: "performance", proximo_teste: s.proximo_teste, recomendacoes: s.recomendacoes } }] };
    },
  },
];
export const AGENTE = Object.fromEntries(AGENTES.map((a) => [a.id, a])) as Record<string, Agente>;

/** Agenda deste agente para este cliente, e com que gatilho ela dispara. */
export function agendaDo(a: Agente, op: Operacao): { agenda: string; gatilho: string } | null {
  if (a.id === "pulso") return { agenda: `mensal:${op.diaPlanejamento}:7`, gatilho: GATILHO_PLANEJAMENTO };
  return a.agenda ? { agenda: a.agenda, gatilho: "agenda" } : null;
}

// ------------------------------------------------------------------ Estúdio
export async function pecasSemTexto(c: Ctx) {
  const ate = new Date(c.agora.getTime() + 7 * 864e5).toISOString().slice(0, 10);
  const de = hoje(c.agora);
  return (await c.b.listDocs(c.ws, `cos_calendar/${c.cli}/items`))
    .filter((d) => d.data.data >= de && d.data.data <= ate && !d.data.content && !d.data.carousel && !d.data.stories && d.data.status !== "APPROVED" && d.data.status !== "PUBLISHED" && d.data.clientStatus !== "ajuste")
    .sort((a, b) => (a.data.data < b.data.data ? -1 : 1));
}

export type TipoPeca = "reel" | "carrossel" | "stories";
export const tipoDaPeca = (surface: string): TipoPeca => (surface === "Carrossel" ? "carrossel" : surface === "Stories" ? "stories" : "reel");

export const SAIDA_PECA: Record<TipoPeca, Record<string, any>> = {
  reel: obj({ headline: str, roteiro: { type: "array", items: obj({ label: str, text: str }) }, copyCurta: str, copyMedia: str, copyLonga: str, cta: str, emocao: str, emocaoPor: str, direcaoVisual: str }),
  carrossel: obj({ capaHeadline: str, hook: str, estrutura: str, slides: { type: "array", items: obj({ papel: str, titulo: str, texto: str }) }, copy: str, cta: str, emocao: str, emocaoPor: str, direcaoVisual: str }),
  stories: obj({ tipo: str, stories: { type: "array", items: obj({ papel: str, fala: str, interacao: str }) }, cta: str, emocao: str, emocaoPor: str }),
};

export function pedidoDaPeca(it: Record<string, any>, tipo: TipoPeca): string {
  const x = it.idea ?? {};
  const base = [
    `PEÇA (${it.data}, ${x.surface} · ${x.format}): ${x.titulo}`,
    `Ângulo: ${x.angulo}. Dor/Desejo: ${x.dorDesejo}. Função: ${x.funcao} (funil ${x.funil}, jornada ${x.jornada}). Emoção-alvo: ${x.emocao}.`,
    `Hook sugerido: ${x.hook}. CTA base: ${x.cta}. Gatilhos: ${(x.gatilhos ?? []).join(", ") || "os mais adequados"}. Elementos: ${(x.elementos ?? []).join(", ") || "os mais adequados"}.`,
    x.funil === "fundo" ? "Só aqui pode haver CTA de venda direto." : "Não transforme em venda: CTA de conversa, salvar ou seguir.",
  ];
  const como = {
    reel: "Escreva o roteiro em 5 passos (Hook, Desenvolvimento, Retenção/Tensão, Payoff, CTA) e a legenda em 3 extensões (curta, média, longa).",
    carrossel: "Escreva o carrossel: capa, 6 a 9 slides com papel, título e texto, legenda e CTA.",
    stories: "Escreva 4 Stories em progressão real (cada um puxa o próximo), com a fala e a interação de cada um.",
  }[tipo];
  return [...base, como, "Leia o cliente antes de escrever. Entregue pela ferramenta entregar."].join("\n");
}

/** Mesmo formato que o painel grava ao gerar a peça (apps/web/src/33-criacao-e-gatilhos.js, runGerarPeca). */
export function patchDaPeca(it: Record<string, any>, tipo: TipoPeca, out: Record<string, any>): Record<string, any> {
  const x = it.idea ?? {};
  const s = (v: unknown, fb = "") => String(v ?? fb);
  const patch: Record<string, any> = { status: "WAITING APPROVAL" };
  if (tipo === "reel") {
    patch.content = {
      origem: "agente", ideaId: x.id, headline: s(out.headline, x.hook || x.titulo), kind: "reel",
      copy: s(out.copyMedia), copyVariants: { curta: s(out.copyCurta), media: s(out.copyMedia), longa: s(out.copyLonga) },
      cta: s(out.cta, x.cta), gatilhos: x.gatilhos ?? [], recursos: x.elementos ?? [], gatilhosRec: [], elementosRec: [],
      emocao: s(out.emocao, x.emocao), emocaoPor: s(out.emocaoPor), direcaoVisual: s(out.direcaoVisual),
      roteiro: (out.roteiro ?? []).map((r: any) => ({ label: s(r.label, "—"), text: s(r.text) })),
    };
  } else if (tipo === "carrossel") {
    patch.carousel = {
      origem: "agente", capaHeadline: s(out.capaHeadline, x.titulo), hook: s(out.hook, x.hook), estrutura: s(out.estrutura),
      slides: (out.slides ?? []).map((sl: any, i: number) => ({ n: i + 1, papel: s(sl.papel, i === 0 ? "Capa" : "Slide"), titulo: s(sl.titulo), texto: s(sl.texto), visual: s(out.direcaoVisual), imagem: "" })),
      copy: s(out.copy), cta: s(out.cta, x.cta), gatilhos: x.gatilhos ?? [], elementosLiterarios: x.elementos ?? [],
      emocao: s(out.emocao, x.emocao), emocaoPor: s(out.emocaoPor), direcaoVisual: s(out.direcaoVisual), referencias: [],
    };
  } else {
    const st = (out.stories ?? []).map((q: any, i: number) => ({ n: i + 1, papel: s(q.papel, `Story ${i + 1}`), fala: s(q.fala), visual: "", interacao: s(q.interacao) }));
    patch.stories = {
      origem: "agente", tipo: s(out.tipo, "Sequência"), objetivo: s(x.objetivo), contexto: "", emocao: s(out.emocao, x.emocao), emocaoPor: s(out.emocaoPor),
      percepcaoDesejada: "", narrativa: "", publico: s(x.persona), progressao: st.map((q: any) => q.papel), stories: st, cta: s(out.cta, x.cta), gatilhos: x.gatilhos ?? [],
    };
  }
  return patch;
}

export function ferramentasDo(a: Agente, c: Ctx): Ferramenta[] {
  const todas = ferramentasDeLeitura(c.b, c.ws, c.cli, a.id);
  return a.ferramentas.map((n) => todas[n]).filter((f): f is Ferramenta => !!f);
}

export { textoDoCliente };
