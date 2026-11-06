import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Fontes locais (copiadas de @fontsource) para renderizar sem depender de rede.
loadFont({family: 'Montserrat', url: staticFile('fonts/montserrat-latin-800-normal.woff2'), weight: '800'});
loadFont({family: 'Montserrat', url: staticFile('fonts/montserrat-latin-900-normal.woff2'), weight: '900'});
loadFont({family: 'Anton', url: staticFile('fonts/anton-latin-400-normal.woff2'), weight: '400'});
loadFont({family: 'Playfair Display', url: staticFile('fonts/playfair-display-latin-900-italic.woff2'), weight: '900', style: 'italic'});
