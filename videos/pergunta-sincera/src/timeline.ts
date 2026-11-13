import {Easing, interpolate} from 'remotion';
import edl from './data/edl.json';
import faces from './data/faces.json';
import {clamp} from './theme';

// Decupagem gerada por scripts/montar.py.
export type Seg = {take: number; src: number; srcEnd: number; from_: number; z: number};
export type Tok = {t: string; e: 'serif' | 'gold' | 'under' | 'red' | null};
export type Page = {take: number; start: number; end: number; toks: Tok[]; hide: boolean};

export const SEGS = edl.segs as Seg[];
export const PAGES = edl.pages as Page[];
export const MK = edl.marks as unknown as Record<string, number> & {take: Record<string, number>; takeEnd: Record<string, number>};
export const SPEECH_END: number = edl.total;
export const END_DUR = 16; // segura o convite final por meio segundo
export const TOTAL = SPEECH_END + END_DUR;

// O take já vem bem enquadrado; só corrige se o rosto estiver pequeno.
const FACES = faces as unknown as Record<string, [number, number, number] | null>;
export const faceFix = (take: number) => {
  const [cx, cy, w] = FACES[String(take)] ?? [560, 790, 680];
  const s = Math.max(600 / w, 1.0);
  const x = Math.min(0, Math.max(1080 - 1080 * s, 540 - cx * s));
  const y = Math.min(0, Math.max(1920 - 1920 * s, 790 - cy * s));
  return {s, x, y};
};

export type Mode = 'face' | 'split' | 'full';
export type Section = {
  name: string;
  from: number;
  to: number;
  mode: Mode;
  scene?: string;
  punch?: number;
  dry?: boolean;
  slow?: number;
  capY?: number;
  step?: number; // degrau da "escada do digital" (1 a 5)
};

export const SECTIONS: Section[] = [
  {name: 'Gancho · pergunta sincera', from: 0, to: MK.i_voces - 2, mode: 'face'},
  {name: 'Jornada no digital', from: MK.i_voces - 2, to: MK.i_porque0 - 1, mode: 'split', scene: 'jornada'},
  {name: 'Por que estou questionando', from: MK.i_porque0 - 1, to: MK.i_porque, mode: 'face', punch: 1.08},
  {name: 'Porque, olha…', from: MK.i_porque, to: MK.quem - 2, mode: 'face'},
  {name: 'Dinheiro fora', from: MK.quem - 2, to: MK.i_sentido - 1, mode: 'split', scene: 'dinheiro'},
  {name: 'No sentido de…', from: MK.i_sentido - 1, to: MK.mesmo - 3, mode: 'face'},
  {name: 'Mesmo sem produto', from: MK.mesmo - 3, to: MK.i_fato - 1, mode: 'split', scene: 'produtos'},
  {name: 'Se expor → seguidores', from: MK.i_fato - 1, to: MK.consegue - 8, mode: 'split', scene: 'seguidores', step: 1},
  {name: 'Portas que se abrem', from: MK.consegue - 8, to: MK.i_ate - 1, mode: 'split', scene: 'portas', step: 1},
  {name: 'Mostrar o trabalho pro mundo', from: MK.i_ate - 1, to: MK.i_pessoas - 1, mode: 'split', scene: 'vitrine', step: 1},
  {name: 'Qualidade, autoridade, expert', from: MK.i_pessoas - 1, to: MK.i_partir - 1, mode: 'split', scene: 'autoridade', step: 2},
  {name: 'Confiança', from: MK.i_partir - 1, to: MK.i_partir2 - 1, mode: 'split', scene: 'confianca', step: 3},
  {name: 'Clientes e cases', from: MK.i_partir2 - 1, to: MK.i_eai - 1, mode: 'split', scene: 'clientes', step: 4},
  {name: 'Escalar o negócio', from: MK.i_eai - 1, to: MK.i_volta - 2, mode: 'full', scene: 'escada', capY: 1650, step: 5},
  {name: 'A pergunta volta', from: MK.i_volta - 2, to: MK.i_voces2 - 2, mode: 'face', punch: 1.06},
  {name: 'As objeções', from: MK.i_voces2 - 2, to: MK.i_mediga - 2, mode: 'split', scene: 'objecoes'},
  {name: 'Me diga', from: MK.i_mediga - 2, to: TOTAL, mode: 'face', punch: 1.05},
];

export const sectionAt = (f: number) => SECTIONS.find((s) => f >= s.from && f < s.to) ?? SECTIONS[SECTIONS.length - 1];

// aproximação suave do rosto quando a seção pede "punch"
export const punchAt = (f: number) => {
  const s = sectionAt(f);
  const i = SECTIONS.indexOf(s);
  const prev = i > 0 && SECTIONS[i - 1].mode === 'face' ? SECTIONS[i - 1].punch ?? 1 : 1;
  const cur = s.punch ?? 1;
  if (s.dry) return cur;
  const len = s.slow ?? 10;
  return prev + (cur - prev) * interpolate(f, [s.from, s.from + len], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
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
      if (s.dry) {
        if (f >= t) v = b;
      } else if (a !== b && f >= t - 3) v = interpolate(f, [t - 3, t - 3 + TR], [a, b], {...clamp, easing: Easing.inOut(Easing.cubic)});
      else if (f >= t) v = b;
    }
  }
  return v;
};

export const neighbors = (s: Section) => {
  const i = SECTIONS.indexOf(s);
  return {prev: i > 0 ? SECTIONS[i - 1] : null, next: i < SECTIONS.length - 1 ? SECTIONS[i + 1] : null};
};
