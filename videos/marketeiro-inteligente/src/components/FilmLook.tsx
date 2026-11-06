import React from 'react';
import {AbsoluteFill, Img, random, staticFile, useCurrentFrame} from 'remotion';

// Textura de película: grão animado, vinheta, flicker, riscos e poeira.
export const FilmLook: React.FC<{
  grain?: number;
  vignette?: number;
  flicker?: number;
  scratches?: boolean;
  seed?: string;
}> = ({grain = 0.12, vignette = 0.55, flicker = 0, scratches = false, seed = 'film'}) => {
  const frame = useCurrentFrame();
  const gx = Math.round(random(`${seed}-gx-${frame}`) * 200 - 100);
  const gy = Math.round(random(`${seed}-gy-${frame}`) * 200 - 100);
  const flick = flicker * random(`${seed}-fl-${frame}`);
  const showScratch = scratches && random(`${seed}-sc-${frame}`) > 0.45;
  const scratchX = random(`${seed}-sx-${Math.floor(frame / 3)}`) * 1080;
  const scratch2 = scratches && random(`${seed}-sc2-${frame}`) > 0.8;
  const scratch2X = random(`${seed}-sx2-${frame}`) * 1080;
  const specks = scratches
    ? new Array(5).fill(0).map((_, i) => ({
        x: random(`${seed}-dx-${frame}-${i}`) * 1080,
        y: random(`${seed}-dy-${frame}-${i}`) * 1920,
        r: 2 + random(`${seed}-dr-${frame}-${i}`) * 5,
        o: random(`${seed}-do-${frame}-${i}`) > 0.6 ? 0.55 : 0,
      }))
    : [];

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <Img
        src={staticFile('grain.png')}
        style={{
          position: 'absolute',
          left: -110,
          top: -190,
          width: 1300,
          height: 2300,
          translate: `${gx}px ${gy}px`,
          mixBlendMode: 'overlay',
          opacity: grain,
        }}
      />
      {showScratch ? (
        <div
          style={{
            position: 'absolute',
            left: scratchX,
            top: 0,
            width: 2,
            height: 1920,
            background: 'rgba(255,245,220,0.35)',
          }}
        />
      ) : null}
      {scratch2 ? (
        <div
          style={{
            position: 'absolute',
            left: scratch2X,
            top: 0,
            width: 1,
            height: 1920,
            background: 'rgba(20,10,0,0.35)',
          }}
        />
      ) : null}
      {specks.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: s.x,
            top: s.y,
            width: s.r,
            height: s.r * 1.4,
            borderRadius: '50%',
            background: '#1a1209',
            opacity: s.o,
          }}
        />
      ))}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 75% 60% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,${vignette}) 100%)`,
        }}
      />
      {flicker > 0 ? <AbsoluteFill style={{background: '#000', opacity: flick}} /> : null}
    </AbsoluteFill>
  );
};
