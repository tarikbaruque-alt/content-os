import React from 'react';
import {Composition} from 'remotion';
import './brand';
import {H, N, W} from './brand';
import {Panorama, SlideView} from './Carousel';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Panorama" component={Panorama} durationInFrames={1} fps={30} width={W * N} height={H} defaultProps={{photo: 'img/bruno.jpg'}} />
    {[0, 1, 2, 3, 4].map((i) => (
      <Composition key={i} id={`Slide${i + 1}`} component={SlideView} durationInFrames={1} fps={30} width={W} height={H} defaultProps={{i, photo: 'img/bruno.jpg'}} />
    ))}
  </>
);
