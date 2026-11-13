import React from 'react';
import {AbsoluteFill, Sequence, staticFile} from 'remotion';
import {Audio} from '@remotion/media';
import './theme';
import {Captions} from './components/Captions';
import {ARoll, FullLayer, TopPanel, Voice} from './components/Layers';
import {OVERLAYS} from './components/Overlays';
import {MK, SECTIONS, T, TOTAL} from './timeline';
import {C} from './theme';

const sfx = (n: string) => staticFile(`sfx/${n}.wav`);
const Fx: React.FC<{n: string; at: number; v: number; dur?: number}> = ({n, at, v, dur = 30}) => (
  <Sequence name={`sfx ${n}`} from={Math.max(0, Math.round(at))} durationInFrames={dur} layout="none">
    <Audio src={sfx(n)} volume={v} />
  </Sequence>
);

export const Ep: React.FC = () => {
  // whoosh discreto só quando sai do rosto para um gráfico
  const whoosh = SECTIONS.filter((s, i) => i > 0 && s.mode !== 'face' && SECTIONS[i - 1].mode === 'face').map((s) => s.from - 3);
  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      <ARoll />
      <TopPanel />
      <FullLayer />
      {OVERLAYS.map((O, i) => (
        <Sequence key={i} name={`Overlay ${O.name}`} from={0} durationInFrames={TOTAL} layout="none">
          <O />
        </Sequence>
      ))}
      <Captions />
      <Voice />
      {whoosh.map((f, i) => (
        <Fx key={`w${i}`} n="whoosh" at={f} v={0.05} dur={20} />
      ))}
      {/* papel / comunicado */}
      <Fx n="page" at={MK.meta1 - 2} v={0.07} dur={24} />
      <Fx n="page" at={T(11) + 1} v={0.06} dur={24} />
      <Fx n="page" at={T(15) + 1} v={0.06} dur={24} />
      {/* pops pontuais (sem repetir em toda palavra) */}
      {[MK.n105 - 3, MK.esperanca1 - 3, MK.mais3 - 2, MK.tempo7 - 3, MK.curtem7 - 3, MK.comentam7 - 3, MK.compartilham7 - 3, MK.alcance8 - 3, MK.trazer9 - 2, MK.amigos9 - 2, MK.determina5 - 6].map((f, i) => (
        <Fx key={`p${i}`} n="pop" at={f} v={0.045} dur={8} />
      ))}
      <Fx n="ticks" at={MK.destaque5 - 4} v={0.05} dur={24} />
      <Fx n="shine" at={T(10)} v={0.07} dur={40} />
      <Fx n="ding" at={MK.boa14 - 4} v={0.05} dur={30} />
      <Fx n="msg" at={T(19)} v={0.06} dur={10} />
      <Fx n="msg" at={T(20)} v={0.06} dur={10} />
      <Fx n="msg" at={MK.visualizou21 - 3} v={0.05} dur={10} />
      <Fx n="whoosh" at={MK.seguidores23 + 4} v={0.04} dur={20} />
      <Fx n="tap" at={MK.segue24 + 8} v={0.07} dur={8} />
    </AbsoluteFill>
  );
};
