import edl from './data/edl.json';
import faces from './data/faces.json';

// Decupagem gerada por scripts/montar.py.
export type Seg = {take: number; src: number; srcEnd: number; from_: number};
export type Tok = {t: string; e: 'impact' | 'serif' | 'tension' | 'twist' | null};
export type Page = {take: number; start: number; end: number; toks: Tok[]};

export const SEGS = edl.segs as Seg[];
export const PAGES = edl.pages as Page[];
export const MK = edl.marks as unknown as Record<string, number> & {take: Record<string, number>; takeEnd: Record<string, number>};
export const T = (n: number) => MK.take[String(n)];
export const TE = (n: number) => MK.takeEnd[String(n)];
export const SPEECH_END: number = edl.total;
export const END_DUR = 72;
export const TOTAL = SPEECH_END + END_DUR;

// Rosto centralizado em (540, 900) e com a mesma largura (~650 px) em todos os takes.
const FACES = faces as unknown as Record<string, [number, number, number] | null>;
export const faceFix = (take: number) => {
  const [cx, cy, w] = FACES[String(take)] ?? [540, 900, 650];
  // escala mínima de 1,08 para sempre cobrir o quadro; o deslocamento é limitado para não sobrar borda
  const s = Math.max(650 / w, 1.08);
  const x = Math.min(0, Math.max(1080 - 1080 * s, 540 - cx * s));
  const y = Math.min(0, Math.max(1920 - 1920 * s, 900 - cy * s));
  return {s, x, y};
};

// Aproximações do rosto por trecho (frame inicial → escala)
export const punchAt = (f: number) => {
  if (f >= T(15) && f < SPEECH_END) return f >= MK.vao15 - 2 ? 1.16 : 1.08;
  if (f >= MK.doer9 - 3 && f < T(10)) return 1.14;
  if (f >= T(2) && f < T(3)) return 1.12;
  if (f >= T(12) && f < MK.naosou12) return 1.0;
  if (f >= MK.naosou12 && f < T(13)) return 1.07;
  if (f >= T(14) && f < T(15)) return 1.04;
  return 1.0;
};

// "Modo assessor": do "faz de conta" até o plot twist
export const assessorMode = (f: number) => f >= T(7) && f < T(12);

// Tela dividida nos bastidores (take 13): o rosto desce para a metade de baixo
export const splitY = (f: number) => {
  const a = T(13);
  const b = T(14);
  if (f < a - 4 || f > b + 4) return 0;
  const inP = Math.min(1, Math.max(0, (f - (a - 4)) / 10));
  const outP = Math.min(1, Math.max(0, (b + 4 - f) / 8));
  const e = (x: number) => 1 - Math.pow(1 - x, 3);
  return 470 * Math.min(e(inP), e(outP));
};
