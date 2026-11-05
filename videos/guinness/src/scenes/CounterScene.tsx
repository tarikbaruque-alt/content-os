import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {CoverScene} from './CoverScene';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// +150 milhões de exemplares. countFrom/countTo = contagem; unitAt = "milhões"; subAt = "exemplares".
export const CounterScene: React.FC<{countFrom?: number; countTo?: number; unitAt?: number; subAt?: number}> = ({
  countFrom = 40,
  countTo = 66,
  unitAt = 62,
  subAt = 100,
}) => {
  const frame = useCurrentFrame();
  const n = Math.round(interpolate(frame, [countFrom, countTo], [0, 150], {...clamp, easing: Easing.out(Easing.cubic)}));
  const numOp = interpolate(frame, [countFrom - 4, countFrom], [0, 1], clamp);
  const land = interpolate(frame, [countTo, countTo + 6], [1.25, 1], {...clamp, easing: Easing.out(Easing.back(2))});
  const unit = interpolate(frame, [unitAt, unitAt + 8], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const subShown = Math.max(0, Math.floor((frame - subAt) * 1.6));
  const SUB = 'de exemplares pelo mundo';
  return (
    <CoverScene top={170} width={560}>
      <AbsoluteFill style={{alignItems: 'center'}}>
        <div
          style={{
            position: 'absolute',
            top: 900,
            fontFamily: F.serif,
            fontWeight: 900,
            fontSize: 260,
            lineHeight: 1,
            color: C.gold,
            opacity: numOp,
            scale: String(frame >= countTo ? land : 1),
            textShadow: '0 10px 40px rgba(0,0,0,0.85)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          +{n}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 1175,
            fontFamily: F.sans,
            fontWeight: 800,
            fontSize: 92,
            letterSpacing: 18,
            color: C.cream,
            opacity: unit,
            translate: `0px ${interpolate(unit, [0, 1], [30, 0])}px`,
            textShadow: '0 6px 24px rgba(0,0,0,0.9)',
          }}
        >
          MILHÕES
        </div>
        <div style={{position: 'absolute', top: 1310, fontFamily: F.type, fontSize: 50, color: C.gold, whiteSpace: 'pre', textShadow: '0 4px 16px #000'}}>
          {SUB.slice(0, subShown)}
        </div>
      </AbsoluteFill>
    </CoverScene>
  );
};
