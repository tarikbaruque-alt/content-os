import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

for (const w of ['500', '600', '700', '800', '900']) {
  loadFont({family: 'Montserrat', url: staticFile(`fonts/montserrat-latin-${w}-normal.woff2`), weight: w});
}
loadFont({family: 'Instrument Serif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'});
loadFont({family: 'Instrument Serif', url: staticFile('fonts/instrument-serif-latin-400-normal.woff2'), weight: '400', style: 'normal'});

// Identidade "Atrás do Rótulo": grafite, branco quente e dourado. Vermelho do guia como acento.
export const C = {
  bg: '#0B0B0D',
  panel: '#121216',
  white: '#F6F4EF',
  gray: '#9C9CA3',
  gold: '#F2C14E',
  goldDeep: '#C9952A',
  red: '#C8312B',
  paper: '#EADFC6',
  paperDark: '#D8C8A6',
  ink: '#3B2F22',
  inkSoft: 'rgba(59,47,34,0.55)',
} as const;

export const SANS = 'Montserrat, sans-serif';
export const SERIF = 'Instrument Serif, serif';
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const SHADOW = '0 4px 18px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.5)';
export const SHADOW_BIG = '0 8px 34px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.6)';

// Tela dividida: painel de cima vai até SPLIT_Y; o rosto desce SPLIT_OFFSET.
export const SPLIT_Y = 860;
export const SPLIT_OFFSET = 620;
