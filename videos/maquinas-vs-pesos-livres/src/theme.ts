import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

for (const w of ['500', '600', '700', '800', '900']) {
  loadFont({family: 'Montserrat', url: staticFile(`fonts/montserrat-latin-${w}-normal.woff2`), weight: w});
}

// Briefing: branco + verde para conceitos positivos/relevantes, Montserrat.
export const C = {
  white: '#FFFFFF',
  green: '#3FE07D',
  greenDeep: '#18A957',
  ink: '#0A0E0C',
  line: 'rgba(255,255,255,0.92)',
} as const;

export const SANS = 'Montserrat, sans-serif';
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const SHADOW = '0 3px 14px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.75)';
export const SHADOW_BIG = '0 6px 28px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.7)';
