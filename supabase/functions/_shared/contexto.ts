import type { Backend } from "./tipos.ts";
import type { Ferramenta } from "./executor.ts";

// Regras que valem para todo agente. As de voz são as mesmas que o painel já
// manda para o Claude (apps/web/src/32-formatos-e-analise.js, ANTI_AI_VOICE_JS).
export const REGRAS = [
  "REGRAS INEGOCIÁVEIS:",
  "- Nunca invente dados, números, resultados, depoimentos, autoridade, urgência ou escassez.",
  "- O que é declarado pelo cliente (ficha, briefing, Content DNA aprovado) é fato. O resto é hipótese e deve ser dito como hipótese.",
  "- Você propõe; o estrategista humano aprova. Escreva para ele decidir rápido: específico, com o porquê.",
  "- Teste do concorrente: se outro perfil do nicho pudesse publicar o mesmo texto trocando só o nome, aprofunde no que é deste cliente.",
  "- Português do Brasil.",
].join("\n");

export const VOZ = [
  'VOZ HUMANA, nunca "cara de IA". Evite: "no mundo de hoje", "é fundamental", "destravar", "elevar", "mergulhar", "jornada" fora de contexto, "não é só X, é Y", "imagine só";',
  "frases simétricas em sequência; entusiasmo genérico sem substância; a mesma cadência em todo parágrafo; travessões e negritos como muleta.",
  "Use o vocabulário real do cliente e prefira uma frase concreta e imperfeita a uma frase redonda demais.",
].join(" ");

const linha = (k: string, v: unknown) => (v === undefined || v === null || v === "" ? "" : `- ${k}: ${Array.isArray(v) ? v.join("; ") : String(v)}`);

/** Ficha + briefing + Content DNA (sem o que foi rejeitado), como texto para o modelo. */
export async function textoDoCliente(b: Backend, ws: string, cli: string): Promise<string> {
  const c = (await b.getDoc(ws, `cos_clients/${cli}`)) ?? {};
  const f = c.ficha ?? {};
  const m = c.metas ?? {};
  const ficha = [
    linha("Nome", c.name), linha("Nicho", c.niche), linha("Instagram", f.instagram), linha("Região", f.regiao),
    linha("Ticket", f.ticket), linha("Oferta", f.oferta), linha("Público", f.publico), linha("Tom de voz", f.tom),
    linha("NÃO pode aparecer", f.restricoes), linha("Observações", f.obs),
    linha("Objetivos", m.objetivos), linha("Propósito", m.proposito), linha("Identidade", m.identidade),
  ].filter(Boolean);
  const dna = (((await b.getDoc(ws, `cos_dna/${cli}`)) ?? {}).entries ?? []) as any[];
  const reg = dna.filter((e) => e.status !== "rejected").map((e) => `- [${e.section}/${e.field}] (${e.state}${e.status === "approved" ? ", aprovado" : ", pendente"}) ${e.value}`);
  const br = String(c.briefing ?? "").trim();
  return [
    ficha.length ? `FICHA DO CLIENTE (fato):\n${ficha.join("\n")}` : "",
    br ? `BRIEFING (palavras do cliente):\n${br.slice(0, 4000)}` : "",
    reg.length ? `CONTENT DNA:\n${reg.join("\n")}` : "CONTENT DNA: vazio.",
  ].filter(Boolean).join("\n\n");
}

type Metricas = { alcance: number; salvamentos?: number; compartilhamentos?: number; comentarios?: number; seguidores?: number; tipo?: string };
const eng = (m: Metricas) => (m.alcance > 0 ? ((m.salvamentos ?? 0) + (m.compartilhamentos ?? 0) + (m.comentarios ?? 0)) / m.alcance : 0);

/** Posts medidos: peças do calendário com métricas + posts avulsos do CSV (cos_perf). */
export async function postsMedidos(b: Backend, ws: string, cli: string) {
  const itens = await b.listDocs(ws, `cos_calendar/${cli}/items`);
  const out: { data: string; tipo: string; formato: string; funil: string; titulo: string; m: Metricas }[] = [];
  for (const { data: it } of itens) {
    const m = it.metrics as Metricas | undefined;
    if (!m || !(m.alcance > 0)) continue;
    const x = it.idea ?? {};
    out.push({ data: it.data, tipo: m.tipo || x.surface || "Post", formato: x.formatRec?.formato || x.format || "", funil: x.funil || "", titulo: it.content?.headline || x.titulo || "", m });
  }
  const perf = ((await b.getDoc(ws, `cos_perf/${cli}`)) ?? {}).posts ?? [];
  for (const p of perf) out.push({ data: p.data, tipo: p.superficie, formato: p.superficie, funil: "", titulo: p.legenda || "(post fora do calendário)", m: p });
  return out.sort((a, b2) => (a.data < b2.data ? 1 : -1));
}

export function resumoDesempenho(posts: Awaited<ReturnType<typeof postsMedidos>>): string {
  if (!posts.length) return "Nenhum post medido ainda.";
  const grupo = (k: "tipo" | "funil" | "formato") => {
    const g: Record<string, { n: number; alc: number; int: number }> = {};
    for (const p of posts) {
      const key = p[k];
      if (!key) continue;
      const x = (g[key] ??= { n: 0, alc: 0, int: 0 });
      x.n++; x.alc += p.m.alcance; x.int += eng(p.m) * p.m.alcance;
    }
    return Object.entries(g).map(([key, x]) => `${key}: ${x.n} post(s), alcance médio ${Math.round(x.alc / x.n)}, engajamento ${(x.alc ? (x.int / x.alc) * 100 : 0).toFixed(1)}%`).join("; ");
  };
  const lista = posts.slice(0, 30).map((p) => `${p.data} · ${p.tipo}${p.formato && p.formato !== p.tipo ? "/" + p.formato : ""}${p.funil ? " · " + p.funil : ""} · alcance ${p.m.alcance} · salv ${p.m.salvamentos ?? 0} · compart ${p.m.compartilhamentos ?? 0} · coment ${p.m.comentarios ?? 0} · seg ${p.m.seguidores ?? 0} · "${String(p.titulo).slice(0, 70)}"`);
  return [
    `${posts.length} post(s) medidos. Engajamento = (salvamentos + compartilhamentos + comentários) ÷ alcance.`,
    `Por tipo: ${grupo("tipo")}`, `Por funil: ${grupo("funil") || "sem dado"}`, `Por formato: ${grupo("formato") || "sem dado"}`,
    "Posts (mais recentes primeiro):", ...lista,
  ].join("\n");
}

const semEntrada = { type: "object", properties: {}, additionalProperties: false };

/** Ferramentas de leitura, presas a um workspace e a um cliente. */
export function ferramentasDeLeitura(b: Backend, ws: string, cli: string, agente: string): Record<string, Ferramenta> {
  return {
    ler_cliente: { nome: "ler_cliente", descricao: "Ficha, briefing e Content DNA do cliente.", entrada: semEntrada, rodar: () => textoDoCliente(b, ws, cli) },
    ler_estrategia: {
      nome: "ler_estrategia", descricao: "Estratégia atual do cliente (posicionamento, Big Message, caminhos e mix).", entrada: semEntrada,
      rodar: async () => (await b.getDoc(ws, `cos_strategy/${cli}`)) ?? "Ainda não há estratégia.",
    },
    ler_linha_editorial: {
      nome: "ler_linha_editorial", descricao: "Linha editorial atual (pilares, territórios, temas).", entrada: semEntrada,
      rodar: async () => ((await b.getDoc(ws, `cos_editorial/${cli}`)) ?? {}).pilares ?? "Ainda não há linha editorial.",
    },
    ler_pesquisa: {
      nome: "ler_pesquisa", descricao: "Última pesquisa aprovada (pautas, tendências, concorrentes), com fontes.", entrada: semEntrada,
      rodar: async () => ((await b.getDoc(ws, `cos_research/${cli}`)) ?? {}).items ?? "Ainda não há pesquisa.",
    },
    ler_ideias: {
      nome: "ler_ideias", descricao: "Títulos das ideias já existentes (para não repetir).", entrada: semEntrada,
      rodar: async () => (await b.listDocs(ws, `cos_ideas/${cli}/items`)).map((d) => `${d.data.titulo} [${d.data.format}, ${d.data.funil}]`),
    },
    ler_calendario: {
      nome: "ler_calendario", descricao: "Peças do calendário com data, formato, status e se já têm texto.", entrada: semEntrada,
      rodar: async () => (await b.listDocs(ws, `cos_calendar/${cli}/items`)).map((d) => {
        const it = d.data;
        return `${it.data} · ${it.idea?.surface}/${it.idea?.format} · ${it.status} · ${it.content || it.carousel || it.stories ? "com texto" : "sem texto"} · ${it.idea?.titulo}`;
      }),
    },
    ler_desempenho: {
      nome: "ler_desempenho", descricao: "Resultados reais medidos (por tipo de post, funil, formato e post a post).", entrada: semEntrada,
      rodar: async () => resumoDesempenho(await postsMedidos(b, ws, cli)),
    },
    buscar_conhecimento: {
      nome: "buscar_conhecimento",
      descricao: "Busca na Knowledge Base do Content OS (métodos de estratégia, jornada, criação, distribuição no Instagram, planejamento). Use para fundamentar decisões; cite a fonte.",
      entrada: { type: "object", properties: { consulta: { type: "string", description: "O que você procura, em português." } }, required: ["consulta"], additionalProperties: false },
      rodar: async (i) => {
        const r = await b.buscarKB(ws, String(i.consulta ?? ""), agente, 5);
        return r.length ? r.map((t) => `[${t.fonte}${t.secao ? " · " + t.secao : ""}]\n${t.texto}`).join("\n\n---\n\n") : "Nada encontrado.";
      },
    },
  };
}
