import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {FilmLook} from './FilmLook';

// Câmera sobre uma imagem: cada keyframe diz qual ponto da imagem (0–1) fica
// no centro da tela e com qual zoom. As bordas nunca aparecem.
export type CamKey = {f: number; s: number; x: number; y: number};

const IMG_W = 1080;
const IMG_H = 1920;

export const PhotoScene: React.FC<{
  src: string;
  keys: CamKey[];
  sepia?: number;
  entry?: boolean;
  seed?: string;
}> = ({src, keys, sepia = 0.32, entry = true, seed = 'photo'}) => {
  const frame = useCurrentFrame();
  const fs = keys.map((k) => k.f);
  const ease = Easing.bezier(0.45, 0, 0.25, 1);
  const s = keys.length > 1 ? interpolate(frame, fs, keys.map((k) => k.s), {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease}) : keys[0].s;
  const cx0 = keys.length > 1 ? interpolate(frame, fs, keys.map((k) => k.x), {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease}) : keys[0].x;
  const cy0 = keys.length > 1 ? interpolate(frame, fs, keys.map((k) => k.y), {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease}) : keys[0].y;
  const half = 0.5 / s;
  const cx = Math.min(1 - half, Math.max(half, cx0));
  const cy = Math.min(1 - half, Math.max(half, cy0));
  const left = 540 - cx * IMG_W * s;
  const top = 960 - cy * IMG_H * s;

  const entryScale = entry
    ? interpolate(frame, [0, 9], [1.14, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)})
    : 1;
  const blur = entry ? interpolate(frame, [0, 7], [14, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
  const bright = entry ? interpolate(frame, [0, 6], [1.7, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;

  return (
    <AbsoluteFill style={{backgroundColor: '#0d0a07', overflow: 'hidden'}}>
      <AbsoluteFill style={{scale: String(entryScale), filter: `blur(${blur}px) brightness(${bright})`}}>
        <Img
          src={staticFile(src)}
          style={{
            position: 'absolute',
            left,
            top,
            width: IMG_W * s,
            height: IMG_H * s,
            objectFit: 'cover',
            filter: `sepia(${sepia}) contrast(1.08) saturate(0.9)`,
          }}
        />
      </AbsoluteFill>
      <FilmLook grain={0.16} vignette={0.6} flicker={0.06} scratches seed={seed} />
    </AbsoluteFill>
  );
};
