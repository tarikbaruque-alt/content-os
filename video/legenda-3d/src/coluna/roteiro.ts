// Roteiro da edição "dica do físio — coluna lombar". Tempos em segundos no vídeo já decupado.

export const COR = {
  ouro: "#F2B84B",
  ouroEscuro: "#8A5A12",
  dor: "#FF5A4E",
  branco: "#FFFFFF",
  vidro: "rgba(14,17,22,0.72)",
  tinta: "#0E1116",
};

export type Plano = { escala: number; ox: number; oy: number };
const W: Plano = { escala: 1, ox: 50, oy: 40 };
const W2: Plano = { escala: 1.1, ox: 55, oy: 55 };
const M = (ox: number, oy: number): Plano => ({ escala: 1.35, ox, oy });

export const TOMADAS: { ini: number; fim: number; plano: Plano }[] = [
  { ini: 0, fim: 3.33, plano: M(47, 26) },
  { ini: 3.33, fim: 6.24, plano: { escala: 1.12, ox: 50, oy: 35 } },
  { ini: 6.24, fim: 11.26, plano: M(57, 22) },
  { ini: 11.26, fim: 16.56, plano: W },
  { ini: 16.56, fim: 19.56, plano: W2 },
  { ini: 19.56, fim: 25.51, plano: W },
  { ini: 25.51, fim: 60, plano: M(58, 24) },
];

// Páginas da legenda: no máximo 2 palavras (índices das palavras em props.palavras).
export const PAGINAS: [number, number][] = [
  [0, 0], [1, 2], [3, 3], [4, 5], [6, 6], [7, 8],
  [9, 10], [11, 11], [12, 13], [14, 15], [16, 17], [18, 19],
  [20, 21], [22, 23], [24, 24], [25, 25], [26, 26],
  [27, 28], [29, 30], [31, 31], [32, 33], [34, 35],
  [36, 36], [37, 38], [39, 39], [40, 41],
  [42, 42], [43, 44], [45, 46],
  [47, 47], [48, 49], [50, 50], [51, 52], [53, 53],
  [54, 55], [56, 57], [58, 59], [60, 60], [61, 62], [63, 64],
];

// Palavras em serifa itálica dourada (as que carregam a mensagem) e as de dor, em vermelho.
export const CHAVE = new Set(["físio", "coluna", "lombar", "trabalho", "joelho", "tronco", "gravidade", "devagarinho", "segundos", "repetir", "intervalo"]);
export const DOR = new Set(["doendo", "pesada", "rígida"]);

export const BROLLS = [
  { ini: 1.78, fim: 3.33, src: "coluna/broll-fisio.png", titulo: "Dica rápida", sub: "DO FÍSIO", tSub: 2.81, largura: 640, aspecto: "2 / 3" },
  { ini: 6.66, fim: 10.3, src: "coluna/broll-dor.png", titulo: "Coluna lombar", sub: "", tSub: 0, largura: 700, aspecto: "1 / 1" },
];

export const CARIMBOS_DOR = [
  { t: 7.72, texto: "DOENDO" },
  { t: 8.18, texto: "PESADA" },
  { t: 9.4, texto: "RÍGIDA" },
];

export const PASSOS = [
  { t: 11.56, texto: "Dobra o joelho" },
  { t: 13.19, texto: "Deixa o tronco cair" },
  { t: 16.78, texto: "Solta o tronco" },
  { t: 19.78, texto: "Deixa a gravidade atuar" },
  { t: 21.87, texto: "Sobe devagarinho" },
];
export const PASSOS_FIM = 25.55;

export const SONS: { t: number; arquivo: string; volume: number }[] = [
  { t: 0.25, arquivo: "whoosh_curto", volume: 0.28 },
  { t: 1.68, arquivo: "whoosh", volume: 0.32 },
  { t: 2.79, arquivo: "tick", volume: 0.45 },
  { t: 3.25, arquivo: "whoosh_saida", volume: 0.25 },
  { t: 6.56, arquivo: "whoosh", volume: 0.32 },
  { t: 7.7, arquivo: "impacto", volume: 0.22 },
  { t: 8.16, arquivo: "impacto", volume: 0.22 },
  { t: 9.38, arquivo: "impacto", volume: 0.26 },
  { t: 10.22, arquivo: "whoosh_saida", volume: 0.25 },
  { t: 11.54, arquivo: "tick", volume: 0.45 },
  { t: 13.17, arquivo: "tick", volume: 0.45 },
  { t: 16.76, arquivo: "tick", volume: 0.45 },
  { t: 19.76, arquivo: "tick", volume: 0.45 },
  { t: 20.25, arquivo: "whoosh_saida", volume: 0.22 },
  { t: 21.85, arquivo: "tick", volume: 0.45 },
  { t: 22.5, arquivo: "riser_longo", volume: 0.35 },
  { t: 25.64, arquivo: "pop", volume: 0.4 },
  { t: 26.11, arquivo: "ding", volume: 0.3 },
  { t: 28.45, arquivo: "whoosh_curto", volume: 0.26 },
  { t: 28.76, arquivo: "ding", volume: 0.32 },
];
