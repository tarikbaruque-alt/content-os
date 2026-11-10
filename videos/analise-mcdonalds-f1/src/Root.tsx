import React from 'react';
import {Composition} from 'remotion';
import {Analise} from './Analise';
import {TOTAL} from './timeline';

export const RemotionRoot: React.FC = () => <Composition id="Analise" component={Analise} durationInFrames={TOTAL} fps={30} width={1080} height={1920} defaultProps={{diagSemVoz: false}} />;
