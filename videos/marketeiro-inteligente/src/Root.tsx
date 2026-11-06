import React from 'react';
import {Composition, Still} from 'remotion';
import './fonts';
import {Capa} from './Capa';
import {TOTAL_FRAMES} from './data/pages';
import {Marketeiro} from './Marketeiro';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Marketeiro" component={Marketeiro} durationInFrames={TOTAL_FRAMES} fps={30} width={1080} height={1920} />
    <Still id="Capa" component={Capa} width={1080} height={1920} />
  </>
);
