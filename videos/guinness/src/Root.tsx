import React from 'react';
import {Composition, Folder} from 'remotion';
import './fonts';
import {Guinness, GUINNESS_DURATION} from './Guinness';
import {BookScene} from './scenes/BookScene';
import {CounterScene} from './scenes/CounterScene';
import {MapScene} from './scenes/MapScene';
import {QuotesScene} from './scenes/QuotesScene';
import {SearchScene} from './scenes/SearchScene';
import {TimelineScene} from './scenes/TimelineScene';
import {ReelsCover, TitleCard} from './scenes/TitleCard';

const base = {fps: 30, width: 1080, height: 1920} as const;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Guinness" component={Guinness} durationInFrames={GUINNESS_DURATION} {...base} />
      <Composition id="CapaReels" component={ReelsCover} durationInFrames={30} {...base} />
      <Folder name="Cenas">
        <Composition id="Mapa" component={MapScene} durationInFrames={98} {...base} />
        <Composition id="TresFrases" component={QuotesScene} durationInFrames={122} {...base} />
        <Composition id="Busca1951" component={SearchScene} durationInFrames={83} {...base} />
        <Composition id="LinhaDoTempo" component={TimelineScene} durationInFrames={49} {...base} />
        <Composition id="Livro1955" component={BookScene} durationInFrames={108} {...base} />
        <Composition id="Abertura" component={TitleCard} durationInFrames={50} {...base} />
        <Composition id="Contador" component={CounterScene} durationInFrames={139} {...base} />
      </Folder>
    </>
  );
};
