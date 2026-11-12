import React from 'react';
import {AbsoluteFill, Composition} from 'remotion';
import './theme';
import {Ep} from './Ep';
import {Vinheta} from './components/Brand';
import {CoverArt} from './components/Scenes';
import {TOTAL} from './timeline';

const Capa: React.FC = () => <CoverArt f={0} />;
const VinhetaSolo: React.FC<{episode?: string}> = ({episode}) => (
  <AbsoluteFill>
    <Vinheta episode={episode} />
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Ep" component={Ep} durationInFrames={TOTAL} fps={30} width={1080} height={1920} defaultProps={{semVoz: false}} />
    <Composition id="Capa" component={Capa} durationInFrames={1} fps={30} width={1080} height={1920} />
    {/* vinheta reutilizável nos próximos episódios */}
    <Composition id="VinhetaAtrasDoRotulo" component={VinhetaSolo} durationInFrames={62} fps={30} width={1080} height={1920} defaultProps={{episode: 'EP. 02 — MICHELIN'}} />
  </>
);
