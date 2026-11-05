import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {FilmLook} from '../components/FilmLook';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Capa atual do livro em tela cheia (fundo desfocado da própria capa).
export const CoverScene: React.FC<{top?: number; width?: number; children?: React.ReactNode; sweepAt?: number}> = ({
  top = 300,
  width = 740,
  children,
  sweepAt = 14,
}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 10], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.4))});
  const z = interpolate(frame, [0, 140], [1, 1.07]);
  const sweep = interpolate(frame, [sweepAt, sweepAt + 18], [-120, 220], clamp);
  const h = (width * 889) / 707;
  return (
    <AbsoluteFill style={{backgroundColor: '#0d0a07', overflow: 'hidden'}}>
      <Img
        src={staticFile('images/capa-2026.webp')}
        style={{position: 'absolute', inset: -80, width: 1240, height: 2080, objectFit: 'cover', filter: 'blur(36px) brightness(0.4) sepia(0.35)'}}
      />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 35%, rgba(242,193,78,0.35) 0%, rgba(0,0,0,0) 55%)'}} />
      <div
        style={{
          position: 'absolute',
          left: (1080 - width) / 2,
          top,
          width,
          height: h,
          scale: String((0.8 + 0.2 * enter) * z),
          opacity: enter,
          rotate: `${interpolate(enter, [0, 1], [-6, 0])}deg`,
          boxShadow: '0 50px 90px rgba(0,0,0,0.7)',
          overflow: 'hidden',
          borderRadius: 8,
        }}
      >
        <Img src={staticFile('images/capa-2026.webp')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${sweep}%`,
            width: '35%',
            background: 'linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 100%)',
          }}
        />
      </div>
      {children}
      <FilmLook grain={0.12} vignette={0.55} seed="cover" />
    </AbsoluteFill>
  );
};
