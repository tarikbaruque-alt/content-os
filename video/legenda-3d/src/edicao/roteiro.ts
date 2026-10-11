import type { Plano } from "./marca";

// Tempos em segundos no vídeo já cortado (as pausas longas foram removidas).
// Cada evento parte do instante em que a palavra é falada.

export const TOMADAS: { ini: number; fim: number; plano: Plano }[] = [
  { ini: 0, fim: 2.94, plano: "W" },
  { ini: 2.94, fim: 6.452, plano: "M" },
  { ini: 6.452, fim: 7.945, plano: "W2" },
  { ini: 7.945, fim: 9.45, plano: "M" },
  { ini: 9.45, fim: 17.15, plano: "W" },
  { ini: 17.15, fim: 21.55, plano: "W2" },
  { ini: 21.55, fim: 27.49, plano: "W" },
  { ini: 27.49, fim: 30.29, plano: "M" },
  { ini: 30.29, fim: 35.366, plano: "W" },
  { ini: 35.366, fim: 37.21, plano: "W2" },
  { ini: 37.21, fim: 39.5, plano: "M" },
  { ini: 39.5, fim: 45.27, plano: "W" },
  { ini: 45.27, fim: 46.86, plano: "M" },
  { ini: 46.86, fim: 60, plano: "W" },
];

export type BRoll = { ini: number; fim: number; src: string; estilo: "tela" | "cartao"; rotulos: { t: number; texto: string; cor: string }[] };

export const BROLLS: BRoll[] = [
  {
    ini: 13.72,
    fim: 17.15,
    src: "edicao/broll-alimentacao.webp",
    estilo: "tela",
    rotulos: [
      { t: 13.8, texto: "ALIMENTAÇÃO", cor: "verde" },
      { t: 15.89, texto: "PLANEJAMENTO", cor: "branco" },
    ],
  },
  {
    ini: 21.52,
    fim: 23.5,
    src: "edicao/broll-agachamento.webp",
    estilo: "tela",
    rotulos: [{ t: 21.59, texto: "CONSTRUIR MASSA MUSCULAR", cor: "verde" }],
  },
  {
    ini: 39.47,
    fim: 41.88,
    src: "edicao/broll-costas.png",
    estilo: "cartao",
    rotulos: [
      { t: 39.54, texto: "NÃO PRECISA SER EXAUSTIVO", cor: "laranja" },
      { t: 41.0, texto: "NEM MUITO LONGO", cor: "branco" },
    ],
  },
];

export const CAPITULOS = [
  { ini: 17.43, fim: 30.29, texto: "HIPERTROFIA", cor: "verde" as const },
  { ini: 30.55, fim: 37.21, texto: "EMAGRECIMENTO", cor: "laranja" as const },
];

// Seção em laranja: destaque da legenda muda de cor.
export const SECAO_LARANJA = { ini: 30.29, fim: 37.21 };

export const PALAVRAS_CHAVE = new Set([
  "hipertrofia", "emagrecimento", "emagrecer", "treino", "alimentação", "planejar", "alimentos",
  "massa", "muscular", "volume", "intensidade", "déficit", "calórico", "menos", "mais", "exaustivo",
  "longo", "preservar", "compartilha", "curte", "comenta", "muda", "rápida", "simples",
]);

export type Som = { t: number; arquivo: string; volume: number };
export const SONS: Som[] = [
  { t: 0.06, arquivo: "impacto", volume: 0.5 },
  { t: 1.18, arquivo: "pop", volume: 0.55 },
  { t: 1.82, arquivo: "impacto", volume: 0.38 },
  { t: 2.92, arquivo: "whoosh_curto", volume: 0.3 },
  { t: 9.46, arquivo: "whoosh_curto", volume: 0.35 },
  { t: 10.74, arquivo: "impacto", volume: 0.42 },
  { t: 11.6, arquivo: "whoosh_saida", volume: 0.3 },
  { t: 12.34, arquivo: "pop", volume: 0.5 },
  { t: 13.6, arquivo: "whoosh", volume: 0.42 },
  { t: 15.87, arquivo: "pop", volume: 0.45 },
  { t: 17.0, arquivo: "whoosh_saida", volume: 0.32 },
  { t: 17.41, arquivo: "tick", volume: 0.5 },
  { t: 19.17, arquivo: "whoosh_curto", volume: 0.3 },
  { t: 19.97, arquivo: "pop", volume: 0.55 },
  { t: 21.4, arquivo: "whoosh", volume: 0.42 },
  { t: 23.35, arquivo: "whoosh_saida", volume: 0.3 },
  { t: 23.73, arquivo: "tick", volume: 0.55 },
  { t: 24.69, arquivo: "tick", volume: 0.55 },
  { t: 26.45, arquivo: "ding", volume: 0.45 },
  { t: 30.53, arquivo: "tick", volume: 0.5 },
  { t: 32.45, arquivo: "impacto", volume: 0.36 },
  { t: 33.09, arquivo: "pop", volume: 0.45 },
  { t: 34.5, arquivo: "whoosh_curto", volume: 0.3 },
  { t: 35.51, arquivo: "pop", volume: 0.5 },
  { t: 36.15, arquivo: "whoosh_curto", volume: 0.28 },
  { t: 36.71, arquivo: "pop", volume: 0.5 },
  { t: 39.35, arquivo: "whoosh", volume: 0.42 },
  { t: 40.98, arquivo: "pop", volume: 0.45 },
  { t: 41.75, arquivo: "whoosh_saida", volume: 0.3 },
  { t: 42.98, arquivo: "whoosh_curto", volume: 0.3 },
  { t: 44.02, arquivo: "impacto", volume: 0.36 },
  { t: 46.88, arquivo: "pop", volume: 0.55 },
  { t: 47.84, arquivo: "pop", volume: 0.55 },
  { t: 48.56, arquivo: "pop", volume: 0.55 },
  { t: 48.6, arquivo: "ding", volume: 0.42 },
];

// Páginas da legenda, por índice de palavra (definidas à mão para cada página ser uma ideia).
export const PAGINAS: [number, number][] = [
  [3, 5], [6, 8], [9, 11], [12, 13], [14, 16], [17, 18], [19, 21], [22, 22], [23, 25], [26, 27],
  [28, 31], [32, 35], [36, 38], [39, 40], [41, 43], [44, 46], [47, 48], [49, 50], [51, 52], [53, 54],
  [55, 57], [58, 60], [61, 64], [65, 67], [68, 69], [70, 72], [73, 75], [76, 77], [78, 79], [80, 82],
  [83, 85], [86, 88], [89, 89], [90, 93], [94, 96], [97, 99], [100, 102],
];

// Ícones que saltam ao lado da cabeça nos planos médios (lado e posição medidos pela cabeça).
export type Icone = { t0: number; t1: number; tipo: "pergunta" | "lampada" | "raio" | "alvo" | "halter" | "joinha"; x: number; y: number; tam: number };
export const ICONES: Icone[] = [
  { t0: 4.48, t1: 6.43, tipo: "pergunta", x: 250, y: 400, tam: 190 },
  { t0: 5.36, t1: 6.43, tipo: "lampada", x: 962, y: 430, tam: 160 },
  { t0: 6.48, t1: 7.93, tipo: "raio", x: 256, y: 420, tam: 180 },
  { t0: 27.99, t1: 30.27, tipo: "alvo", x: 193, y: 430, tam: 160 },
  { t0: 29.27, t1: 30.27, tipo: "halter", x: 972, y: 430, tam: 150 },
  { t0: 37.7, t1: 39.48, tipo: "halter", x: 916, y: 420, tam: 170 },
  { t0: 45.3, t1: 46.84, tipo: "joinha", x: 321, y: 420, tam: 200 },
];
