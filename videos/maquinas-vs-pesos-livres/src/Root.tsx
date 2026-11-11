import React from 'react';
import {AbsoluteFill, Composition} from 'remotion';
import {Ep03} from './Ep03';
import {Hook} from './components/Motion';
import {TOTAL} from './timeline';
import './theme';

const Capa: React.FC = () => (
  <AbsoluteFill>
    <Hook ou={-30} pesos={-30} end={100000} />
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Ep03" component={Ep03} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="Capa" component={Capa} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
