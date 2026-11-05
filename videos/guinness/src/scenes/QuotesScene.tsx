import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {FilmLook} from '../components/FilmLook';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Quote: React.FC<{n: string; text: string; tilt: number}> = ({n, text, tilt}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 8], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.6))});
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 28,
        width: 920,
        padding: '30px 36px',
        background: C.parchment,
        borderRadius: 10,
        boxShadow: '0 22px 50px rgba(0,0,0,0.55)',
        rotate: `${tilt}deg`,
        scale: String(1.25 - 0.25 * p),
        opacity: p,
      }}
    >
      <div style={{fontFamily: F.serif, fontWeight: 900, fontSize: 120, lineHeight: 0.9, color: C.red, width: 80, textAlign: 'center'}}>{n}</div>
      <div style={{fontFamily: F.serif, fontWeight: 900, fontStyle: 'italic', fontSize: 66, lineHeight: 1.08, color: C.ink}}>“{text}”</div>
    </div>
  );
};

// As três frases de toda discussão de bar. q2/q3 = frames relativos em que cada frase é dita.
export const QuotesScene: React.FC<{q1?: number; q2?: number; q3?: number}> = ({q1 = 6, q2 = 32, q3 = 87}) => {
  const frame = useCurrentFrame();
  const z = interpolate(frame, [0, 122], [1.08, 1.2]);
  return (
    <AbsoluteFill style={{backgroundColor: C.black, overflow: 'hidden'}}>
      <AbsoluteFill style={{scale: String(z)}}>
        <Img
          src={staticFile('images/pub.webp')}
          style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.5) blur(14px) brightness(0.42)'}}
        />
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          top: 420,
          width: 1080,
          textAlign: 'center',
          fontFamily: F.type,
          fontSize: 46,
          letterSpacing: 4,
          color: C.gold,
          opacity: interpolate(frame, [0, 6], [0, 1], clamp),
        }}
      >
        TODA DISCUSSÃO DE BAR TEM 3 FRASES
      </div>
      <AbsoluteFill style={{alignItems: 'center', top: 560, gap: 56, display: 'flex', flexDirection: 'column'}}>
        <Sequence from={q1} layout="none">
          <Quote n="1" text="Tenho certeza." tilt={-2} />
        </Sequence>
        <Sequence from={q2} layout="none">
          <Quote n="2" text="Aposto quanto você quiser." tilt={1.5} />
        </Sequence>
        <Sequence from={q3} layout="none">
          <Quote n="3" text="Vai procurar no Google." tilt={-1} />
        </Sequence>
      </AbsoluteFill>
      <FilmLook grain={0.18} vignette={0.6} flicker={0.04} scratches seed="quotes" />
    </AbsoluteFill>
  );
};
