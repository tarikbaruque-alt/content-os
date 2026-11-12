import {Easing, interpolate} from 'remotion';
import edlCompleta from './data/edl.json';
import edlCurta from './data/edl_curta.json';
import faces from './data/faces.json';
import {clamp} from './theme';
import {VERSAO} from './versao';

// completa (~1 min 46 s) ou curta (~1 min 32 s: sem os takes 4, 11 e 19; take 9 começa em "Em 1926")
export const CURTA = VERSAO === 'curta';
const edl = CURTA ? edlCurta : edlCompleta;

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
export const VINHETA = 62;
export const TOTAL = SPEECH_END + VINHETA;

// Rosto centralizado em (540, 780) com ~700 px de largura (mesma régua do episódio do McDonald's).
const FACES = faces as unknown as Record<string, [number, number, number] | null>;
export const faceFix = (take: number) => {
  const [cx, cy, w] = FACES[String(take)] ?? [540, 780, 700];
  const s = Math.max(700 / w, 1.0);
  const x = Math.min(0, Math.max(1080 - 1080 * s, 540 - cx * s));
  const y = Math.min(0, Math.max(1920 - 1920 * s, 780 - cy * s));
  return {s, x, y};
};

// ---------- Seções: rosto, tela dividida (painel em cima) ou cena em tela cheia ----------
export type Mode = 'face' | 'split' | 'full';
export type Section = {name: string; from: number; to: number; mode: Mode; scene?: string; punch?: number; capY?: number};

export const SECTIONS: Section[] = [
  {name: 'Capa', from: 0, to: MK.chefes1 - 2, mode: 'full', scene: 'cover'},
  {name: 'Gancho · a estrela', from: MK.chefes1 - 2, to: MK.fabricante1 - 3, mode: 'split', scene: 'hookStar'},
  {name: 'Gancho · fabricante de pneus', from: MK.fabricante1 - 3, to: T(2), mode: 'split', scene: 'hookFactory'},
  {name: '1900 · a fábrica', from: T(2), to: CURTA ? T(5) : T(4), mode: 'full', scene: 'factory'},
  ...(CURTA ? [] : [{name: 'Como vender pneus?', from: T(4), to: T(5), mode: 'face' as Mode, punch: 1.06}]),
  {name: 'O guia gratuito e o mapa', from: T(5), to: T(6), mode: 'full', scene: 'guide'},
  {name: 'Segundo a Michelin', from: T(6), to: MK.encontrou6 - 2, mode: 'face'},
  {name: 'O guia na bancada', from: MK.encontrou6 - 2, to: T(7), mode: 'full', scene: 'calcoFull'},
  {name: 'Calço de móvel', from: T(7), to: T(8), mode: 'split', scene: 'calcoPanel'},
  {name: '1920 · o guia passa a ser vendido', from: T(8), to: T(9), mode: 'split', scene: 'evol1920'},
  {name: '1926 · as primeiras estrelas', from: T(9), to: T(10), mode: 'full', scene: 'stars1926'},
  {name: '1931 · a classificação', from: T(10), to: CURTA ? T(12) : T(11), mode: 'full', scene: 'scale1931'},
  ...(CURTA ? [] : [{name: '30 milhões', from: T(11), to: T(12), mode: 'split' as Mode, scene: 'counter30'}]),
  {name: 'Percebe a ironia? (chef com a placa MICHELIN)', from: T(12), to: MK.comecou12 - 2, mode: 'full', scene: 'today', capY: 300},
  {name: 'Mapa · até o restaurante', from: MK.comecou12 - 2, to: T(13), mode: 'split', scene: 'mapTrip'},
  {name: 'Chegando ao restaurante', from: T(13), to: MK.gastando14 - 1, mode: 'full', scene: 'arrival'},
  {name: 'Gastando pneu', from: MK.gastando14 - 1, to: T(15), mode: 'full', scene: 'tire'},
  {name: 'O verdadeiro marketing', from: T(15), to: T(17), mode: 'face', punch: 1.06},
  {name: 'Academia', from: T(17), to: MK.vez17 - 2, mode: 'face'},
  {name: 'Anúncio × conteúdo', from: MK.vez17 - 2, to: T(18), mode: 'split', scene: 'adCards'},
  {name: 'Calça jeans', from: T(18), to: CURTA ? T(20) : T(19), mode: 'face'},
  ...(CURTA ? [] : [{name: 'Despertar o desejo', from: T(19), to: T(20), mode: 'face' as Mode, punch: 1.08}]),
  {name: 'Não vendeu só pneus', from: T(20), to: MK.vendeu20 - 3, mode: 'face', punch: 1.04},
  {name: 'Pegar a estrada', from: MK.vendeu20 - 3, to: T(21), mode: 'full', scene: 'road'},
  {name: 'CTA e estrelas', from: T(21), to: SPEECH_END, mode: 'face'},
  {name: 'Vinheta Atrás do Rótulo', from: SPEECH_END, to: TOTAL, mode: 'full', scene: 'vinheta'},
];

export const sectionAt = (f: number) => SECTIONS.find((s) => f >= s.from && f < s.to) ?? SECTIONS[SECTIONS.length - 1];

// 0 = rosto em tela cheia, 1 = tela dividida (transição de 10 frames).
// Debaixo de uma cena em tela cheia o estado não muda; ao sair dela, o layout seguinte já está pronto
// (a própria cena faz a transição: recolhe para o painel ou some em fade).
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
