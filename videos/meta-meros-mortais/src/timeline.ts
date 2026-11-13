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
export const END_DUR = 12; // corte limpo, sem vinheta
export const TOTAL = SPEECH_END + END_DUR;

// Rosto: os takes já vêm bem enquadrados; só corrige se o rosto estiver pequeno.
const FACES = faces as unknown as Record<string, [number, number, number] | null>;
export const faceFix = (take: number) => {
  const [cx, cy, w] = FACES[String(take)] ?? [550, 910, 640];
  const s = Math.max(600 / w, 1.0);
  const x = Math.min(0, Math.max(1080 - 1080 * s, 540 - cx * s));
  const y = Math.min(0, Math.max(1920 - 1920 * s, 900 - cy * s));
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
  dry?: boolean; // corte seco (sem transição / zoom instantâneo)
  slow?: number; // zoom lento (quadros)
  capY?: number;
};

export const SECTIONS: Section[] = [
  {name: 'Gancho', from: 0, to: MK.mero1 - 2, mode: 'face'},
  {name: 'Mero mortal (zoom)', from: MK.mero1 - 2, to: MK.meta1 - 4, mode: 'face', punch: 1.07},
  {name: 'A Meta deu esperança', from: MK.meta1 - 4, to: T(2), mode: 'split', scene: 'headline'},
  {name: 'Comunicado oficial', from: T(2), to: T(3), mode: 'full', scene: 'article', capY: 1610},
  {name: 'Seguidores ≠ alcance', from: T(3), to: T(4), mode: 'split', scene: 'compare'},
  {name: 'Repara na ironia', from: T(4), to: T(5), mode: 'face', punch: 1.1},
  {name: 'A ironia do contador', from: T(5), to: T(6), mode: 'split', scene: 'ironia'},
  {name: 'O que importa (comunicado)', from: T(6), to: T(7), mode: 'split', scene: 'sinais'},
  {name: 'Sinais e alcance', from: T(7), to: T(9), mode: 'split', scene: 'reel'},
  {name: 'Fazendo uma analogia', from: T(9), to: MK.seguidor9 - 3, mode: 'face'},
  {name: 'Convidados × festa', from: MK.seguidor9 - 3, to: T(10), mode: 'split', scene: 'festa'},
  {name: 'Os deuses do Instagram', from: T(10), to: T(11), mode: 'full', scene: 'deuses', capY: 1640},
  {name: 'Segundo a Meta', from: T(11), to: T(12), mode: 'full', scene: 'porisso', capY: 1640},
  {name: 'Feed', from: T(12), to: MK.um13 + 14, mode: 'split', scene: 'feed'},
  {name: 'Mero mortal (zoom seco)', from: MK.um13 + 14, to: T(14), mode: 'face', punch: 1.12, dry: true},
  {name: 'Boa notícia', from: T(14), to: T(15), mode: 'face'},
  {name: 'Sejamos claros', from: T(15), to: T(16), mode: 'split', scene: 'sejamos'},
  {name: 'Conta pequena ≠ fraca', from: T(16), to: T(17), mode: 'face'},
  {name: 'Cada postagem', from: T(17), to: T(18), mode: 'split', scene: 'compartilhar'},
  {name: 'Ô Meta', from: T(18), to: T(19), mode: 'face', punch: 1.06, slow: 40},
  {name: 'DM com a Meta', from: T(19), to: MK.e21 - 2, mode: 'split', scene: 'dm'},
  {name: 'Visualizou', from: MK.e21 - 2, to: T(22), mode: 'face', punch: 1.05},
  {name: 'Contar com vocês', from: T(22), to: T(23), mode: 'face'},
  {name: 'Manda pro amigo', from: T(23), to: T(24), mode: 'face'},
  {name: 'Me segue', from: T(24), to: TOTAL, mode: 'face'},
];

export const sectionAt = (f: number) => SECTIONS.find((s) => f >= s.from && f < s.to) ?? SECTIONS[SECTIONS.length - 1];

// aproximação suave do rosto quando a seção pede "punch" (ou instantânea, se "dry")
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
