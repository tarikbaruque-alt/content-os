import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Inter (texto) + Instrument Serif itálica (palavras-chave). Arquivos locais, sem depender de rede.
for (const w of ['500', '600', '700', '800', '900']) {
  loadFont({family: 'Inter', url: staticFile(`fonts/inter-latin-${w}-normal.woff2`), weight: w});
}
loadFont({family: 'Instrument Serif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'});
loadFont({family: 'Instrument Serif', url: staticFile('fonts/instrument-serif-latin-400-normal.woff2'), weight: '400', style: 'normal'});
