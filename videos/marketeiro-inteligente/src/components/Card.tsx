import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {FilmLook} from './FilmLook';

// Painel do storyboard como "card" sobre o próprio painel desfocado em tela cheia.
// keys = câmera dentro do card: ponto da imagem (0–1) no centro do card e o zoom.
export type CamKey = {f: number; s: number; x: number; y: number};

const W = 760;
const H = 1199; // 768x1212 reduzido para 760 de largura
const TOP = 150;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const Card: React.FC<{src: string; keys: CamKey[]; enter?: boolean}> = ({src, keys, enter = true}) => {
  const frame = useCurrentFrame();
  const fs = keys.map((k) => k.f);
  const ease = Easing.bezier(0.45, 0, 0.25, 1);
  const pick = (sel: (k: CamKey) => number) =>
    keys.length > 1 ? interpolate(frame, fs, keys.map(sel), {...clamp, easing: ease}) : sel(keys[0]);
  const s = pick((k) => k.s);
  const half = 0.5 / s;
  const cx = Math.min(1 - half, Math.max(half, pick((k) => k.x)));
  const cy = Math.min(1 - half, Math.max(half, pick((k) => k.y)));

  const p = enter ? interpolate(frame, [0, 10], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.4))}) : 1;
  const bgZoom = interpolate(frame, [0, 200], [1.25, 1.35]);

  return (
    <AbsoluteFill style={{backgroundColor: '#0b0907', overflow: 'hidden'}}>
      <Img
        src={staticFile(src)}
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', scale: String(bgZoom), filter: 'blur(30px) brightness(0.42) saturate(1.15)'}}
      />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,190,90,0.18) 0%, rgba(0,0,0,0) 60%)'}} />
      <div
        style={{
          position: 'absolute',
          left: (1080 - W) / 2,
          top: TOP,
          width: W,
          height: H,
          borderRadius: 36,
          overflow: 'hidden',
          boxShadow: '0 40px 90px rgba(0,0,0,0.65), 0 0 0 2px rgba(255,255,255,0.12)',
          opacity: enter ? interpolate(frame, [0, 4], [0, 1], clamp) : 1,
          scale: String(0.9 + 0.1 * p),
          translate: `0px ${interpolate(p, [0, 1], [70, 0])}px`,
          rotate: `${interpolate(p, [0, 1], [-2.5, 0])}deg`,
        }}
      >
        <Img
          src={staticFile(src)}
          style={{position: 'absolute', left: W / 2 - cx * W * s, top: H / 2 - cy * H * s, width: W * s, height: H * s, objectFit: 'cover'}}
        />
      </div>
      <FilmLook grain={0.07} vignette={0.45} seed={src} />
    </AbsoluteFill>
  );
};
