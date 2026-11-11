import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

for (const w of ['500', '600', '700', '800', '900']) {
  loadFont({family: 'Montserrat', url: staticFile(`fonts/montserrat-latin-${w}-normal.woff2`), weight: w});
}
for (const w of ['500', '600']) {
  loadFont({family: 'Playfair Display', url: staticFile(`fonts/playfair-display-latin-${w}-italic.woff2`), weight: w, style: 'italic'});
}
loadFont({family: 'Anton', url: staticFile('fonts/anton-latin-400-normal.woff2'), weight: '400'});
loadFont({family: 'Special Elite', url: staticFile('fonts/special-elite-latin-400-normal.woff2'), weight: '400'});
