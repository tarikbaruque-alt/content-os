import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

for (const w of ['500', '600', '700', '800', '900']) {
  loadFont({family: 'Montserrat', url: staticFile(`fonts/montserrat-latin-${w}-normal.woff2`), weight: w});
}
loadFont({family: 'Instrument Serif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'});

// Identidade: editorial escuro, branco nas legendas, destaques em azul e roxo (paleta da Meta).
// (no código compartilhado, "gold" = destaque principal — aqui, azul Meta; "red" = rosa para o que é problema)
export const C = {
  bg: '#060A15',
  panel: '#070C1A',
  navy: '#0B1430',
  white: '#FFFFFF',
  gray: '#A6B0C6',
  gold: '#4C9BFF',
  goldDeep: '#0064E0',
  purple: '#A887FF',
  purpleDeep: '#6B3FE0',
  red: '#FF5C8A',
  ink: '#0B1220',
  inkSoft: 'rgba(11,18,32,0.55)',
  paper: '#FFFFFF',
  line: 'rgba(255,255,255,0.12)',
} as const;

export const GRAD = `linear-gradient(100deg, ${C.goldDeep} 0%, #2E8BFF 45%, ${C.purple} 100%)`;

export const SANS = 'Montserrat, sans-serif';
export const SERIF = 'Instrument Serif, serif';
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const SHADOW = '0 4px 18px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.5)';
export const SHADOW_BIG = '0 8px 34px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.6)';

// Tela dividida sem divisória: o painel de cima vai até PANEL_H e se dissolve (desfoque) sobre o vídeo.
export const SPLIT_Y = 900;
export const PANEL_H = 1010;
export const SPLIT_OFFSET = 540;
