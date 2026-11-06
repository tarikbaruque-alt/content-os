import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Highlight} from '@remotion/rough-notation';
import {C, F} from '../theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Selo da técnica: número em círculo vermelho + fita amarela, entrando como carimbo.
export const Stamp: React.FC<{n: string; label: string}> = ({n, label}) => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, 6], [1.8, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const shake = frame < 8 ? Math.sin(frame * 2.6) * (8 - frame) * 0.8 : 0;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', alignItems: 'center'}}>
      <div
        style={{
          position: 'absolute',
          top: 1405,
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          scale: String(s),
          opacity: interpolate(frame, [0, 3], [0, 1], clamp),
          rotate: '-3deg',
          translate: `${shake}px 0px`,
          filter: 'drop-shadow(0 16px 30px rgba(0,0,0,0.55))',
        }}
      >
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: '50%',
            background: C.red,
            border: `6px solid ${C.white}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: F.display,
            fontSize: 84,
            color: C.white,
            zIndex: 2,
            marginRight: -26,
          }}
        >
          {n}
        </div>
        <div
          style={{
            background: C.yellow,
            padding: '14px 40px 10px 52px',
            fontFamily: F.display,
            fontSize: 96,
            lineHeight: 1,
            color: C.black,
            letterSpacing: 1,
            clipPath: 'polygon(0 4%, 100% 0, 98% 100%, 1% 96%)',
          }}
        >
          {label}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Bilhete creme sobre o card, com trecho grifado (para as frases que não foram gravadas).
export const Note: React.FC<{before: string; mark: string; after?: string; top?: number}> = ({before, mark, after = '', top = 1040}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 8], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.6))});
  return (
    <AbsoluteFill style={{pointerEvents: 'none', alignItems: 'center'}}>
      <div
        style={{
          position: 'absolute',
          top,
          width: 700,
          padding: '28px 36px',
          background: C.cream,
          borderRadius: 10,
          rotate: '-1.5deg',
          scale: String(0.85 + 0.15 * p),
          opacity: p,
          boxShadow: '0 24px 50px rgba(0,0,0,0.55)',
          fontFamily: F.sans,
          fontWeight: 800,
          fontSize: 50,
          lineHeight: 1.18,
          color: C.black,
          textAlign: 'center',
        }}
      >
        {before}{' '}
        <Highlight color="rgba(255, 201, 60, 0.95)" progress={interpolate(frame, [6, 16], [0, 1], clamp)} iterations={1}>
          {mark}
        </Highlight>
        {after}
      </div>
    </AbsoluteFill>
  );
};

export const FollowPill: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 9], [0, 1], {...clamp, easing: Easing.out(Easing.back(2))});
  return (
    <AbsoluteFill style={{pointerEvents: 'none', alignItems: 'center'}}>
      <div
        style={{
          position: 'absolute',
          top: 150,
          padding: '20px 44px',
          borderRadius: 999,
          background: C.yellow,
          color: C.black,
          fontFamily: F.sans,
          fontWeight: 900,
          fontSize: 44,
          letterSpacing: 1,
          boxShadow: '0 16px 36px rgba(0,0,0,0.45)',
          scale: String(p * (1 + 0.025 * Math.sin(frame / 4))),
          opacity: p,
        }}
      >
        SIGA PARA MAIS ➜
      </div>
    </AbsoluteFill>
  );
};
