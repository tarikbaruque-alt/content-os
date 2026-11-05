import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Audio, Video} from '@remotion/media';
import './fonts';
import {Captions} from './components/Captions';
import {FilmLook} from './components/FilmLook';
import {Flash, FollowPill, Locator, NameCard, SeriesTitle, StepCard} from './components/Overlays';
import {PhotoScene} from './components/PhotoScene';
import {BookScene} from './scenes/BookScene';
import {CounterScene} from './scenes/CounterScene';
import {CoverScene} from './scenes/CoverScene';
import {MapScene} from './scenes/MapScene';
import {QuotesScene} from './scenes/QuotesScene';
import {SearchScene} from './scenes/SearchScene';
import {TimelineScene} from './scenes/TimelineScene';

export const GUINNESS_DURATION = 2639;

// Trechos em que a legenda some porque o próprio grafismo já mostra o texto.
const HIDDEN_CAPTIONS: [number, number][] = [
  [750, 872],
  [1467, 1604],
];

// Zoom in/out na câmera do apresentador: [frame, escala, corte seco?]
const PUNCH: [number, number, boolean][] = [
  [0, 1.0, true],
  [100, 1.13, true],
  [482, 1.06, true],
  [521, 1.17, false],
  [585, 1.0, true],
  [682, 1.04, true],
  [723, 1.16, false],
  [1330, 1.15, true],
  [1606, 1.0, true],
  [1618, 1.12, false],
  [1640, 1.0, false],
  [1711, 1.14, false],
  [1912, 1.0, true],
  [1944, 1.1, false],
  [2093, 1.0, true],
  [2141, 1.04, true],
  [2195, 1.13, false],
  [2240, 1.24, false],
  [2400, 1.0, true],
  [2440, 1.08, false],
  [2514, 1.0, false],
  [2588, 1.15, true],
];

const punchAt = (frame: number) => {
  let i = 0;
  for (let k = 0; k < PUNCH.length; k++) if (PUNCH[k][0] <= frame) i = k;
  const [f0, s0, cut] = PUNCH[i];
  const prev = i > 0 ? PUNCH[i - 1][1] : s0;
  const s = cut
    ? s0
    : interpolate(frame, [f0, f0 + 5], [prev, s0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const drift = 1 + Math.min(frame - f0, 150) * 0.00025;
  return s * drift;
};

const take = (n: number) => staticFile(`takes/take${String(n).padStart(2, '0')}.mp4`);
const sfx = (name: string) => staticFile(`sfx/${name}.wav`);
const VIDEO_STYLE: React.CSSProperties = {width: '100%', height: '100%', filter: 'contrast(1.06) saturate(0.92) sepia(0.08)'};

// A-roll: decupagem dos 15 takes (cortes de respiro e pausas longas).
const ARoll: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{scale: String(punchAt(frame)), transformOrigin: '50% 30%'}}>
      <Video name="Take 1a" src={take(1)} from={0} durationInFrames={100} trimBefore={12} objectFit="cover" style={VIDEO_STYLE} />
      <Video name="Take 1b" src={take(1)} from={100} durationInFrames={112} trimBefore={119} objectFit="cover" style={VIDEO_STYLE} />
      <Video name="Take 2" src={take(2)} from={212} durationInFrames={98} trimBefore={0} objectFit="cover" style={VIDEO_STYLE} />
      <Video name="Take 3" src={take(3)} from={310} durationInFrames={275} trimBefore={5} objectFit="cover" style={VIDEO_STYLE} />
      <Video name="Take 4" src={take(4)} from={585} durationInFrames={97} trimBefore={4} objectFit="cover" style={VIDEO_STYLE} />
      <Video name="Take 5" src={take(5)} from={682} durationInFrames={273} trimBefore={9} objectFit="cover" style={VIDEO_STYLE} />
      <Video name="Take 6a" src={take(6)} from={955} durationInFrames={152} trimBefore={0} objectFit="cover" style={VIDEO_STYLE} />
      <Video name="Take 6b" src={take(6)} from={1107} durationInFrames={115} trimBefore={161} objectFit="cover" style={VIDEO_STYLE} />
      <Video name="Take 7" src={take(7)} from={1222} durationInFrames={108} trimBefore={0} objectFit="cover" style={VIDEO_STYLE} />
      <Video name="Take 8" src={take(8)} from={1330} durationInFrames={137} trimBefore={0} objectFit="cover" style={VIDEO_STYLE} />
      <Video name="Take 9" src={take(9)} from={1467} durationInFrames={139} trimBefore={0} objectFit="cover" style={VIDEO_STYLE} />
      <Video name="Take 10" src={take(10)} from={1606} durationInFrames={188} trimBefore={0} objectFit="cover" style={VIDEO_STYLE} />
      <Video name="Take 11" src={take(11)} from={1794} durationInFrames={118} trimBefore={0} objectFit="cover" style={VIDEO_STYLE} />
      <Video name="Take 12a" src={take(12)} from={1912} durationInFrames={181} trimBefore={0} objectFit="cover" style={VIDEO_STYLE} />
      <Video name="Take 12b" src={take(12)} from={2093} durationInFrames={48} trimBefore={202} objectFit="cover" style={VIDEO_STYLE} />
      <Video name="Take 13" src={take(13)} from={2141} durationInFrames={121} trimBefore={4} objectFit="cover" style={VIDEO_STYLE} />
      <Video name="Take 14" src={take(14)} from={2262} durationInFrames={138} trimBefore={0} objectFit="cover" style={VIDEO_STYLE} />
      <Video name="Take 15a" src={take(15)} from={2400} durationInFrames={188} trimBefore={0} objectFit="cover" style={VIDEO_STYLE} />
      <Video name="Take 15b" src={take(15)} from={2588} durationInFrames={51} trimBefore={202} objectFit="cover" style={VIDEO_STYLE} />
    </AbsoluteFill>
  );
};

export const Guinness: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: '#0d0a07'}}>
      <ARoll />
      <FilmLook grain={0.08} vignette={0.4} seed="aroll" />

      {/* ===== B-roll e grafismos em tela cheia ===== */}
      <Sequence name="Capa (gancho)" from={132} durationInFrames={80}>
        <CoverScene />
      </Sequence>
      <Sequence name="Mapa 1951" from={212} durationInFrames={98}>
        <MapScene yearAt={22} zoomFrom={30} zoomTo={76} pinAt={80} />
      </Sequence>
      <Sequence name="Caçada" from={310} durationInFrames={172}>
        <PhotoScene
          src="images/cacada.webp"
          seed="cacada"
          keys={[
            {f: 0, s: 1.08, x: 0.45, y: 0.62},
            {f: 68, s: 1.16, x: 0.42, y: 0.6},
            {f: 124, s: 1.55, x: 0.66, y: 0.27},
            {f: 172, s: 1.72, x: 0.68, y: 0.25},
          ]}
        />
        <Sequence from={4} durationInFrames={150} layout="none">
          <Locator text="IRLANDA · NOV. 1951" />
        </Sequence>
        <Sequence from={6} durationInFrames={104} layout="none">
          <NameCard name="Sir Hugh Beaver" role="diretor-gerente da Guinness" top={1010} />
        </Sequence>
      </Sequence>
      <Sequence name="Pub" from={613} durationInFrames={69}>
        <PhotoScene
          src="images/pub.webp"
          seed="pub"
          keys={[
            {f: 0, s: 1.35, x: 0.42, y: 0.38},
            {f: 69, s: 1.08, x: 0.5, y: 0.45},
          ]}
        />
      </Sequence>
      <Sequence name="3 frases" from={750} durationInFrames={122}>
        <QuotesScene q1={6} q2={32} q3={87} />
      </Sequence>
      <Sequence name="Busca 1951" from={872} durationInFrames={83}>
        <SearchScene yearAt={23} />
      </Sequence>
      <Sequence name="Linha do tempo 1954" from={955} durationInFrames={49}>
        <TimelineScene panFrom={4} panTo={18} hitAt={19} />
      </Sequence>
      <Sequence name="Pesquisa (gêmeos)" from={1004} durationInFrames={136}>
        <PhotoScene
          src="images/pesquisa.webp"
          seed="pesquisa"
          keys={[
            {f: 0, s: 1.05, x: 0.5, y: 0.5},
            {f: 136, s: 1.75, x: 0.33, y: 0.37},
          ]}
        />
        <Sequence from={6} durationInFrames={130} layout="none">
          <Locator text="LONDRES · 1954" />
        </Sequence>
        <Sequence from={35} durationInFrames={101} layout="none">
          <NameCard name="Norris & Ross McWhirter" role="gêmeos, pesquisadores de fatos" top={1010} />
        </Sequence>
      </Sequence>
      <Sequence name="Pesquisa (lupa)" from={1140} durationInFrames={82}>
        <PhotoScene
          src="images/pesquisa.webp"
          seed="lupa"
          keys={[
            {f: 0, s: 1.6, x: 0.72, y: 0.56},
            {f: 82, s: 1.9, x: 0.72, y: 0.57},
          ]}
        />
      </Sequence>
      <Sequence name="Livro 1955" from={1222} durationInFrames={108}>
        <BookScene yearAt={7} dropAt={30} />
      </Sequence>
      <Sequence name="Sucesso" from={1352} durationInFrames={115}>
        <PhotoScene
          src="images/sucesso.webp"
          seed="sucesso"
          keys={[
            {f: 0, s: 1.0, x: 0.5, y: 0.6},
            {f: 115, s: 1.22, x: 0.5, y: 0.42},
          ]}
        />
        <Sequence from={8} durationInFrames={107} layout="none">
          <Locator text="REINO UNIDO · NATAL DE 1955" />
        </Sequence>
      </Sequence>
      <Sequence name="+150 milhões" from={1467} durationInFrames={139}>
        <CounterScene countFrom={40} countTo={64} unitAt={62} subAt={100} />
      </Sequence>
      <Sequence name="Pub (conversas)" from={1794} durationInFrames={118}>
        <PhotoScene
          src="images/pub.webp"
          seed="pub2"
          keys={[
            {f: 0, s: 1.7, x: 0.36, y: 0.45},
            {f: 118, s: 1.12, x: 0.5, y: 0.5},
          ]}
        />
      </Sequence>
      <Sequence name="Recap pássaro" from={2262} durationInFrames={54}>
        <PhotoScene
          src="images/cacada.webp"
          seed="recap"
          keys={[
            {f: 0, s: 1.5, x: 0.67, y: 0.27},
            {f: 54, s: 1.65, x: 0.68, y: 0.26},
          ]}
        />
      </Sequence>
      <Sequence name="Recap capa" from={2316} durationInFrames={84}>
        <CoverScene />
      </Sequence>

      {/* ===== Grafismos sobre o apresentador ===== */}
      <Sequence name="Passo 1" from={2000} durationInFrames={141}>
        <StepCard n="1" text="Descubra a pergunta que seus clientes mais fazem" top={1010} />
      </Sequence>
      <Sequence name="Passo 2" from={2098} durationInFrames={43}>
        <StepCard n="2" text="Transforme a resposta em conteúdo" top={1140} />
      </Sequence>
      <Sequence name="Quadro" from={2436} durationInFrames={94}>
        <SeriesTitle top={1000} />
      </Sequence>
      <Sequence name="Siga" from={2530} durationInFrames={109}>
        <FollowPill top={1090} />
      </Sequence>

      {/* Flashes nos cortes para grafismo */}
      {[132, 212, 750, 872, 955, 1222, 1467, 2316].map((f) => (
        <Sequence key={f} from={f} durationInFrames={6} name="Flash" layout="none">
          <Flash />
        </Sequence>
      ))}

      <Captions hidden={HIDDEN_CAPTIONS} />

      {/* ===== Efeitos sonoros ===== */}
      {[129, 209, 307, 610, 747, 869, 952, 1001, 1137, 1219, 1349, 1464, 1791, 2259, 2313].map((f) => (
        <Sequence key={`w${f}`} from={f} durationInFrames={20} name="whoosh" layout="none">
          <Audio src={sfx('whoosh')} volume={0.35} />
        </Sequence>
      ))}
      {[234, 895, 974, 1229, 1531].map((f) => (
        <Sequence key={`s${f}`} from={f} durationInFrames={15} name="carimbo" layout="none">
          <Audio src={sfx('stamp')} volume={0.75} />
        </Sequence>
      ))}
      {[756, 782, 837, 2000, 2098, 2436, 2530].map((f) => (
        <Sequence key={`p${f}`} from={f} durationInFrames={6} name="pop" layout="none">
          <Audio src={sfx('pop')} volume={0.55} />
        </Sequence>
      ))}
      {[316, 874, 1010, 1270, 1360].map((f) => (
        <Sequence key={`t${f}`} from={f} durationInFrames={38} name="máquina de escrever" layout="none">
          <Audio src={sfx('typing')} volume={0.4} />
        </Sequence>
      ))}
      <Sequence from={1487} durationInFrames={42} name="riser" layout="none">
        <Audio src={sfx('riser')} volume={0.3} />
      </Sequence>
      <Sequence from={212} durationInFrames={270} name="projetor" layout="none">
        <Audio src={sfx('projector')} volume={0.09} loop />
      </Sequence>
      <Sequence from={1004} durationInFrames={326} name="projetor" layout="none">
        <Audio src={sfx('projector')} volume={0.09} loop />
      </Sequence>
    </AbsoluteFill>
  );
};
