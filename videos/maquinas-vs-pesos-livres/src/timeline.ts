import edl from './data/edl.json';
import faces from './data/faces.json';

// Decupagem gerada por scripts/montar.py (trechos = frases escolhidas, na ordem do vídeo).
export type Seg = {take: number; file: string; src: number; srcEnd: number; from_: number};
export type Tok = {t: string; e: 'key' | 'strong' | null};
export type Page = {take: number; start: number; end: number; toks: Tok[]; pos: string | null};

export const SEGS = edl.segs as Seg[];
export const PAGES = edl.pages as Page[];
export const MK = edl.marks as unknown as Record<string, number> & {take: Record<string, number>; takeEnd: Record<string, number>};
export const T = (n: number) => MK.take[String(n)];
export const TE = (n: number) => MK.takeEnd[String(n)];
export const SPEECH_END: number = edl.total;
export const END_DUR = 62; // fechamento em motion (~2 s) e corte limpo
export const TOTAL = SPEECH_END + END_DUR;

// Enquadramento: rosto centralizado (540, 640), com ~340 px de largura em todos os takes.
const FACES = faces as unknown as Record<string, [number, number, number] | null>;
export const faceFix = (file: string) => {
  const [cx, cy, w] = FACES[file] ?? [560, 730, 300];
  const s = Math.max(340 / w, 1.1);
  const x = Math.min(0, Math.max(1080 - 1080 * s, 540 - cx * s));
  const y = Math.min(0, Math.max(1920 - 1920 * s, 640 - cy * s));
  return {s, x, y};
};

// Ajustes de enquadramento em frases-chave (aproximação suave do rosto)
export const punchAt = (f: number) => {
  if (f >= MK.estimulos2 - 2 && f < T(3)) return 1.08;
  if (f >= MK.seguranca8 - 2 && f < T(9)) return 1.12;
  if (f >= T(8) && f < T(9)) return 1.05;
  if (f >= MK.completo12 - 2 && f < MK.coloque12) return 1.08;
  if (f >= MK.gostou12 - 2) return 1.05;
  return 1.0;
};

// Tela dividida no "coloque um para pesos livres e o outro para máquinas": rosto desce para a metade de baixo
export const DUO_A = MK.coloque12 - 3;
export const DUO_B = MK.assim12 - 2;
export const duoP = (f: number) => {
  if (f < DUO_A - 1 || f > DUO_B + 9) return 0;
  const e = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  return Math.min(e((f - DUO_A) / 9), e((DUO_B + 9 - f) / 8));
};
export const DUO_Y = 600;
