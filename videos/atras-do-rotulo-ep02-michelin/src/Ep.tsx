import React from 'react';
import {AbsoluteFill, Sequence, staticFile} from 'remotion';
import {Audio} from '@remotion/media';
import './theme';
import {Captions} from './components/Captions';
import {ARoll, FullLayer, TopPanel, Voice} from './components/Layers';
import {JeansSticker, StarsCallback} from './components/Overlays';
import {MK, SECTIONS, SPEECH_END, T, TOTAL} from './timeline';
import {C} from './theme';

const sfx = (n: string) => staticFile(`sfx/${n}.wav`);
const Fx: React.FC<{n: string; at: number; v: number; dur?: number}> = ({n, at, v, dur = 40}) => (
  <Sequence name={`sfx ${n}`} from={Math.max(0, Math.round(at))} durationInFrames={dur} layout="none">
    <Audio src={sfx(n)} volume={v} />
  </Sequence>
);

// Efeitos só onde a imagem pede (páginas, mapa, estrelas). Nenhum efeito nas pausas das piadas.
export const Ep: React.FC<{semVoz?: boolean}> = ({semVoz = false}) => {
  const whoosh = SECTIONS.filter((s, i) => i > 0 && s.mode !== 'face' && !['tire', 'vinheta', 'calcoPanel', 'today'].includes(s.scene ?? '')).map((s) => s.from - 3);
  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      <ARoll />
      <TopPanel />
      <FullLayer />
      <Sequence name="Estrelas (callback)" from={0} durationInFrames={TOTAL} layout="none">
        <StarsCallback />
      </Sequence>
      <Sequence name="Calça jeans" from={0} durationInFrames={TOTAL} layout="none">
        <JeansSticker />
      </Sequence>
      <Captions />

      {semVoz ? null : <Voice />}
      {whoosh.map((f, i) => (
        <Fx key={`w${i}`} n="whoosh" at={f} v={0.07} dur={20} />
      ))}
      {/* parte histórica */}
      <Fx n="page" at={MK.guia5 - 4} v={0.22} dur={14} />
      <Fx n="page" at={MK.com5 - 3} v={0.2} dur={14} />
      <Fx n="slide" at={MK.justamente5} v={0.14} dur={24} />
      {[MK.oficinas5, MK.hoteis5, MK.restaurantes5].map((f, i) => (
        <Fx key={`pin${i}`} n="pop" at={f - 1} v={0.06} dur={8} />
      ))}
      <Fx n="page" at={T(8) + 2} v={0.16} dur={14} />
      <Fx n="ticks" at={MK.menos3} v={0.07} dur={20} />
      {MK.f30 !== undefined ? <Fx n="ticks" at={MK.f30 - 8} v={0.07} dur={24} /> : null}
      <Fx n="shine" at={MK.estrelas9 - 1} v={0.09} dur={30} />
      {[MK.uma10, MK.duas10, MK.tres10].map((f, i) => (
        <Fx key={`st${i}`} n="shine" at={f} v={0.07} dur={30} />
      ))}
      <Fx n="slide" at={MK.motoristas12 - 4} v={0.1} dur={24} />
      {/* encerramento */}
      {[0, 6, 12].map((d) => (
        <Fx key={`cta${d}`} n="shine" at={MK.tres22 + d} v={0.07} dur={30} />
      ))}
      <Fx n="shine" at={SPEECH_END + 18} v={0.1} dur={30} />
    </AbsoluteFill>
  );
};
