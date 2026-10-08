import { loadFont as anton } from "@remotion/google-fonts/Anton";
import { loadFont as archivoBlack } from "@remotion/google-fonts/ArchivoBlack";
import { loadFont as bangers } from "@remotion/google-fonts/Bangers";
import { loadFont as bebas } from "@remotion/google-fonts/BebasNeue";
import { loadFont as dmSerif } from "@remotion/google-fonts/DMSerifDisplay";
import { loadFont as montserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as oswald } from "@remotion/google-fonts/Oswald";
import { loadFont as playfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as poppins } from "@remotion/google-fonts/Poppins";
import { loadFont as spaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as syne } from "@remotion/google-fonts/Syne";
import { loadFont as unbounded } from "@remotion/google-fonts/Unbounded";

// Tipografias prontas. Para incluir outra, importe de @remotion/google-fonts
// e acrescente aqui com o peso mais forte que ela tiver.
const FONTES = {
  Anton: { carregar: () => anton("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] }), peso: 400 },
  "Archivo Black": { carregar: () => archivoBlack("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] }), peso: 400 },
  Bangers: { carregar: () => bangers("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] }), peso: 400 },
  "Bebas Neue": { carregar: () => bebas("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] }), peso: 400 },
  "DM Serif Display": { carregar: () => dmSerif("italic", { weights: ["400"], subsets: ["latin", "latin-ext"] }), peso: 400 },
  Montserrat: { carregar: () => montserrat("normal", { weights: ["900"], subsets: ["latin", "latin-ext"] }), peso: 900 },
  Oswald: { carregar: () => oswald("normal", { weights: ["700"], subsets: ["latin", "latin-ext"] }), peso: 700 },
  "Playfair Display": { carregar: () => playfair("italic", { weights: ["900"], subsets: ["latin", "latin-ext"] }), peso: 900 },
  Poppins: { carregar: () => poppins("normal", { weights: ["800"], subsets: ["latin", "latin-ext"] }), peso: 800 },
  "Space Grotesk": { carregar: () => spaceGrotesk("normal", { weights: ["700"], subsets: ["latin", "latin-ext"] }), peso: 700 },
  Syne: { carregar: () => syne("normal", { weights: ["800"], subsets: ["latin", "latin-ext"] }), peso: 800 },
  Unbounded: { carregar: () => unbounded("normal", { weights: ["900"], subsets: ["latin", "latin-ext"] }), peso: 900 },
} as const;

export type NomeFonte = keyof typeof FONTES;
export const NOMES_FONTES = Object.keys(FONTES) as [NomeFonte, ...NomeFonte[]];

export type Fonte = { familia: string; peso: number; italico: boolean };

const carregadas = new Map<NomeFonte, Fonte>();

export const usarFonte = (nome: NomeFonte): Fonte => {
  const pronta = carregadas.get(nome);
  if (pronta) return pronta;
  const def = FONTES[nome];
  const { fontFamily } = def.carregar();
  const fonte = { familia: fontFamily, peso: def.peso, italico: nome === "DM Serif Display" || nome === "Playfair Display" };
  carregadas.set(nome, fonte);
  return fonte;
};
