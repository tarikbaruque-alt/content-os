import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

for (const w of ['500', '600', '700', '800', '900']) {
  loadFont({family: 'Montserrat', url: staticFile(`fonts/montserrat-latin-${w}-normal.woff2`), weight: w});
}
loadFont({family: 'Instrument Serif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'});

// Identidade do João: verde como cor principal, branco nas legendas, fundo escuro para contraste.
// (no código compartilhado, "gold" = cor de destaque — aqui, verde)
export const C = {
  bg: '#0A0E0C',
  panel: '#0D1310',
  white: '#FFFFFF',
  gray: '#A3ADA7',
  gold: '#3FE07D',
  goldDeep: '#18A957',
  red: '#F2B33D',
  greenDark: '#0F2A1B',
  paper: '#EAF4EE',
  ink: '#0A0E0C',
  inkSoft: 'rgba(10,14,12,0.55)',
  paperDark: '#CFE3D6',
} as const;

export const SANS = 'Montserrat, sans-serif';
export const SERIF = 'Instrument Serif, serif';
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const SHADOW = '0 4px 18px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.5)';
export const SHADOW_BIG = '0 8px 34px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.6)';

// Tela dividida sem divisória: o painel de cima vai até PANEL_H e se dissolve (desfoque) sobre o vídeo.
export const SPLIT_Y = 900;
export const PANEL_H = 1010;
export const SPLIT_OFFSET = 600;
