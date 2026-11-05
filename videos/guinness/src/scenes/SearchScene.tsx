import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {FilmLook} from '../components/FilmLook';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const QUERY = 'qual a ave mais rápida da europa?';

// Hoje bastaria pesquisar... mas em 1951 não existia busca na internet.
export const SearchScene: React.FC<{yearAt?: number}> = ({yearAt = 23}) => {
  const frame = useCurrentFrame();
  const typed = Math.min(QUERY.length, Math.floor(Math.max(0, frame - 2) * 1.7));
  const old = interpolate(frame, [yearAt, yearAt + 4], [0, 1], clamp);
  const cross = interpolate(frame, [yearAt + 4, yearAt + 14], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const shake = frame >= yearAt && frame < yearAt + 6 ? Math.sin(frame * 3) * 10 : 0;
  const stampS = interpolate(frame, [yearAt, yearAt + 6], [2, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const barFade = interpolate(frame, [yearAt + 30, yearAt + 50], [1, 0.25], clamp);
  const entry = interpolate(frame, [0, 8], [1.1, 1], {...clamp, easing: Easing.out(Easing.cubic)});

  return (
    <AbsoluteFill style={{backgroundColor: '#121214', overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 70% at 50% 45%, ${C.parchment} 0%, #cdb487 70%, #9c7f4f 100%)`,
          opacity: old,
        }}
      />
      <AbsoluteFill style={{scale: String(entry), translate: `${shake}px 0px`, filter: `sepia(${old}) contrast(${1 + 0.1 * old})`}}>
        <div
          style={{
            position: 'absolute',
            top: 640,
            width: 1080,
            textAlign: 'center',
            fontFamily: F.sans,
            fontWeight: 600,
            fontSize: 40,
            letterSpacing: 6,
            color: old > 0.5 ? C.ink : '#9aa0a6',
          }}
        >
          {old > 0.5 ? 'EM 1951…' : 'HOJE'}
        </div>
        <div
          style={{
            position: 'absolute',
            left: 70,
            top: 720,
            width: 940,
            height: 130,
            borderRadius: 999,
            background: '#fff',
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 40px',
            gap: 26,
            opacity: barFade,
          }}
        >
          <svg width={52} height={52} viewBox="0 0 24 24">
            <circle cx={10} cy={10} r={7} stroke="#5f6368" strokeWidth={2.4} fill="none" />
            <line x1={15.2} y1={15.2} x2={21} y2={21} stroke="#5f6368" strokeWidth={2.6} strokeLinecap="round" />
          </svg>
          <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 42, color: '#202124', whiteSpace: 'pre'}}>
            {QUERY.slice(0, typed)}
            <span style={{opacity: Math.floor(frame / 8) % 2 === 0 && old < 0.5 ? 1 : 0, color: '#1a73e8'}}>|</span>
          </div>
        </div>
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <line x1={80} y1={700} x2={80 + 920 * cross} y2={700 + 170 * cross} stroke={C.red} strokeWidth={18} strokeLinecap="round" />
          <line x1={1000} y1={700} x2={1000 - 920 * cross} y2={700 + 170 * cross} stroke={C.red} strokeWidth={18} strokeLinecap="round" />
        </svg>
        <div style={{position: 'absolute', top: 920, width: 1080, display: 'flex', justifyContent: 'center'}}>
          <div
            style={{
              fontFamily: F.serif,
              fontWeight: 900,
              fontSize: 200,
              lineHeight: 1,
              color: C.red,
              border: `8px double ${C.red}`,
              padding: '6px 40px 18px',
              rotate: '5deg',
              scale: String(stampS),
              opacity: old,
            }}
          >
            1951
          </div>
        </div>
      </AbsoluteFill>
      <FilmLook grain={0.08 + 0.12 * old} vignette={0.6} flicker={0.05 * old} scratches={old > 0.5} seed="search" />
    </AbsoluteFill>
  );
};
