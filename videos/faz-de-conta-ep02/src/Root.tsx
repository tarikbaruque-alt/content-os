import React from 'react';
import {Composition} from 'remotion';
import {Ep02} from './Ep02';
import {TOTAL} from './timeline';

export const RemotionRoot: React.FC = () => <Composition id="Ep02" component={Ep02} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />;
