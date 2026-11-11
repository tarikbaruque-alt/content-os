import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Fontes da identidade (tiradas das referências do Dr. Bruno Sá)
for (const w of ['500', '600', '700']) {
  loadFont({family: 'Josefin Sans', url: staticFile(`fonts/josefin-sans-latin-${w}-normal.woff2`), weight: w});
  loadFont({family: 'Quicksand', url: staticFile(`fonts/quicksand-latin-${w}-normal.woff2`), weight: w});
}
loadFont({family: 'Bebas Neue', url: staticFile('fonts/bebas-neue-latin-400-normal.woff2'), weight: '400'});
loadFont({family: 'Kaushan Script', url: staticFile('fonts/kaushan-script-latin-400-normal.woff2'), weight: '400'});

export const JOSEFIN = '"Josefin Sans", sans-serif';
export const QUICK = 'Quicksand, sans-serif';
export const BEBAS = '"Bebas Neue", sans-serif';
export const SCRIPT = '"Kaushan Script", cursive';

// Paleta amostrada das referências
export const K = {
  green: '#778F60',
  greenMid: '#6B8454',
  greenDark: '#4D6139',
  greenDeep: '#38472B',
  ink: '#2C3826',
  cream: '#FBF8EE',
  creamBg: '#F1F0EA',
  mint: '#DEE8CE',
  sage: '#AEC090',
  sageLight: '#C9D8AE',
  leaf: '#DCE7C6',
  brightA: '#8FC45C',
  brightB: '#5C963A',
} as const;

export const W = 1080;
export const H = 1440;
export const N = 5;
