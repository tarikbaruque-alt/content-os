// Identidade: grafite quase preto, branco quente e dourado (o "Golden" da campanha). Vermelho só para "perdeu".
export const C = {
  bg: '#0B0B0D',
  panel: '#121216',
  line: 'rgba(255,255,255,0.08)',
  white: '#F6F4EF',
  gray: '#9C9CA3',
  gold: '#FFC72C',
  goldSoft: 'rgba(255,199,44,0.16)',
  red: '#E5484D',
} as const;

export const SANS = 'Inter, sans-serif';
export const SERIF = 'Instrument Serif, serif';
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const TEXT_SHADOW = '0 4px 18px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.5)';

// Layout 1080×1920: painel de cima na tela dividida vai até SPLIT_Y.
export const SPLIT_Y = 860;
