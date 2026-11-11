import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Audio, Video} from '@remotion/media';
import {assessorMode, faceFix, punchAt, SEGS, splitY} from '../timeline';
import {C, clamp} from '../theme';

const take = (n: number) => staticFile(`takes/t${String(n).padStart(2, '0')}.mp4`);
const voice = (n: number) => staticFile(`audio/a${String(n).padStart(2, '0')}.wav`);

// ---------- Rosto (A-roll) ----------
const Shot: React.FC<{i: number}> = ({i}) => {
  const seg = SEGS[i];
  const local = useCurrentFrame();
  const f = local + seg.from_;
  const sameTake = SEGS.filter((s) => s.take === seg.take);
  const k = sameTake.indexOf(seg);
  const cut = k % 2 === 1 ? 1.06 : 1; // disfarça o pulo nos cortes dentro do mesmo take
  const p = punchAt(f) * cut * (1 + Math.min(local, 240) * 0.0001);
  const fx = faceFix(seg.take);
  const mode = assessorMode(f);
  return (
    <AbsoluteFill style={{translate: `0 ${splitY(f)}px`}}>
    <AbsoluteFill style={{scale: String(p), transformOrigin: '540px 900px'}}>
      <AbsoluteFill style={{transformOrigin: '0 0', scale: String(fx.s), translate: `${fx.x}px ${fx.y}px`}}>
        <Video
          src={take(seg.take)}
          trimBefore={seg.src}
          muted
          style={{width: 1080, height: 1920, filter: mode ? 'contrast(1.1) saturate(0.85) brightness(1.02)' : 'contrast(1.06) saturate(0.95) brightness(1.03)'}}
        />
      </AbsoluteFill>
    </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const ARoll: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.navyDeep}}>
    {SEGS.map((s, i) => (
      <Sequence key={i} name={`Take ${s.take} · ${i}`} from={s.from_} durationInFrames={s.srcEnd - s.src} premountFor={30}>
        <Shot i={i} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

export const Voice: React.FC = () => (
  <>
    {SEGS.map((s, i) => {
      const d = s.srcEnd - s.src;
      return (
        <Sequence key={i} name={`Voz ${s.take}`} from={s.from_} durationInFrames={d} layout="none">
          <Audio src={voice(s.take)} trimBefore={s.src} volume={(f) => interpolate(f, [0, 1, d - 1, d], [0, 1, 1, 0], clamp)} />
        </Sequence>
      );
    })}
  </>
);

// ---------- Rosto em miniatura (PiP), com borda cobre ----------
export const PiP: React.FC<{x?: number; y?: number; w?: number; h?: number; from: number}> = ({x = 60, y = 1010, w = 300, h = 400, from}) => {
  const f = useCurrentFrame();
  const a = interpolate(f, [0, 8], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: 26,
        overflow: 'hidden',
        border: `3px solid ${C.copperLight}`,
        boxShadow: '0 18px 50px rgba(0,0,0,0.5)',
        opacity: a,
        scale: String(0.9 + 0.1 * a),
        transformOrigin: 'left bottom',
      }}
    >
      <div style={{position: 'absolute', left: (w - 1080 * 0.42) / 2, top: -900 * 0.42 + h * 0.48, width: 1080, height: 1920, scale: '0.42', transformOrigin: '0 0'}}>
        <Sequence from={-from} layout="none">
          <ARoll />
        </Sequence>
      </div>
    </div>
  );
};

// ---------- Imagem cinematográfica com movimento 2.5D (zoom + deriva + leve rotação) ----------
export const Cine: React.FC<{
  src: string;
  dur: number;
  from?: {s: number; x: number; y: number};
  to?: {s: number; x: number; y: number};
  w?: number;
  h?: number;
  grade?: string;
  rot?: number;
}> = ({src, dur, from = {s: 1.06, x: 0, y: 0}, to = {s: 1.16, x: 0, y: -20}, w = 1080, h = 1920, grade = 'contrast(1.06) saturate(1.04)', rot = 0.6}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, dur], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)});
  const s = from.s + (to.s - from.s) * p;
  const x = from.x + (to.x - from.x) * p;
  const y = from.y + (to.y - from.y) * p;
  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: C.navyDeep}}>
      <Img
        src={staticFile(src)}
        style={{
          position: 'absolute',
          left: (1080 - w) / 2,
          top: (1920 - h) / 2,
          width: w,
          height: h,
          objectFit: 'cover',
          scale: String(s),
          translate: `${x}px ${y}px`,
          rotate: `${rot * (p - 0.5)}deg`,
          filter: grade,
        }}
      />
    </AbsoluteFill>
  );
};

// grão de filme + vinheta (unidade visual em todas as cenas)
export const Finish: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(4,8,18,0.5) 100%)'}} />
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile('grain.png')})`,
          backgroundSize: '512px 512px',
          backgroundPosition: `${(f * 137) % 512}px ${(f * 263) % 512}px`,
          opacity: 0.07,
          mixBlendMode: 'overlay',
        }}
      />
    </AbsoluteFill>
  );
};
