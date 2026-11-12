import React from 'react';
import {AbsoluteFill, Sequence, staticFile} from 'remotion';
import {Audio} from '@remotion/media';
import './theme';
import {Captions} from './components/Captions';
import {ARoll, FullLayer, TopPanel, Voice} from './components/Layers';
import {CtaIcons, EmagrecerCard, EuBubble, Parte2, PerfeitoChip, ResultadoChip} from './components/Overlays';
import {MK, SECTIONS, SPEECH_END, TOTAL} from './timeline';
import {C} from './theme';

const sfx = (n: string) => staticFile(`sfx/${n}.wav`);
const Fx: React.FC<{n: string; at: number; v: number; dur?: number}> = ({n, at, v, dur = 30}) => (
  <Sequence name={`sfx ${n}`} from={Math.max(0, Math.round(at))} durationInFrames={dur} layout="none">
    <Audio src={sfx(n)} volume={v} />
  </Sequence>
);

export const Ep: React.FC = () => {
  const whoosh = SECTIONS.filter((s, i) => i > 0 && s.mode !== 'face' && SECTIONS[i - 1].mode === 'face').map((s) => s.from - 3);
  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      <ARoll />
      <TopPanel />
      <FullLayer />
      {[ResultadoChip, EuBubble, PerfeitoChip, EmagrecerCard, Parte2, CtaIcons].map((O, i) => (
        <Sequence key={i} from={0} durationInFrames={TOTAL} layout="none">
          <O />
        </Sequence>
      ))}
      <Captions />
      <Voice />
      {whoosh.map((f, i) => (
        <Fx key={`w${i}`} n="whoosh" at={f} v={0.06} dur={20} />
      ))}
      {[MK.mounjaro1, MK.eu2, MK.dois3, MK.apetite3, MK.saciedade3, MK.pouca3, MK.gordura3, MK.massa3, MK.combustivel4, MK.manutencao4, MK.massa4, MK.aminoacidos5, MK.segunda5, MK.comenta5, MK.curte5, MK.compartilha5].map((f, i) => (
        <Fx key={`p${i}`} n="pop" at={f - 1} v={0.05} dur={8} />
      ))}
      <Fx n="ticks" at={MK.menos3} v={0.05} dur={24} />
      <Fx n="shine" at={SPEECH_END + 2} v={0.08} dur={30} />
    </AbsoluteFill>
  );
};
