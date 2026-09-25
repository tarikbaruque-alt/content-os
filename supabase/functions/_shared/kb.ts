// Knowledge Base: fatia documentos em trechos por seção para a busca em
// português do Postgres (kb_buscar). Um trecho = uma seção "## …", partida em
// pedaços de ~1.800 caracteres quando é longa, sempre com o título junto.

/** Quais agentes costumam usar cada pilar (mesmo mapa de src/core/knowledge/retriever.ts). */
export const PILAR_AGENTES: Record<string, string[]> = {
  "estrategia-marca": ["iris", "atlas", "radar"],
  "jornada-e-editorias": ["atlas", "bussola", "musa", "estudio"],
  "distribuicao-instagram": ["radar", "musa", "pulso"],
  "criacao-alto-valor": ["musa", "estudio"],
  "planejamento-cadencia": ["musa", "pulso"],
  "trafego-pago": [],
  "creative-doctrine": ["musa", "estudio"],
  "editorial-architecture": ["bussola", "musa"],
  "formats": ["musa", "estudio", "pulso"],
  "content-model": ["musa"],
};

export type Trecho = { fonte: string; titulo: string; secao: string | null; texto: string; agentes: string[] };
const MAX = 1800;

export function trechosDoMarkdown(fonte: string, md: string, agentesExtras: string[] = []): Trecho[] {
  const nome = fonte.split("/").pop()!.replace(/\.md$/, "");
  const agentes = [...new Set([...(PILAR_AGENTES[nome] ?? []), ...agentesExtras])];
  const titulo = (md.match(/^#\s+(.+)$/m)?.[1] ?? nome).replace(/[*_`]/g, "").trim();
  const partes = md.split(/^(?=##\s)/m);
  const out: Trecho[] = [];
  for (const parte of partes) {
    const secao = parte.match(/^##\s+(.+)$/m)?.[1]?.replace(/[*_`]/g, "").trim() ?? null;
    const corpo = parte.replace(/^#{1,2}\s+.+$/m, "").replace(/\n{3,}/g, "\n\n").trim();
    if (corpo.length < 40) continue;
    const blocos: string[] = [];
    let atual = "";
    for (const par of corpo.split(/\n\n/)) {
      if (atual && atual.length + par.length > MAX) { blocos.push(atual); atual = ""; }
      atual += (atual ? "\n\n" : "") + par;
    }
    if (atual) blocos.push(atual);
    blocos.forEach((t, i) => out.push({ fonte, titulo, secao: secao ? (blocos.length > 1 ? `${secao} (${i + 1}/${blocos.length})` : secao) : null, texto: t, agentes }));
  }
  return out;
}
