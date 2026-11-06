import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Audio, Video} from '@remotion/media';
import './fonts';
import {Captions} from './components/Captions';
import {Card} from './components/Card';
import {FilmLook} from './components/FilmLook';
import {FollowPill, Note, Stamp} from './components/Graphics';

// Zoom no rosto: [frame, escala, corte seco?]. A origem é o rosto (540, 850), então ele continua centralizado.
const PUNCH: [number, number, boolean][] = [
  [0, 1, true],
  [61, 1, true],
  [104, 1.07, false],
  [139, 1, true],
  [176, 1.09, false],
  [334, 1, true],
  [376, 1.08, false],
  [401, 1, true],
  [432, 1.08, false],
  [528, 1.03, true],
  [570, 1.09, false],
  [704, 1, true],
  [760, 1.07, false],
  [938, 1.03, true],
  [995, 1.09, false],
  [1023, 1, true],
  [1097, 1.05, false],
  [1407, 1.03, true],
  [1468, 1.1, false],
];

const punchAt = (frame: number) => {
  let i = 0;
  for (let k = 0; k < PUNCH.length; k++) if (PUNCH[k][0] <= frame) i = k;
  const [f0, s0, cut] = PUNCH[i];
  const prev = i > 0 ? PUNCH[i - 1][1] : s0;
  const s = cut ? s0 : interpolate(frame, [f0, f0 + 6], [prev, s0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return s * (1 + Math.min(frame - f0, 120) * 0.0002);
};

const take = (n: number) => staticFile(`takes/take${String(n).padStart(2, '0')}.mp4`);
const sfx = (name: string) => staticFile(`sfx/${name}.wav`);

// Enquadramento por take (detecção de rosto): rosto centralizado em (540, 850) e com a mesma altura em todos.
const framing = (scale: number, x: number, y: number): React.CSSProperties => ({
  position: 'absolute',
  left: 0,
  top: 0,
  width: 1080,
  height: 1920,
  transformOrigin: '0 0',
  scale: String(scale),
  translate: `${x}px ${y}px`,
  filter: 'contrast(1.06) saturate(1.05) brightness(1.04)',
});

const ARoll: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{scale: String(punchAt(f)), transformOrigin: '540px 850px'}}>
      <Video name="Take 1 · gancho" src={take(1)} from={0} durationInFrames={139} trimBefore={0} objectFit="cover" style={framing(1.152, -47.5, -1.3)} />
      <Video name="Take 2 · primeiro motivo" src={take(2)} from={139} durationInFrames={74} trimBefore={4} objectFit="cover" style={framing(1.096, -58.4, -1.6)} />
      <Video name="Take 3 · seu prato" src={take(3)} from={213} durationInFrames={42} trimBefore={2} objectFit="cover" style={framing(1.068, -34.6, -2.8)} />
      <Video name="Take 4 · ansiedade" src={take(4)} from={255} durationInFrames={146} trimBefore={5} objectFit="cover" style={framing(1.155, -86, -52.1)} />
      <Video name="Take 5 · ancoragem" src={take(5)} from={401} durationInFrames={53} trimBefore={0} objectFit="cover" style={framing(1.124, -27.6, -233.5)} />
      <Video name="Take 12 · vinho caríssimo" src={take(12)} from={454} durationInFrames={134} trimBefore={0} objectFit="cover" style={framing(1.188, -37.4, -359.4)} />
      <Video name="Take 6 · opção do meio" src={take(6)} from={588} durationInFrames={116} trimBefore={0} objectFit="cover" style={framing(1.134, -17.9, -255.1)} />
      <Video name="Take 7 · seu negócio" src={take(7)} from={704} durationInFrames={79} trimBefore={1} objectFit="cover" style={framing(1.11, -50.5, -208.9)} />
      <Video name="Take 8 · bombom" src={take(8)} from={837} durationInFrames={186} trimBefore={4} objectFit="cover" style={framing(1.177, -0.8, -281.7)} />
      <Video name="Take 9 · virada" src={take(9)} from={1023} durationInFrames={217} trimBefore={0} objectFit="cover" style={framing(1.165, -6.4, -270.7)} />
      <Video name="Take 11a · comenta" src={take(11)} from={1240} durationInFrames={167} trimBefore={0} objectFit="cover" style={framing(1.201, -4.1, -278.9)} />
      <Video name="Take 11b · vão bora" src={take(11)} from={1407} durationInFrames={78} trimBefore={180} objectFit="cover" style={framing(1.201, -4.1, -278.9)} />
    </AbsoluteFill>
  );
};

export const Marketeiro: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: '#0b0907'}}>
      <ARoll />
      <FilmLook grain={0.06} vignette={0.38} seed="aroll" />

      {/* ===== Painéis do storyboard (card sobre o painel desfocado) ===== */}
      <Sequence name="Card 1 · serve mesa" from={0} durationInFrames={61}>
        <Card src="images/painel1.jpg" enter={false} keys={[{f: 0, s: 1, x: 0.5, y: 0.5}, {f: 61, s: 1.06, x: 0.5, y: 0.47}]} />
      </Sequence>
      <Sequence name="Card 2 · seu prato sai em 10 min" from={213} durationInFrames={121}>
        <Card src="images/painel2.jpg" keys={[{f: 0, s: 1, x: 0.5, y: 0.5}, {f: 121, s: 1.18, x: 0.62, y: 0.42}]} />
      </Sequence>
      <Sequence name="Card 3a · vinho caríssimo" from={454} durationInFrames={74}>
        <Card src="images/painel3.jpg" keys={[{f: 0, s: 1.32, x: 0.55, y: 0.3}, {f: 74, s: 1.38, x: 0.55, y: 0.29}]} />
      </Sequence>
      <Sequence name="Card 3b · opção do meio" from={588} durationInFrames={116}>
        <Card
          src="images/painel3.jpg"
          keys={[
            {f: 0, s: 1.32, x: 0.55, y: 0.3},
            {f: 30, s: 1.32, x: 0.55, y: 0.3},
            {f: 56, s: 1.3, x: 0.55, y: 0.44},
            {f: 95, s: 1, x: 0.5, y: 0.5},
          ]}
        />
      </Sequence>
      <Sequence name="Card 4 · bombom e conta" from={783} durationInFrames={155}>
        <Card
          src="images/painel4.jpg"
          keys={[
            {f: 0, s: 1.3, x: 0.39, y: 0.3},
            {f: 70, s: 1.32, x: 0.45, y: 0.45},
            {f: 118, s: 1, x: 0.5, y: 0.5},
          ]}
        />
      </Sequence>
      <Sequence name="Card 5 · virada" from={1132} durationInFrames={108}>
        <Card src="images/painel5.jpg" keys={[{f: 0, s: 1, x: 0.5, y: 0.5}, {f: 108, s: 1.08, x: 0.5, y: 0.45}]} />
      </Sequence>
      <Sequence name="Card 6 · comenta INTELIGENTE" from={1240} durationInFrames={167}>
        <Card src="images/painel6.jpg" keys={[{f: 0, s: 1, x: 0.5, y: 0.5}, {f: 167, s: 1.07, x: 0.5, y: 0.5}]} />
      </Sequence>

      {/* ===== Frase que ainda não foi gravada, como bilhete sobre o card ===== */}
      <Sequence name="Bilhete · pico-fim" from={783} durationInFrames={122}>
        <Note before="A gente lembra do melhor momento…" mark="e do final." />
      </Sequence>

      {/* ===== Selos das técnicas (substituem a legenda nesses trechos) ===== */}
      <Sequence name="Selo 1" from={176} durationInFrames={37}>
        <Stamp n="1" label="ESPERA EXPLICADA" />
      </Sequence>
      <Sequence name="Selo 2" from={432} durationInFrames={24}>
        <Stamp n="2" label="ANCORAGEM" />
      </Sequence>
      <Sequence name="Selo 3" from={783} durationInFrames={54}>
        <Stamp n="3" label="O FINAL QUE FICA" />
      </Sequence>

      <Sequence name="Siga" from={1407} durationInFrames={78}>
        <FollowPill />
      </Sequence>

      <Captions />

      {/* ===== Efeitos sonoros (sem trilha) ===== */}
      <Sequence name="sino abertura" from={0} durationInFrames={45} layout="none">
        <Audio src={sfx('ding')} volume={0.4} />
      </Sequence>
      {[58, 210, 451, 525, 585, 780, 935, 1129, 1237, 1404].map((f) => (
        <Sequence key={`w${f}`} name="whoosh" from={f} durationInFrames={18} layout="none">
          <Audio src={sfx('whoosh')} volume={0.26} />
        </Sequence>
      ))}
      {[176, 432, 783].map((f) => (
        <Sequence key={`s${f}`} name="selo" from={f} durationInFrames={15} layout="none">
          <Audio src={sfx('stamp')} volume={0.4} />
          <Audio src={sfx('pop')} volume={0.35} />
        </Sequence>
      ))}
      <Sequence name="relógio" from={281} durationInFrames={50} layout="none">
        <Audio src={sfx('ticks')} volume={0.32} />
      </Sequence>
      <Sequence name="taças" from={456} durationInFrames={15} layout="none">
        <Audio src={sfx('clink')} volume={0.4} />
      </Sequence>
      <Sequence name="destaque do meio" from={644} durationInFrames={6} layout="none">
        <Audio src={sfx('pop')} volume={0.3} />
      </Sequence>
      <Sequence name="sino INTELIGENTE" from={1266} durationInFrames={45} layout="none">
        <Audio src={sfx('ding')} volume={0.32} />
      </Sequence>
      <Sequence name="vão bora" from={1468} durationInFrames={6} layout="none">
        <Audio src={sfx('pop')} volume={0.3} />
      </Sequence>
    </AbsoluteFill>
  );
};
