import {Easing, interpolate} from 'remotion';
import edl from './data/edl.json';
import faces from './data/faces.json';
import {clamp} from './theme';

// Decupagem gerada por scripts/montar.py.
export type Seg = {take: number; src: number; srcEnd: number; from_: number};
export type Tok = {t: string; e: 'serif' | 'gold' | 'under' | 'red' | null};
export type Page = {take: number; start: number; end: number; toks: Tok[]; hide: boolean};

export const SEGS = edl.segs as Seg[];
export const PAGES = edl.pages as Page[];
export const MK = edl.marks as unknown as Record<string, number> & {take: Record<string, number>; takeEnd: Record<string, number>};
export const T = (n: number) => MK.take[String(n)];
export const TE = (n: number) => MK.takeEnd[String(n)];
export const SPEECH_END: number = edl.total;
export const END_DUR = 45;
export const TOTAL = SPEECH_END + END_DUR;

// Rosto centralizado em (540, 760) com ~600 px de largura.
const FACES = faces as unknown as Record<string, [number, number, number] | null>;
export const faceFix = (take: number) => {
  const [cx, cy, w] = FACES[String(take)] ?? [600, 740, 520];
  const s = Math.max(600 / w, 1.0);
  const x = Math.min(0, Math.max(1080 - 1080 * s, 540 - cx * s));
  const y = Math.min(0, Math.max(1920 - 1920 * s, 760 - cy * s));
  return {s, x, y};
};

export type Mode = 'face' | 'split' | 'full';
export type Section = {name: string; from: number; to: number; mode: Mode; scene?: string; punch?: number; capY?: number};

export const SECTIONS: Section[] = [
  {name: 'Gancho · a caneta', from: 0, to: MK.aposto1 - 2, mode: 'split', scene: 'hookPen'},
  {name: 'Aposto que ninguém te contou', from: MK.aposto1 - 2, to: MK.para1 - 6, mode: 'face'},
  {name: 'A pergunta (zoom)', from: MK.para1 - 6, to: T(2), mode: 'face', punch: 1.12},
  {name: 'Fica até o final', from: T(2), to: MK.famosa2 - 3, mode: 'face'},
  {name: 'A famosa canetinha', from: MK.famosa2 - 3, to: T(3), mode: 'split', scene: 'penScale'},
  {name: 'Como funciona: GLP-1 e GIP', from: T(3), to: MK.voce3 - 2, mode: 'full', scene: 'hormones'},
  {name: 'Menos fome, menos peso', from: MK.voce3 - 2, to: MK.parece3 - 2, mode: 'split', scene: 'meters'},
  {name: 'Parece perfeito?', from: MK.parece3 - 2, to: MK.calma3 - 3, mode: 'face'},
  {name: 'Mas calma', from: MK.calma3 - 3, to: MK.voce3b - 2, mode: 'face', punch: 1.08},
  {name: 'Pouca proteína', from: MK.voce3b - 2, to: MK.sem3 - 2, mode: 'split', scene: 'protein'},
  {name: 'Sem treino de força', from: MK.sem3 - 2, to: MK.gordura3 - 4, mode: 'split', scene: 'training'},
  {name: 'Gordura e massa muscular', from: MK.gordura3 - 4, to: MK.ah3 - 2, mode: 'split', scene: 'muscleLoss'},
  {name: 'O número na balança', from: MK.ah3 - 2, to: MK.nao3c - 2, mode: 'split', scene: 'scale'},
  {name: 'Não é bem assim', from: MK.nao3c - 2, to: T(4), mode: 'face', punch: 1.1},
  {name: 'Analogia do motor', from: T(4), to: MK.quando4 - 2, mode: 'full', scene: 'engine'},
  {name: 'Motor menor', from: MK.quando4 - 2, to: MK.reduzir4 - 2, mode: 'split', scene: 'engineSmall'},
  {name: 'O músculo', from: MK.reduzir4 - 2, to: T(5), mode: 'split', scene: 'muscle'},
  {name: 'Emagrecer ≠ perder peso', from: T(5), to: MK.proteina5 - 2, mode: 'face'},
  {name: 'Proteína → músculo', from: MK.proteina5 - 2, to: MK.maior5 - 2, mode: 'split', scene: 'aminos'},
  {name: 'Quando você para', from: MK.maior5 - 2, to: MK.justamente5 - 2, mode: 'full', scene: 'regain'},
  {name: 'Parte 2', from: MK.justamente5 - 2, to: MK.gostou5 - 2, mode: 'face'},
  {name: 'CTA', from: MK.gostou5 - 2, to: SPEECH_END, mode: 'face'},
  {name: 'Fim · parte 2 em breve', from: SPEECH_END, to: TOTAL, mode: 'full', scene: 'end'},
];

export const sectionAt = (f: number) => SECTIONS.find((s) => f >= s.from && f < s.to) ?? SECTIONS[SECTIONS.length - 1];

// aproximação suave do rosto (sem pulo) quando a seção pede "punch"
export const punchAt = (f: number) => {
  const s = sectionAt(f);
  const i = SECTIONS.indexOf(s);
  const prev = i > 0 && SECTIONS[i - 1].mode === 'face' ? SECTIONS[i - 1].punch ?? 1 : 1;
  const cur = s.punch ?? 1;
  return prev + (cur - prev) * interpolate(f, [s.from, s.from + 10], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
};

const TR = 10;
export const EXIT = 8;
export const splitProgress = (f: number) => {
  const val = (s: Section) => (s.mode === 'split' ? 1 : 0);
  let v = SECTIONS[0].mode === 'split' ? 1 : 0;
  for (let i = 1; i < SECTIONS.length; i++) {
    const s = SECTIONS[i];
    if (s.mode === 'full') continue;
    const prev = SECTIONS[i - 1];
    const t = s.from;
    const b = val(s);
    if (prev.mode === 'full') {
      if (f >= t - EXIT) v = b;
    } else {
      const a = val(prev);
      if (a !== b && f >= t - 3) v = interpolate(f, [t - 3, t - 3 + TR], [a, b], {...clamp, easing: Easing.inOut(Easing.cubic)});
      else if (f >= t) v = b;
    }
  }
  return v;
};

export const neighbors = (s: Section) => {
  const i = SECTIONS.indexOf(s);
  return {prev: i > 0 ? SECTIONS[i - 1] : null, next: i < SECTIONS.length - 1 ? SECTIONS[i + 1] : null};
};
