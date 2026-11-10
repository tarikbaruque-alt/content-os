import edlLonga from './data/edl.json';
import edlCurta from './data/edl_curta.json';
import faces from './data/faces.json';
import imagens from './data/imagens.json';
import {VERSAO} from './versao';
import {Easing, interpolate} from 'remotion';
import {clamp} from './theme';

// Decupagem gerada por scripts/montar.py (versão longa) ou scripts/montar_curto.py (versão curta, ~89 s).
const edl = VERSAO === 'curta' ? edlCurta : edlLonga;
export const CURTA = VERSAO === 'curta';
// Fotos da F1 (opcionais): quando existirem em public/img, ligue em src/data/imagens.json.
export const IMG = imagens as {curva: boolean; logos: boolean};
export type Seg = {take: number; src: number; srcEnd: number; from_: number};
export type Tok = {t: string; e: 'serif' | 'gold' | 'under' | null};
export type Page = {take: number; start: number; end: number; toks: Tok[]};

export const SEGS = edl.segs as Seg[];
export const PAGES = edl.pages as Page[];
export const MK = edl.marks as unknown as Record<string, number> & {take: Record<string, number>};
export const T = (n: number) => MK.take[String(n)];
export const SPEECH_END: number = edl.total;
export const END_DUR = CURTA ? 39 : 45;
export const TOTAL = SPEECH_END + END_DUR;

// Enquadramento por take: rosto centralizado em (540, 780) e com a mesma largura (~700 px).
const FACES = faces as unknown as Record<string, [number, number, number]>;
export const faceFix = (take: number) => {
  const [cx, cy, w] = FACES[String(take)] ?? [540, 780, 700];
  const s = 700 / w;
  return {s, x: 540 - cx * s, y: 780 - cy * s};
};

export type GfxName = 'cloud' | 'dict' | 'curvas' | 'timer' | 'espectador' | 'steps' | 'triad' | 'results' | 'lesson';
export type Top = {kind: 'case'; at: number; rate?: number} | {kind: 'gfx'; name: GfxName} | {kind: 'img'; src: string; aspect: number; focusX: number; focusY: number; zoomTo?: number};
export type Mode = 'face' | 'split' | 'full' | 'end';
export type Section = {name: string; from: number; to: number; mode: Mode; top?: Top; punch?: number};

// Fotos da F1: Ferrari na curva (abertura) e Ferrari 44 cheia de patrocinadores ("mais uma logo na pista").
const FOTO_CURVA = {kind: 'img' as const, src: 'img/f1-curva.jpg', aspect: 2, focusX: 0.62, focusY: 0.56, zoomTo: 1.12};
const FOTO_LOGOS = {kind: 'img' as const, src: 'img/f1-logos.jpg', aspect: 1870 / 1080, focusX: 0.6, focusY: 0.72, zoomTo: 1.25};

// Imagens do case (segundos do vídeo do case): 3 s capacete com o M · 6 s largada · 15 s satélite dos circuitos
// 24 s arcos desenhados · 30 s logo + Golden Zone · 34 s mais arcos · 40 s grade dos 24 arcos · 44 s Golden Zone na corrida · 47 s app
const SECTIONS_LONGA = (): Section[] => [
  ...(IMG.curva
    ? [
        {name: 'Gancho · o McDonald\'s viu dinheiro', from: T(1), to: MK.onde1, mode: 'split' as Mode, top: {kind: 'case' as const, at: 30}},
        {name: 'Gancho · onde todo mundo via curvas', from: MK.onde1, to: T(2), mode: 'split' as Mode, top: FOTO_CURVA},
      ]
    : [{name: 'Gancho · dinheiro nas curvas', from: T(1), to: T(2), mode: 'split' as Mode, top: {kind: 'case' as const, at: 30}}]),
  {name: 'Sacada genial', from: T(2), to: T(3), mode: 'face', punch: 1.1},
  {name: 'Já patrocinava', from: T(3), to: T(4), mode: 'split', top: {kind: 'case', at: 3}},
  ...(IMG.logos
    ? [
        {name: 'Mais uma logo na pista', from: T(4), to: MK.oportunidade, mode: 'split' as Mode, top: FOTO_LOGOS},
        {name: 'Oportunidade que ninguém via', from: MK.oportunidade, to: T(5), mode: 'split' as Mode, top: {kind: 'case' as const, at: 9.5}},
      ]
    : [{name: 'Mais uma logo na pista', from: T(4), to: T(5), mode: 'split' as Mode, top: {kind: 'case' as const, at: 6}}]),
  {name: '24 circuitos', from: T(5), to: T(6), mode: 'full', top: {kind: 'case', at: 15}},
  {name: 'Arcos dourados', from: T(6), to: T(7), mode: 'full', top: {kind: 'case', at: 24}},
  {name: 'Cérebro e padrões', from: T(7), to: T(8), mode: 'face'},
  {name: 'Nuvem com rosto', from: T(8), to: T(9), mode: 'split', top: {kind: 'gfx', name: 'cloud'}},
  {name: 'Pareidolia', from: T(9), to: MK.transformou10, mode: 'split', top: {kind: 'gfx', name: 'dict'}},
  {name: 'Percepção vira estratégia', from: MK.transformou10, to: T(11), mode: 'split', top: {kind: 'case', at: 40}},
  {name: 'O M nas curvas', from: T(11), to: MK.otQue11, mode: 'split', top: {kind: 'case', at: 34}},
  {name: 'Curvas em vendas', from: MK.otQue11, to: T(13), mode: 'split', top: {kind: 'gfx', name: 'curvas'}},
  {name: 'Golden Zone', from: T(13), to: MK.oferta13, mode: 'split', top: {kind: 'case', at: 44, rate: 0.75}},
  {name: 'Oferta no app', from: MK.oferta13, to: T(14), mode: 'split', top: {kind: 'case', at: 47}},
  {name: 'Oferta dura a curva', from: T(14), to: T(16), mode: 'split', top: {kind: 'gfx', name: 'timer'}},
  {name: 'Espectador → participante', from: T(16), to: T(17), mode: 'split', top: {kind: 'gfx', name: 'espectador'}},
  {name: '3 ações', from: T(17), to: T(18), mode: 'split', top: {kind: 'gfx', name: 'steps'}},
  {name: 'Atenção, urgência, recompensa', from: T(18), to: T(19), mode: 'split', top: {kind: 'gfx', name: 'triad'}},
  {name: 'Resultados', from: T(19), to: T(20), mode: 'split', top: {kind: 'gfx', name: 'results'}},
  {name: 'Qual é a lição?', from: T(20), to: MK.marketing20, mode: 'face', punch: 1.08},
  {name: 'A lição', from: MK.marketing20, to: T(21), mode: 'split', top: {kind: 'gfx', name: 'lesson'}},
  {name: 'CTA', from: T(21), to: SPEECH_END, mode: 'face'},
  {name: 'Fim', from: SPEECH_END, to: TOTAL, mode: 'end'},
];
// Versão curta: sem o take 2; o take 20 já começa na lição. Com as fotos, a abertura alterna marca × curva
// e o "mais uma logo na pista" usa a Ferrari cheia de patrocinadores.
const SECTIONS_CURTA = (): Section[] => [
  ...(IMG.curva
    ? [
        {name: 'Gancho · o McDonald\'s viu dinheiro', from: T(1), to: MK.onde1, mode: 'split' as Mode, top: {kind: 'case' as const, at: 30}},
        {name: 'Gancho · onde todo mundo via curvas', from: MK.onde1, to: T(3), mode: 'split' as Mode, top: FOTO_CURVA},
      ]
    : [{name: 'Gancho · dinheiro nas curvas', from: T(1), to: T(3), mode: 'split' as Mode, top: {kind: 'case' as const, at: 30}}]),
  {name: 'Já patrocinava', from: T(3), to: T(4), mode: 'split', top: {kind: 'case', at: 3}},
  ...(IMG.logos
    ? [
        {name: 'Mais uma logo na pista', from: T(4), to: MK.oportunidade, mode: 'split' as Mode, top: FOTO_LOGOS},
        {name: 'Oportunidade que ninguém via', from: MK.oportunidade, to: T(5), mode: 'split' as Mode, top: {kind: 'case' as const, at: 9.5}},
      ]
    : [{name: 'Mais uma logo na pista', from: T(4), to: T(5), mode: 'split' as Mode, top: {kind: 'case' as const, at: 6}}]),
  {name: '24 circuitos', from: T(5), to: T(6), mode: 'full', top: {kind: 'case', at: 15}},
  {name: 'Arcos dourados', from: T(6), to: T(7), mode: 'full', top: {kind: 'case', at: 24}},
  {name: 'Cérebro e padrões', from: T(7), to: T(8), mode: 'face', punch: 1.06},
  {name: 'Nuvem com rosto', from: T(8), to: T(9), mode: 'split', top: {kind: 'gfx', name: 'cloud'}},
  {name: 'Pareidolia', from: T(9), to: MK.transformou10, mode: 'split', top: {kind: 'gfx', name: 'dict'}},
  {name: 'Percepção vira estratégia', from: MK.transformou10, to: T(11), mode: 'split', top: {kind: 'case', at: 40}},
  {name: 'O M nas curvas', from: T(11), to: MK.otQue11, mode: 'split', top: {kind: 'case', at: 34}},
  {name: 'Curvas em vendas', from: MK.otQue11, to: T(13), mode: 'split', top: {kind: 'gfx', name: 'curvas'}},
  {name: 'Golden Zone', from: T(13), to: MK.oferta13, mode: 'split', top: {kind: 'case', at: 44, rate: 0.75}},
  {name: 'Oferta no app', from: MK.oferta13, to: T(14), mode: 'split', top: {kind: 'case', at: 47}},
  {name: 'Oferta dura a curva', from: T(14), to: T(16), mode: 'split', top: {kind: 'gfx', name: 'timer'}},
  {name: 'Espectador → participante', from: T(16), to: T(17), mode: 'split', top: {kind: 'gfx', name: 'espectador'}},
  {name: '3 ações', from: T(17), to: T(18), mode: 'split', top: {kind: 'gfx', name: 'steps'}},
  {name: 'Atenção, urgência, recompensa', from: T(18), to: T(19), mode: 'split', top: {kind: 'gfx', name: 'triad'}},
  {name: 'Resultados', from: T(19), to: T(20), mode: 'split', top: {kind: 'gfx', name: 'results'}},
  {name: 'A lição', from: T(20), to: T(21), mode: 'split', top: {kind: 'gfx', name: 'lesson'}},
  {name: 'CTA', from: T(21), to: SPEECH_END, mode: 'face'},
  {name: 'Fim', from: SPEECH_END, to: TOTAL, mode: 'end'},
];

export const SECTIONS: Section[] = CURTA ? SECTIONS_CURTA() : SECTIONS_LONGA();
// Segundo take da edição (o selo de abertura sai quando ele começa).
export const SECOND_TAKE_FROM = SECTIONS.find((x) => x.from > 0 && !x.name.startsWith('Gancho'))!.from;


export const sectionAt = (f: number) => SECTIONS.find((s) => f >= s.from && f < s.to) ?? SECTIONS[SECTIONS.length - 1];

// Progresso da tela dividida (0 = rosto em tela cheia, 1 = dividida), com transição suave de 10 frames.
const TR = 10;
export const splitProgress = (f: number) => {
  let v = SECTIONS[0].mode === 'split' ? 1 : 0;
  for (let i = 1; i < SECTIONS.length; i++) {
    const a = SECTIONS[i - 1].mode === 'split' ? 1 : 0;
    const b = SECTIONS[i].mode === 'split' ? 1 : 0;
    const t = SECTIONS[i].from;
    if (a !== b && f >= t - 3) v = interpolate(f, [t - 3, t - 3 + TR], [a, b], {...clamp, easing: Easing.inOut(Easing.cubic)});
    else if (f >= t) v = b;
  }
  return v;
};

// Frames em que o modo muda (para o "whoosh").
export const MODE_CHANGES = SECTIONS.filter((s, i) => i > 0 && s.mode !== SECTIONS[i - 1].mode).map((s) => s.from);
