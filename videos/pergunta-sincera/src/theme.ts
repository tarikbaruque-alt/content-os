import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

for (const w of ['500', '600', '700', '800', '900']) {
  loadFont({family: 'Montserrat', url: staticFile(`fonts/montserrat-latin-${w}-normal.woff2`), weight: w});
}
loadFont({family: 'Instrument Serif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'});
loadFont({family: 'Anton', url: staticFile('fonts/anton-latin-400-normal.woff2'), weight: '400'});

// Identidade: fundo quase preto, legenda branca limpa, amarelo para o que é dito com ênfase,
// azul claro na serifada (segunda voz tipográfica) e coral para dores/objeções.
// (no código compartilhado, "gold" = destaque principal — aqui, amarelo)
export const C = {
  bg: '#070A12',
  panel: '#080C16',
  white: '#FFFFFF',
  gray: '#A9B2C3',
  gold: '#FFC83D',
  goldDeep: '#F59E0B',
  purple: '#A8DFFF', // cor da palavra serifada
  cyan: '#5AC8FF',
  green: '#3DDC97',
  red: '#FF6B6B',
  ink: '#0B1220',
  line: 'rgba(255,255,255,0.12)',
} as const;

export const GRAD = `linear-gradient(100deg, #FFDF6B 0%, ${C.gold} 55%, #FFB02E 100%)`;

export const SANS = 'Montserrat, sans-serif';
export const SERIF = 'Instrument Serif, serif';
export const COND = 'Anton, sans-serif';
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const SHADOW = '0 4px 18px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.55)';
export const SHADOW_BIG = '0 8px 34px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.6)';

// Tela dividida sem linha: o painel de cima vai até PANEL_H e esmaece (com desfoque) sobre o vídeo.
export const SPLIT_Y = 900;
export const PANEL_H = 1010;
export const SPLIT_OFFSET = 590;
