import type { LlmProvider } from "../../core/llm/provider.js";
import { extractJsonBlock } from "../../core/json.js";
import type { Carousel, CarouselSlide, Idea, VisualRef } from "../../pipeline/types.js";
import type { VisualRefProvider } from "../../core/integrations/visual-refs.js";
import { SearchLinkVisualProvider } from "../../core/integrations/visual-refs.js";
import { ANTI_AI_VOICE, buildCreativeContext, lc, visualTerms, type CreativeContext } from "../creative/context.js";
import { recommendTriggers } from "../creative/triggers.js";
import { recommendDevices } from "../creative/devices.js";
import type { Dna, StrategyArchitecture, EditorialArchitecture, ResearchOpportunity } from "../../pipeline/types.js";

/**
 * MOSAICO — especialista em Carrossel.
 *
 * Transforma a estratégia do cliente em um carrossel completo e premium:
 * capa/headline, hook, narrativa slide a slide, copy, CTA, gatilhos mentais,
 * elementos literários, direção visual e sugestões de imagem/referência.
 *
 * Determinístico por padrão (funciona offline e é testável). Com provider real
 * + terminadas as buscas visuais, escreve prosa publicável — sempre com
 * fallback seguro (nunca inventa dado/prova/número fora do Content DNA).
 */

// Estrutura narrativa escolhida pela função estratégica da ideia.
function pickEstrutura(idea: Idea): string {
  const byFn: Record<string, string> = {
    Educação: "Passo a passo",
    Autoridade: "Framework",
    Conscientização: "Mito × Verdade",
    Identificação: "Lista",
    Prova: "Case",
    "Quebra de Objeção": "Comparação",
    Diferenciação: "Comparação",
    Desejo: "Storytelling",
    Conversão: "Storytelling",
    Relacionamento: "Storytelling",
  };
  return byFn[idea.funcao] ?? idea.formatRec?.narrativa ?? "Framework";
}

const ELEMENTOS_POR_ESTRUTURA: Record<string, string[]> = {
  "Passo a passo": ["Enumeração", "Paralelismo", "Gradação"],
  Framework: ["Paralelismo", "Metáfora", "Antítese"],
  "Mito × Verdade": ["Antítese", "Contraste", "Pergunta retórica"],
  Lista: ["Enumeração", "Anáfora", "Gradação"],
  Case: ["Storytelling", "Contraste", "Gradação"],
  Comparação: ["Antítese", "Paralelismo", "Contraste"],
  Storytelling: ["Storytelling", "Metáfora", "Gradação", "Pergunta retórica"],
};

function gatilhosPorFunil(funil: string): string[] {
  if (funil === "fundo") return ["Prova", "Especificidade", "Redução de risco", "Reciprocidade"];
  if (funil === "meio") return ["Autoridade", "Reciprocidade", "Especificidade", "Prova social"];
  return ["Curiosidade", "Identificação", "Contraste", "Antecipação"];
}

/** Constrói o corpo de slides conforme a estrutura escolhida. */
function buildSlides(idea: Idea, ctx: CreativeContext, estrutura: string): CarouselSlide[] {
  const persona = ctx.strategy.persona.replace(/^meu público (são|é)\s*/i, "").trim();
  const dor = lc(ctx.dor);
  const desejo = lc(ctx.desejo);
  const dif = ctx.diferencial;
  const pos = ctx.posicionamento;
  const voc = ctx.voc;
  const pilar = idea.pilar.split(":")[0]!.trim();

  const capa: CarouselSlide = {
    n: 1,
    papel: "Capa",
    titulo: idea.hook,
    texto: `Para ${persona.slice(0, 60)}.`,
    visual: "Capa com alto contraste, uma frase forte, rosto ou imagem-símbolo do tema. Deslize sugerido.",
    imagem: idea.tema,
  };
  const cta: CarouselSlide = {
    n: 0,
    papel: "CTA",
    titulo: idea.cta,
    texto: idea.funil === "fundo" ? `Se ${desejo} faz sentido pra você, chama no direct — sem compromisso.` : `Salve para não perder e siga para mais sobre ${pilar.toLowerCase()}.`,
    visual: "Slide final limpo, CTA em destaque, @ do perfil e convite para interação.",
    imagem: `${pilar} convite`,
  };

  let mid: CarouselSlide[] = [];
  switch (estrutura) {
    case "Mito × Verdade":
      mid = [
        s(2, "Contexto", `A crença que trava ${persona.split(" ")[0] || "você"}`, `Muita gente ainda acredita que ${ctx.objecao ? lc(ctx.objecao) : dor}. É aqui que a decisão começa errada.`, `Fundo neutro, palavra "MITO" em destaque.`, `${idea.tema} dúvida`),
        s(3, "Mito", `Mito: ${lc(ctx.objecao || dor)}`, `Parece verdade porque é o que todo mundo repete — mas não resolve ${dor}.`, `Ícone de "X", tom sóbrio.`, `${pilar} erro`),
        s(4, "Virada", `A verdade que muda o jogo`, `${dif}. É isso que separa "mais um conteúdo" de ${desejo}.`, `Ícone de "check", cor da marca, contraste com o slide anterior.`, `${pilar} solução`),
        s(5, "Desenvolvimento", `Por que isso importa pra você`, pos || `Quando se olha por ${dif.toLowerCase()}, ${dor} deixa de ser um beco sem saída.`, `Texto respirado, uma ideia só.`, `${idea.tema} clareza`),
        s(6, "Prova", `Sem inventar: o que dá pra afirmar`, voc ? `Nas palavras de quem viveu: "${voc}".` : `Fundamentado no que a marca realmente entrega — nada de promessa vazia.`, `Citação/depoimento real, aspas grandes.`, `${pilar} confiança`),
      ];
      break;
    case "Passo a passo":
    case "Framework":
      mid = [
        s(2, "Contexto", `O que ninguém te explica sobre ${lc(idea.tema)}`, `Antes do passo a passo: ${dor} não é falta de esforço — é falta de método.`, `Abre um "loop": promete o caminho.`, `${idea.tema} método`),
        s(3, "Passo 1", `1 · Comece por aqui`, `O primeiro movimento em direção a ${desejo}. Simples, mas quase ninguém faz.`, `Número grande, uma frase por slide.`, `${pilar} passo 1`),
        s(4, "Passo 2", `2 · O que sustenta`, `Aqui entra ${dif.toLowerCase()} — o detalhe que faz o resultado durar.`, `Consistência visual com o slide anterior.`, `${pilar} passo 2`),
        s(5, "Passo 3", `3 · O erro a evitar`, `A maioria trava por causa de ${ctx.objecao ? lc(ctx.objecao) : "um detalhe invisível"}. Evite isto.`, `Alerta suave, ícone de atenção.`, `${pilar} erro comum`),
        s(6, "Conclusão", `Junte tudo`, pos || `Com método, ${dor} vira ${desejo}. Não é sorte — é processo.`, `Recapitulação visual dos passos.`, `${idea.tema} resultado`),
      ];
      break;
    case "Case":
    case "Comparação":
      mid = [
        s(2, "Contexto", `O ponto de partida`, `A situação real: ${dor}. Familiar, né?`, `Cena do "antes", tom honesto.`, `${idea.tema} antes`),
        s(3, "Tensão", `Por que não resolvia`, `${ctx.objecao ? `A objeção "${lc(ctx.objecao)}" mantinha tudo no lugar.` : `As tentativas comuns não tocavam a raiz.`}`, `Contraste, sensação de impasse.`, `${pilar} obstáculo`),
        s(4, "Virada", `O que mudou`, `${dif}. Aqui a agulha se move de verdade.`, `Transição visual clara "antes → depois".`, `${pilar} virada`),
        s(5, "Prova", `O que é possível afirmar`, voc ? `"${voc}" — palavra de quem viveu.` : `Sem inventar números: o que a entrega real sustenta.`, `Depoimento/registro real.`, `${pilar} prova`),
        s(6, "Depois", `O novo normal`, `${desejo}. Não como promessa, mas como consequência de ${dif.toLowerCase()}.`, `Cena do "depois", esperança sóbria.`, `${idea.tema} depois`),
      ];
      break;
    default: // Lista / Storytelling
      mid = [
        s(2, "Contexto", `Se você sente ${dor}…`, `…você não está sozinho. E não é o fim da linha.`, `Espelho do cotidiano da persona.`, `${idea.tema} identificação`),
        s(3, "Desenvolvimento", `A raiz do problema`, `${dor} costuma nascer de ${ctx.objecao ? lc(ctx.objecao) : "uma crença antiga"}. Reconhecer já muda tudo.`, `Uma ideia por slide, respiro.`, `${pilar} causa`),
        s(4, "Ponto de vista", `Aqui é onde entramos`, `${dif}. É o nosso jeito — e é por isso que ${desejo} deixa de ser distante.`, `Cor da marca, ponto de vista próprio.`, `${pilar} diferencial`),
        s(5, "Aplicação", `Como isso aparece na prática`, pos || `Na prática: menos ruído, mais ${desejo}.`, `Exemplo concreto, sem inventar.`, `${idea.tema} prática`),
        s(6, "Payoff", `O que fica`, `${dor} não precisa ser permanente. ${desejo} é o caminho.`, `Fechamento emocional coerente com o tom.`, `${idea.tema} transformação`),
      ];
  }
  // Renumera e fecha com o CTA.
  const slides = [capa, ...mid];
  cta.n = slides.length + 1;
  slides.push(cta);
  return slides;
}
function s(n: number, papel: string, titulo: string, texto: string, visual: string, imagem: string): CarouselSlide {
  return { n, papel, titulo, texto, visual, imagem };
}

/** Constrói um carrossel completo (determinístico). */
export async function buildCarousel(
  idea: Idea,
  ctx: CreativeContext,
  visual: VisualRefProvider = new SearchLinkVisualProvider(),
): Promise<Carousel> {
  const estrutura = pickEstrutura(idea);
  const slides = buildSlides(idea, ctx, estrutura);
  const refs: VisualRef[] = await visual.refs(visualTerms(ctx, [idea.tema, idea.pilar.split(":")[0]!.trim()]));
  const emocaoPor = `A peça vive na jornada de ${lc(idea.jornada)} com objetivo de ${lc(idea.funcao)}; a emoção "${idea.emocao}" nasce do cruzamento persona + Big Message + posicionamento e conduz ao próximo passo sem forçar a venda.`;
  return {
    ideaId: idea.id,
    estrutura,
    capaHeadline: idea.hook,
    capaSub: `${idea.funcao} · ${idea.pilar.split(":")[0]}`,
    hook: idea.hook,
    slides,
    copy: `${idea.hook}\n\n${slides.slice(1, -1).map((sl) => sl.texto).join(" ")}\n\n${idea.cta}.`,
    cta: idea.cta,
    gatilhos: gatilhosPorFunil(idea.funil),
    elementosLiterarios: ELEMENTOS_POR_ESTRUTURA[estrutura] ?? ["Paralelismo", "Contraste"],
    gatilhosRec: recommendTriggers(idea, ctx),
    elementosRec: recommendDevices(idea, ctx),
    emocao: idea.emocao,
    emocaoPor,
    direcaoVisual: `Tom ${ctx.tom}. Identidade consistente: um conceito por slide, tipografia grande, capa com contraste, paleta da marca. Estrutura "${estrutura}".`,
    referencias: refs,
  };
}

// ---------------- Camada LLM (opcional, com fallback) ----------------

const SYSTEM = `Você é Mosaico, especialista em carrosséis para Instagram (pt-BR).
Transforma a estratégia do cliente em um carrossel PREMIUM e pronto para produção.
REGRAS: nunca invente dados, provas, números, depoimentos, autoridade, urgência ou
escassez; use só o Content DNA. Um conceito por slide. Escreva prosa de verdade.

${ANTI_AI_VOICE}

Responda SOMENTE com JSON:
{"capaHeadline":str,"hook":str,"estrutura":str,
 "slides":[{"papel":str,"titulo":str,"texto":str,"visual":str,"imagem":str}],
 "copy":str,"cta":str,"gatilhos":[str],"elementosLiterarios":[str],
 "emocao":str,"emocaoPor":str,"direcaoVisual":str}`;

export function buildCarouselPrompt(idea: Idea, ctx: CreativeContext, base: Carousel): string {
  const v = ctx.view;
  const list = (xs: string[]) => xs.map((x) => `- ${x}`).join("\n") || "- (não informado)";
  return [
    `CONTENT DNA (única fonte de verdade):`,
    `Persona: ${v.persona}`,
    `Tom: ${v.tom}`,
    `Dores:\n${list(v.dores)}`,
    `Desejos:\n${list(v.desejos)}`,
    `Objeções:\n${list(v.objecoes)}`,
    `Diferenciais:\n${list(v.diferenciais)}`,
    `Posicionamento:\n${list(v.posicionamento)}`,
    `VoC:\n${list(v.voc)}`,
    ``,
    `ESTRATÉGIA:`,
    `Big Message: ${ctx.strategy.bigMessage}`,
    `Percepção-alvo: ${ctx.strategy.percepcao}`,
    ``,
    `PEÇA: carrossel · função ${idea.funcao} (funil ${idea.funil}) · pilar ${idea.pilar.split(":")[0]} · tema ${idea.tema}`,
    `Estrutura sugerida: ${base.estrutura} · emoção sugerida: ${idea.emocao}`,
    `Hook de partida: ${idea.hook} · CTA base: ${idea.cta}`,
    ``,
    `Escreva ${base.slides.length} slides (incluindo capa e CTA), com títulos curtos e fortes.`,
  ].join("\n");
}

export function parseCarouselJson(text: string, base: Carousel): Carousel | null {
  const block = extractJsonBlock(text);
  if (!block) return null;
  let p: Record<string, unknown>;
  try {
    p = JSON.parse(block) as Record<string, unknown>;
  } catch {
    return null;
  }
  const slidesRaw = Array.isArray(p.slides) ? p.slides : [];
  const slides: CarouselSlide[] = slidesRaw
    .map((o, i) => {
      const r = (o ?? {}) as Record<string, unknown>;
      const titulo = str(r.titulo);
      const texto = str(r.texto);
      if (!titulo && !texto) return null;
      return {
        n: i + 1,
        papel: str(r.papel) || (i === 0 ? "Capa" : "Slide"),
        titulo: titulo || `Slide ${i + 1}`,
        texto,
        visual: str(r.visual) || base.direcaoVisual,
        imagem: str(r.imagem) || base.slides[i]?.imagem || "",
      };
    })
    .filter((x): x is CarouselSlide => x !== null);
  const copy = str(p.copy);
  if (slides.length < 3 || copy.length < 20) return null;
  return {
    ...base,
    origem: "ia",
    capaHeadline: str(p.capaHeadline) || base.capaHeadline,
    hook: str(p.hook) || base.hook,
    estrutura: str(p.estrutura) || base.estrutura,
    slides,
    copy,
    cta: str(p.cta) || base.cta,
    gatilhos: arr(p.gatilhos) ?? base.gatilhos,
    elementosLiterarios: arr(p.elementosLiterarios) ?? base.elementosLiterarios,
    emocao: str(p.emocao) || base.emocao,
    emocaoPor: str(p.emocaoPor) || base.emocaoPor,
    direcaoVisual: str(p.direcaoVisual) || base.direcaoVisual,
  };
}
const str = (x: unknown): string => (typeof x === "string" ? x.trim() : "");
const arr = (x: unknown): string[] | undefined => {
  if (!Array.isArray(x)) return undefined;
  const o = x.filter((s): s is string => typeof s === "string" && s.trim().length > 0);
  return o.length ? o : undefined;
};

/** Versão com LLM real; cai no determinístico em qualquer falha. */
export async function writeCarousel(
  idea: Idea,
  ctx: CreativeContext,
  llm: LlmProvider,
  visual: VisualRefProvider = new SearchLinkVisualProvider(),
): Promise<Carousel> {
  const base = await buildCarousel(idea, ctx, visual);
  if (llm.name === "mock") return base;
  try {
    const res = await llm.generate({ system: SYSTEM, messages: [{ role: "user", content: buildCarouselPrompt(idea, ctx, base) }], maxTokens: 6000 });
    return parseCarouselJson(res.text, base) ?? base;
  } catch {
    return base;
  }
}

/** Atalho a partir dos artefatos do pipeline. */
export function carouselContext(
  clientName: string,
  dna: Dna,
  strategy: StrategyArchitecture,
  editorial: EditorialArchitecture,
  research: ResearchOpportunity[],
): CreativeContext {
  return buildCreativeContext(clientName, dna, strategy, editorial, research);
}
