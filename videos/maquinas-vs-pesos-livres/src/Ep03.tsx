import React from 'react';
import {AbsoluteFill, Sequence, staticFile} from 'remotion';
import {Audio} from '@remotion/media';
import './theme';
import {Captions} from './components/Captions';
import {ARoll, Finish, Voice} from './components/Layers';
import {Combo, CtaIcons, DuoTiles, EndMotion, Hook, SceneControle, SceneEstab, SceneGuiar, SceneSuporte} from './components/Motion';
import {DUO_A, DUO_B, MK, SPEECH_END, T, TOTAL} from './timeline';

const sfx = (n: string) => staticFile(`sfx/${n}.wav`);

const Scene: React.FC<{name: string; from: number; to: number; children: React.ReactNode}> = ({name, from, to, children}) => (
  <Sequence name={name} from={from} durationInFrames={Math.max(1, to - from)} premountFor={30}>
    {children}
  </Sequence>
);

const Fx: React.FC<{n: string; at: number; v: number; dur?: number}> = ({n, at, v, dur = 40}) => (
  <Sequence name={`sfx ${n}`} from={Math.max(0, at)} durationInFrames={dur} layout="none">
    <Audio src={sfx(n)} volume={v} />
  </Sequence>
);

export const Ep03: React.FC = () => {
  const c3 = MK.exigem3;
  const s5 = MK.oferecem5;
  const cb = MK.combinar10;
  const endFrom = SPEECH_END - 2;
  return (
    <AbsoluteFill style={{backgroundColor: '#0A0E0C'}}>
      <ARoll />

      {/* gancho */}
      <Scene name="Gancho · máquinas ou pesos livres" from={0} to={T(2) + 7}>
        <Hook ou={MK.ou1} pesos={MK.pesos1} end={T(2)} />
      </Scene>

      {/* imagens explicativas, cada uma no momento exato da fala */}
      <Scene name="Cena 1 · controle (halteres)" from={c3} to={T(4)}>
        <SceneControle dur={T(4) - c3} controle={MK.controle3 - c3} contracao={MK.contracao3 - c3} />
      </Scene>
      <Scene name="Cena 2 · estabilizadores (búlgaro)" from={T(4)} to={T(5)}>
        <SceneEstab dur={T(5) - T(4)} musculos={MK.musculos4 - T(4)} estab={MK.estab4 - T(4)} />
      </Scene>
      <Scene name="Cena 3 · suporte externo (máquina)" from={s5} to={T(6)}>
        <SceneSuporte dur={T(6) - s5} suporte={MK.suporte5 - s5} />
      </Scene>
      <Scene name="Cena 4 · movimento guiado (leg press)" from={T(6)} to={T(7)}>
        <SceneGuiar dur={T(7) - T(6)} ajudam={MK.ajudam6 - T(6)} guiar={MK.guiar6 - T(6)} />
      </Scene>
      <Scene name="Cena 5 · combinar os dois" from={cb} to={T(11)}>
        <Combo dur={T(11) - cb} dois={MK.dois10 - cb} />
      </Scene>
      <Scene name="Tela dividida · um de cada" from={DUO_A} to={DUO_B + 10}>
        <DuoTiles pesos={MK.pesos12 - DUO_A} maquinas={MK.maquinas12 - DUO_A} />
      </Scene>
      <Scene name="Ícones · compartilha, comenta, curte" from={MK.compartilha12 - 2} to={SPEECH_END + 2}>
        <CtaIcons share={0} comment={MK.comenta12 - MK.compartilha12 + 2} like={MK.curte12 - MK.compartilha12 + 2} />
      </Scene>

      <Captions />

      <Scene name="Fechamento em motion" from={endFrom} to={TOTAL}>
        <EndMotion />
      </Scene>
      <Finish />

      {/* ===== SOM: voz na frente; efeitos só nas transições e destaques ===== */}
      <Voice />
      {[T(2) - 3, c3 - 3, T(4) - 3, s5 - 3, T(6) - 3, cb - 3, DUO_A, endFrom].map((f, i) => (
        <Fx key={`w${i}`} n="whoosh" at={f} v={0.07} dur={20} />
      ))}
      {[MK.ou1, MK.pesos1, MK.controle3, MK.estab4, MK.suporte5, MK.guiar6, MK.dois10, MK.pesos12, MK.maquinas12, MK.compartilha12, MK.comenta12, MK.curte12].map((f, i) => (
        <Fx key={`p${i}`} n="pop" at={f - 1} v={0.06} dur={10} />
      ))}
      <Fx n="shine" at={cb} v={0.08} dur={30} />
      <Fx n="shine" at={endFrom + 20} v={0.09} dur={30} />
    </AbsoluteFill>
  );
};
