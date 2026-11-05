import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, F} from '../theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Etiqueta de localização datilografada (estilo documentário).
export const Locator: React.FC<{text: string; top?: number; charsPerFrame?: number}> = ({
  text,
  top = 210,
  charsPerFrame = 1.3,
}) => {
  const frame = useCurrentFrame();
  const shown = Math.min(text.length, Math.floor(frame * charsPerFrame));
  const cursorOn = Math.floor(frame / 8) % 2 === 0;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 80,
          top,
          padding: '14px 24px',
          background: 'rgba(15,10,5,0.72)',
          borderLeft: `6px solid ${C.gold}`,
          fontFamily: F.type,
          fontSize: 40,
          letterSpacing: 2,
          color: C.cream,
          whiteSpace: 'pre',
          opacity: interpolate(frame, [0, 3], [0, 1], clamp),
        }}
      >
        {text.slice(0, shown)}
        <span style={{opacity: cursorOn ? 1 : 0}}>▌</span>
      </div>
    </AbsoluteFill>
  );
};

// Crédito de nome (personagem histórico).
export const NameCard: React.FC<{name: string; role: string; top?: number}> = ({name, role, top = 1000}) => {
  const frame = useCurrentFrame();
  const line = interpolate(frame, [0, 12], [0, 520], {...clamp, easing: Easing.out(Easing.cubic)});
  const nameOp = interpolate(frame, [6, 14], [0, 1], clamp);
  const roleShown = Math.max(0, Math.floor((frame - 12) * 1.6));
  const back = interpolate(frame, [0, 8], [0, 1], clamp);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: top - 60,
          height: 260,
          background: 'linear-gradient(90deg, rgba(10,6,2,0.78) 0%, rgba(10,6,2,0.55) 55%, rgba(10,6,2,0) 100%)',
          opacity: back,
        }}
      />
      <div style={{position: 'absolute', left: 80, top}}>
        <div
          style={{
            fontFamily: F.fell,
            fontSize: 70,
            color: C.cream,
            opacity: nameOp,
            translate: `${interpolate(frame, [6, 16], [-30, 0], {...clamp, easing: Easing.out(Easing.cubic)})}px 0px`,
            textShadow: '0 4px 18px rgba(0,0,0,0.8)',
          }}
        >
          {name}
        </div>
        <div style={{height: 4, width: line, background: C.gold, margin: '8px 0 12px'}} />
        <div
          style={{
            fontFamily: F.type,
            fontSize: 38,
            color: C.gold,
            whiteSpace: 'pre',
            textShadow: '0 3px 12px rgba(0,0,0,0.9)',
          }}
        >
          {role.slice(0, roleShown)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Cartão de passo (1, 2) para a parte prática.
export const StepCard: React.FC<{n: string; text: string; top: number}> = ({n, text, top}) => {
  const frame = useCurrentFrame();
  const pop = interpolate(frame, [0, 8], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.8))});
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 80,
          right: 80,
          top,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          padding: '14px 24px',
          background: C.parchment,
          borderRadius: 14,
          boxShadow: '0 18px 40px rgba(0,0,0,0.45)',
          scale: String(0.85 + 0.15 * pop),
          opacity: pop,
          rotate: n === '1' ? '-1.5deg' : '1.2deg',
        }}
      >
        <div
          style={{
            flex: '0 0 auto',
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: C.red,
            color: C.cream,
            fontFamily: F.serif,
            fontWeight: 900,
            fontSize: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {n}
        </div>
        <div style={{fontFamily: F.serif, fontWeight: 900, fontStyle: 'italic', fontSize: 40, color: C.ink, lineHeight: 1.08}}>
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Cartela do quadro.
export const SeriesTitle: React.FC<{top?: number}> = ({top = 980}) => {
  const frame = useCurrentFrame();
  const sc = interpolate(frame, [0, 10], [1.5, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const op = interpolate(frame, [0, 6], [0, 1], clamp);
  const rule = interpolate(frame, [6, 18], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{pointerEvents: 'none', alignItems: 'center'}}>
      <div style={{position: 'absolute', top, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: op}}>
        <div style={{fontFamily: F.type, fontSize: 36, color: C.cream, letterSpacing: 10, textShadow: '0 3px 10px #000'}}>
          O QUADRO
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 22, marginTop: 6}}>
          <div style={{height: 3, width: 120 * rule, background: C.gold}} />
          <div
            style={{
              fontFamily: F.serif,
              fontWeight: 900,
              fontSize: 104,
              color: C.gold,
              scale: String(sc),
              textShadow: '0 6px 24px rgba(0,0,0,0.85)',
              whiteSpace: 'nowrap',
            }}
          >
            Atrás do Rótulo
          </div>
          <div style={{height: 3, width: 120 * rule, background: C.gold}} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const FollowPill: React.FC<{top?: number}> = ({top = 1050}) => {
  const frame = useCurrentFrame();
  const pop = interpolate(frame, [0, 9], [0, 1], {...clamp, easing: Easing.out(Easing.back(2))});
  const pulse = 1 + 0.03 * Math.sin(frame / 4);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', alignItems: 'center'}}>
      <div
        style={{
          position: 'absolute',
          top,
          padding: '22px 46px',
          borderRadius: 999,
          background: C.gold,
          color: C.ink,
          fontFamily: F.sans,
          fontWeight: 800,
          fontSize: 50,
          letterSpacing: 1,
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          scale: String(pop * pulse),
          opacity: pop,
        }}
      >
        SIGA PARA MAIS HISTÓRIAS ➜
      </div>
    </AbsoluteFill>
  );
};

// Flash dourado no corte.
export const Flash: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        background: 'radial-gradient(circle at 50% 45%, rgba(255,236,190,1) 0%, rgba(242,193,78,0.6) 45%, rgba(0,0,0,0) 80%)',
        mixBlendMode: 'screen',
        opacity: interpolate(frame, [0, 5], [0.7, 0], clamp),
      }}
    />
  );
};
