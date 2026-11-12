import React from 'react';
import {Composition} from 'remotion';
import './theme';
import {Ep} from './Ep';
import {TOTAL} from './timeline';

export const RemotionRoot: React.FC = () => <Composition id="Ep" component={Ep} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />;
