import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Fontes locais (copiadas de @fontsource) para renderizar sem depender de rede.
loadFont({family: 'Montserrat', url: staticFile('fonts/montserrat-latin-800-normal.woff2'), weight: '800'});
loadFont({family: 'Montserrat', url: staticFile('fonts/montserrat-latin-600-normal.woff2'), weight: '600'});
loadFont({family: 'Playfair Display', url: staticFile('fonts/playfair-display-latin-900-italic.woff2'), weight: '900', style: 'italic'});
loadFont({family: 'Playfair Display', url: staticFile('fonts/playfair-display-latin-900-normal.woff2'), weight: '900'});
loadFont({family: 'Playfair Display', url: staticFile('fonts/playfair-display-latin-700-normal.woff2'), weight: '700'});
loadFont({family: 'Special Elite', url: staticFile('fonts/special-elite-latin-400-normal.woff2'), weight: '400'});
loadFont({family: 'IM Fell English SC', url: staticFile('fonts/im-fell-english-sc-latin-400-normal.woff2'), weight: '400'});
