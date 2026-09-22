import {
  planDistribution,
  type FunnelStage as PlanFunnel,
} from "../core/planning/distribution.js";
import type {
  Dna,
  EditorialArchitecture,
  FunnelStage,
  Idea,
  MonthlyCalendar,
  NotionPage,
  PerformanceRow,
  ProducedContent,
  ResearchOpportunity,
  StrategyArchitecture,
} from "./types.js";
import { clean, short } from "./text.js";
import { deriveStrategyPaths } from "./strategy-paths.js";
import { recommendFormat } from "./formats.js";

export { clean, short } from "./text.js";
export { dnaView } from "./dna-view.js";
import { dnaView } from "./dna-view.js";

// --- Biblioteca de funções estratégicas (não só topo/meio/fundo) ---
type FnMeta = { funil: FunnelStage; jornada: string; emocao: string };
export const FUNCTION_LIB: Record<string, FnMeta> = {
  Descoberta: { funil: "topo", jornada: "Descoberta", emocao: "curiosidade" },
  Atenção: { funil: "topo", jornada: "Descoberta", emocao: "curiosidade" },
  Conscientização: { funil: "topo", jornada: "Descoberta", emocao: "reflexão" },
  Identificação: { funil: "topo", jornada: "Descoberta", emocao: "identificação" },
  Rapport: { funil: "meio", jornada: "Consideração", emocao: "pertencimento" },
  Afinidade: { funil: "meio", jornada: "Consideração", emocao: "pertencimento" },
  Relacionamento: { funil: "meio", jornada: "Consideração", emocao: "pertencimento" },
  Educação: { funil: "meio", jornada: "Consideração", emocao: "confiança" },
  Autoridade: { funil: "meio", jornada: "Consideração", emocao: "confiança" },
  Confiança: { funil: "meio", jornada: "Consideração", emocao: "segurança" },
  Posicionamento: { funil: "meio", jornada: "Consideração", emocao: "inspiração" },
  Diferenciação: { funil: "meio", jornada: "Consideração", emocao: "inspiração" },
  Prova: { funil: "fundo", jornada: "Conversão", emocao: "confiança" },
  "Quebra de Objeção": { funil: "fundo", jornada: "Conversão", emocao: "segurança" },
  Desejo: { funil: "fundo", jornada: "Conversão", emocao: "desejo" },
  Consideração: { funil: "fundo", jornada: "Conversão", emocao: "confiança" },
  Conversão: { funil: "fundo", jornada: "Conversão", emocao: "ambição" },
  Venda: { funil: "fundo", jornada: "Conversão", emocao: "desejo" },
  Retenção: { funil: "fundo", jornada: "Experiência própria", emocao: "pertencimento" },
  Comunidade: { funil: "fundo", jornada: "Experiência compartilhada", emocao: "pertencimento" },
};

// ==================== 1. ESTRATÉGIA (Átlas) ====================
export function deriveStrategy(dna: Dna): StrategyArchitecture {
  const v = dnaView(dna);
  const dor = v.dores[0] ? clean(v.dores[0]) : "uma dor central não mapeada";
  const desejo = v.desejos[0] ? clean(v.desejos[0]) : "um desejo central";
  const dif = v.diferenciais[0] ? clean(v.diferenciais[0]) : "seu diferencial";
  const difS = dif;
  const pos = v.posicionamento[0] ? clean(v.posicionamento[0]) : "";

  const bigMessage = `Você não precisa aceitar ${dor.toLowerCase()} — ${desejo.toLowerCase()} é possível, e ${difS.toLowerCase()} é o caminho.`;
  const posicionamento = pos
    ? `${dif}. ${pos}.`
    : `${dif} — a marca que resolve ${dor.toLowerCase()} com ${desejo.toLowerCase()}.`;

  const funcoes = [
    "Identificação",
    "Conscientização",
    "Autoridade",
    "Educação",
    "Prova",
    "Quebra de Objeção",
    "Diferenciação",
    "Desejo",
    "Conversão",
    "Relacionamento",
  ];
  const emocoes = [
    ...new Set(funcoes.map((f) => FUNCTION_LIB[f]?.emocao ?? "confiança")),
  ];

  const pilares = derivePilares(v);
  const { paths, mix } = deriveStrategyPaths(dna);
  return {
    posicionamento,
    bigMessage,
    persona: v.persona || "Persona a definir",
    dores: v.dores,
    desejos: v.desejos,
    objecoes: v.objecoes,
    voc: v.voc,
    diferenciais: v.diferenciais,
    objetivos: ["Construir autoridade", "Gerar rapport e identificação", "Quebrar objeções", "Gerar demanda e conversão"],
    jornada: ["Descoberta", "Consideração", "Conversão", "Experiência própria", "Experiência compartilhada"],
    funil: ["topo", "meio", "fundo"],
    percepcao: `De "${clean(v.objecoes[0] ?? "marca comum").toLowerCase()}" para "${difS.toLowerCase()}, em quem eu confio".`,
    emocoes,
    pilares,
    funcoes,
    paths,
    mix,
  };
}

function derivePilares(v: ReturnType<typeof dnaView>): string[] {
  // Pilares nascem do território real do cliente (diferencial, dores, desejos).
  const base = [
    v.diferenciais[0] ? `Autoridade: ${clean(v.diferenciais[0])}` : "Autoridade no tema",
    v.dores[0] ? `Identificação: ${clean(v.dores[0])}` : "Identificação",
    v.desejos[0] ? `Transformação: ${clean(v.desejos[0])}` : "Transformação",
    "Bastidores & prova",
  ];
  return base.slice(0, 4);
}

// ==================== 2. PESQUISA (Radar) ====================
export function deriveResearch(dna: Dna): ResearchOpportunity[] {
  const v = dnaView(dna);
  const today = new Date().toISOString().slice(0, 10);
  const ops: ResearchOpportunity[] = [];
  if (v.dores[0])
    ops.push({ tipo: "Pauta quente", insight: `Conteúdo que nomeia a dor: "${clean(v.dores[0])}"`, origem: "Derivado do Content DNA (entrevista)", data: today, relevancia: "Alta — identificação de topo" });
  if (v.objecoes[0])
    ops.push({ tipo: "Oportunidade", insight: `Série de quebra de objeção: "${clean(v.objecoes[0])}"`, origem: "Derivado do Content DNA", data: today, relevancia: "Alta — desbloqueia conversão" });
  if (v.diferenciais[0])
    ops.push({ tipo: "Ângulo de autoridade", insight: `Explorar o diferencial "${clean(v.diferenciais[0])}" como território próprio`, origem: "Derivado do Content DNA", data: today, relevancia: "Média — diferenciação" });
  ops.push({ tipo: "Nota", insight: "Pesquisa externa real (tendências, concorrentes, palavras-chave) exige acesso web/API — não fabricada.", origem: "Sistema", data: today, relevancia: "—" });
  return ops;
}

// ==================== 3. EDITORIAL (Bússola) ====================
export function buildEditorial(strategy: StrategyArchitecture): EditorialArchitecture {
  return strategy.pilares.map((pilar) => {
    const nome = pilar.split(":")[0]!.trim();
    return {
      pilar,
      territorio: nome,
      temas: [
        { tema: `${nome} — fundamentos`, subtemas: ["conceitos", "erros comuns"], topicos: ["o que ninguém explica", "mito x verdade"] },
        { tema: `${nome} — na prática`, subtemas: ["passo a passo", "exemplos"], topicos: ["como fazer", "antes e depois"] },
      ],
    };
  });
}

// ==================== 4. IDEIAS & FORMATOS (Musa) ====================
const SURFACE_BY_FUNNEL: Record<FunnelStage, [string, string][]> = {
  topo: [["Reel", "Erro comum"], ["Reel", "Mito × Verdade"], ["Reel", "Identificação"], ["Carrossel", "Lista"]],
  meio: [["Carrossel", "Framework"], ["Carrossel", "Comparação"], ["Reel", "Análise"], ["Stories", "Bastidores"]],
  fundo: [["Carrossel", "Case"], ["Stories", "Quebra de objeção"], ["Reel", "Demonstração"], ["Stories", "Prova"]],
};

export function generateIdeas(dna: Dna, strategy: StrategyArchitecture, min = 15): Idea[] {
  const v = dnaView(dna);
  const dor = clean(v.dores[0] ?? "a dor da persona");
  const desejo = clean(v.desejos[0] ?? "o desejo da persona");
  const objecao = clean(v.objecoes[0] ?? "a objeção da persona");
  const dif = clean(v.diferenciais[0] ?? "o diferencial");
  const ideas: Idea[] = [];
  let n = 0;
  // Percorre todas as funções estratégicas → garante diversidade real.
  for (const funcao of strategy.funcoes) {
    const meta = FUNCTION_LIB[funcao]!;
    const surfaces = SURFACE_BY_FUNNEL[meta.funil];
    const pick = surfaces[n % surfaces.length]!;
    const pilar = strategy.pilares[n % strategy.pilares.length]!;
    const seedByFn: Record<string, { titulo: string; angulo: string; hook: string }> = {
      Identificação: { titulo: `O erro silencioso ligado a ${dor.toLowerCase()}`, angulo: "Espelho do cotidiano da persona", hook: `Se você sente ${dor.toLowerCase()}, isso é pra você.` },
      Conscientização: { titulo: `Mito × verdade sobre ${desejo.toLowerCase()}`, angulo: "Quebra de crença", hook: `A verdade sobre ${desejo.toLowerCase()} que ninguém te conta.` },
      Autoridade: { titulo: `Por que ${dif.toLowerCase()} muda o jogo`, angulo: "Ponto de vista próprio", hook: `Ninguém fala disto: ${dif.toLowerCase()}.` },
      Educação: { titulo: `Passo a passo: rumo a ${desejo.toLowerCase()}`, angulo: "Framework salvável", hook: `Salve isto se você quer ${desejo.toLowerCase()}.` },
      Prova: { titulo: `O que acontece quando resolvem ${dor.toLowerCase()}`, angulo: "Case real (sem inventar)", hook: `Olha o que mudou depois de resolver ${dor.toLowerCase()}.` },
      "Quebra de Objeção": { titulo: `"${objecao}" — vamos conversar sobre isso`, angulo: "Enfrentar a objeção de frente", hook: `Você acha que ${objecao.toLowerCase()}? Então vem cá.` },
      Diferenciação: { titulo: `O que só nós fazemos: ${dif.toLowerCase()}`, angulo: "Território próprio", hook: `Existe um jeito diferente — ${dif.toLowerCase()}.` },
      Desejo: { titulo: `Como seria ${desejo.toLowerCase()}`, angulo: "Projeção do futuro desejado", hook: `Imagina ${desejo.toLowerCase()}.` },
      Conversão: { titulo: `Pronto para ${desejo.toLowerCase()}? Comece aqui`, angulo: "Chamada clara e sem pressão", hook: `Se ${desejo.toLowerCase()} faz sentido, o próximo passo é simples.` },
      Relacionamento: { titulo: `Bastidores: como cuidamos de ${dor.toLowerCase()}`, angulo: "Proximidade e cultura", hook: `Deixa eu te mostrar como a gente faz.` },
    };
    const seed = seedByFn[funcao] ?? { titulo: `${funcao}: conteúdo estratégico`, angulo: "Ângulo estratégico", hook: "Presta atenção nisto." };
    ideas.push({
      id: `idea-${n + 1}`,
      titulo: seed.titulo,
      conceito: `${funcao} através de ${pick[1].toLowerCase()}, ancorado no Content DNA do cliente.`,
      angulo: seed.angulo,
      persona: strategy.persona,
      dorDesejo: meta.funil === "fundo" ? desejo : dor,
      objetivo: funcao,
      funcao,
      funil: meta.funil,
      jornada: meta.jornada,
      emocao: meta.emocao,
      percepcao: strategy.percepcao,
      pilar,
      tema: `${pilar.split(":")[0]} — na prática`,
      subtema: pick[1],
      surface: pick[0],
      format: pick[1],
      formatRec: recommendFormat(funcao, meta.funil, pick[0]),
      hook: seed.hook,
      cta: meta.funil === "fundo" ? "Chamar no direct" : "Salvar + seguir",
      justificativa: `Função ${funcao} (${meta.funil}); usa a dor/desejo reais e o diferencial do cliente — não é intercambiável entre marcas.`,
    });
    n++;
  }
  // Completa até o mínimo, variando pilar/formato.
  while (ideas.length < min) {
    const base = ideas[ideas.length % strategy.funcoes.length]!;
    const alt = { ...base, id: `idea-${ideas.length + 1}`, titulo: `${base.titulo} — outro ângulo`, angulo: `${base.angulo} (variação)`, format: base.format === "Lista" ? "Checklist" : "Série" };
    ideas.push(alt);
  }
  return ideas;
}

// ==================== 5. PRODUÇÃO — Roteiro/Copy (Rima) ====================
export function produceContent(idea: Idea, dna: Dna): ProducedContent {
  const v = dnaView(dna);
  const tom = v.tom ? clean(v.tom) : "próximo e claro";
  const emocaoPor = `A persona está na jornada de ${idea.jornada.toLowerCase()} e o objetivo é ${idea.funcao.toLowerCase()}; a emoção "${idea.emocao}" nasce do cruzamento persona + Big Message + posicionamento, e sustenta o próximo passo sem agressividade.`;
  const gatilhos = idea.funil === "fundo" ? ["Prova", "Especificidade", "Redução de risco"] : idea.funil === "meio" ? ["Autoridade", "Reciprocidade", "Especificidade"] : ["Curiosidade", "Identificação", "Contraste"];
  const recursos = idea.funil === "topo" ? ["Open loop", "Quebra de expectativa", "Cena do cotidiano"] : ["Paralelismo", "Contraste", "Storytelling"];
  const direcao = `Tom ${tom}. Identidade visual consistente da marca; ${idea.surface === "Reel" ? "cortes no ritmo da fala, legendas grandes, rosto humano" : idea.surface === "Carrossel" ? "um conceito por slide, hierarquia clara, capa com contraste" : "sequência curta, stickers de interação"}.`;

  const base: ProducedContent = {
    ideaId: idea.id,
    headline: idea.hook,
    kind: idea.surface === "Reel" ? "reel" : idea.surface === "Carrossel" ? "carrossel" : idea.surface === "Stories" ? "stories" : "outro",
    copy: `${idea.hook}\n\n${idea.conceito} ${idea.dorDesejo}. ${idea.cta}.`,
    cta: idea.cta,
    gatilhos,
    recursos,
    emocao: idea.emocao,
    emocaoPor,
    direcaoVisual: direcao,
  };

  if (base.kind === "reel") {
    base.roteiro = [
      { label: "Hook", text: idea.hook },
      { label: "Contexto", text: `A maioria vive ${idea.dorDesejo.toLowerCase()} sem perceber a saída.` },
      { label: "Desenvolvimento", text: `${idea.conceito}` },
      { label: "Retenção", text: "Abre um loop: 'mas tem um detalhe que muda tudo…'" },
      { label: "Prova/Argumento", text: v.posicionamento[0] ? clean(v.posicionamento[0]) : "Ponto de vista fundamentado, sem inventar resultado." },
      { label: "Payoff", text: `${idea.dorDesejo} deixa de ser um problema quando se olha por aqui.` },
      { label: "CTA", text: idea.cta },
    ];
  } else if (base.kind === "carrossel") {
    base.slides = [
      { label: "Capa", text: idea.hook },
      { label: "Slide 2", text: `Por que isto importa para ${idea.persona.slice(0, 40)}…` },
      { label: "Slide 3", text: `${idea.conceito}` },
      { label: "Slide 4", text: "Exemplo/aplicação prática (ancorada no real, sem inventar)." },
      { label: "Slide 5", text: v.diferenciais[0] ? clean(v.diferenciais[0]) : "O diferencial em ação." },
      { label: "Conclusão", text: `${idea.dorDesejo} tem caminho.` },
      { label: "CTA", text: idea.cta },
    ];
  } else if (base.kind === "stories") {
    base.stories = [
      { label: "Story 1 (Atração)", text: idea.hook },
      { label: "Story 2 (Curiosidade)", text: `${idea.conceito}` },
      { label: "Story 3 (Conexão)", text: "Prova/identificação com pessoa real; enquete de engajamento." },
      { label: "Story 4 (CTA)", text: `${idea.cta} — caixa de perguntas.` },
    ];
  }
  return base;
}

// ==================== 6. CALENDÁRIO (Cronos) ====================
const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
export function assembleCalendar(
  ideas: Idea[],
  dna: Dna,
  total: number,
  funnelMix: Record<PlanFunnel, number>,
): MonthlyCalendar {
  const plan = planDistribution({ total, funnel: funnelMix });
  // Seleciona ideias respeitando o mix por funil.
  const byFunnel: Record<FunnelStage, Idea[]> = { topo: [], meio: [], fundo: [] };
  ideas.forEach((i) => byFunnel[i.funil].push(i));
  const chosen: Idea[] = [];
  (["topo", "meio", "fundo"] as FunnelStage[]).forEach((stage) => {
    const want = plan.funnel[stage];
    for (let k = 0; k < want; k++) {
      const pool = byFunnel[stage];
      if (pool.length) chosen.push(pool[k % pool.length]!);
    }
  });
  const items = chosen.map((idea, i) => ({
    data: `${WEEKDAYS[i % 7]} ${String(1 + i).padStart(2, "0")}`,
    idea,
    content: produceContent(idea, dna),
    status: i === 0 ? "WAITING APPROVAL" : i < 3 ? "REVIEW" : "PLANNED",
  }));
  return { total: items.length, mix: plan.funnel, items };
}

// ==================== 7. NOTION (payload, sem chamada real) ====================
export function toNotionPages(calendar: MonthlyCalendar, clientName: string): NotionPage[] {
  return calendar.items.map((it) => ({
    title: it.content.headline,
    properties: {
      Cliente: clientName,
      Data: it.data,
      Plataforma: it.idea.surface,
      Formato: it.idea.format,
      Pilar: it.idea.pilar.split(":")[0]!,
      Objetivo: it.idea.objetivo,
      Funil: it.idea.funil,
      "Função estratégica": it.idea.funcao,
      Emoção: it.idea.emocao,
      CTA: it.content.cta,
      Status: it.status,
    },
    bodyPreview: `${it.content.headline}\n\n${it.content.copy}`,
  }));
}

// ==================== 8. PERFORMANCE (Pulso) ====================
export function seedPerformance(strategy: StrategyArchitecture): PerformanceRow[] {
  return [
    { kind: "DATA", text: "Sem histórico ainda: métricas reais entram após publicação (dependem de API de rede social)." },
    { kind: "HYPOTHESIS", text: `Conteúdos de ${strategy.funcoes[0]} devem gerar mais alcance qualificado no topo.` },
    { kind: "INTERPRETATION", text: "Interpretar sempre pelo objetivo da peça — não tratar todas as métricas igualmente." },
    { kind: "INSIGHT", text: "Aprendizados só viram fato do cliente com evidência suficiente (nunca causalidade por correlação)." },
    { kind: "RECOMMENDATION", text: "Primeiro ciclo é de calibração: medir hooks e funções, ajustar o mix no próximo mês." },
  ];
}
