import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig, spring} from 'remotion';
import {MK, SPEECH_END} from '../timeline';
import {C, clamp, SANS, SERIF} from '../theme';

// Overlays sobre o rosto (frame global).
const pop = (f: number, at: number, fps: number) => spring({frame: f - at, fps, config: {damping: 13, stiffness: 180, mass: 0.6}});

// "comenta EU": balão de comentário ao lado
export const EuBubble: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const a0 = MK.eu2 - 2;
  const out = MK.famosa2 - 6;
  if (f < a0 || f > out + 8) return null;
  const p = pop(f, a0, fps) * interpolate(f, [out, out + 8], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: 700, top: 1110, scale: String(p), transformOrigin: '20% 100%', rotate: '-4deg'}}>
      <svg width={300} height={190} viewBox="0 0 300 190">
        <path d="M30 10 H270 A22 22 0 0 1 292 32 V118 A22 22 0 0 1 270 140 H92 L48 180 V140 H30 A22 22 0 0 1 8 118 V32 A22 22 0 0 1 30 10 Z" fill={C.gold} />
        <text x={150} y={102} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={76} fill={C.ink}>EU</text>
      </svg>
    </div>
  );
};

// "emagrecer não é só perder peso"
export const EmagrecerCard: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = MK.emagrecer5 - 2;
  const out = MK.proteina5 - 8;
  if (f < a0 || f > out + 8) return null;
  const a = interpolate(f, [a0, a0 + 9], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)}) * interpolate(f, [out, out + 8], [1, 0], clamp);
  const ne = interpolate(f, [MK.peso5 - 4, MK.peso5 + 6], [0, 1], clamp);
  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <div style={{position: 'absolute', top: 250, opacity: a, translate: `0 ${(1 - a) * -16}px`, padding: '20px 34px 16px', borderRadius: 24, background: 'rgba(10,14,12,0.86)', border: `2px solid ${C.gold}`, fontFamily: SANS, fontWeight: 900, fontSize: 52, color: C.white, whiteSpace: 'nowrap', boxShadow: '0 16px 40px rgba(0,0,0,0.35)'}}>
        EMAGRECER <span style={{color: C.gold, opacity: ne}}>≠</span> <span style={{opacity: ne}}>PERDER PESO</span>
      </div>
    </AbsoluteFill>
  );
};

// "na segunda parte"
export const Parte2: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const a0 = MK.segunda5 - 2;
  const out = MK.gostou5 - 4;
  if (f < a0 || f > out + 8) return null;
  const p = pop(f, a0, fps) * interpolate(f, [out, out + 8], [1, 0], clamp);
  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <div style={{position: 'absolute', top: 260, scale: String(p), padding: '16px 34px 12px', borderRadius: 999, background: C.gold, fontFamily: SANS, fontWeight: 900, fontSize: 48, color: C.ink, letterSpacing: '0.04em'}}>
        PARTE 2 <span style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400}}>em breve</span>
      </div>
    </AbsoluteFill>
  );
};

// CTA gravado: comenta, curte e compartilha
const ICONS = {
  comment: 'M9 9 H39 A4 4 0 0 1 43 13 V30 A4 4 0 0 1 39 34 H22 L12 42 V34 H9 A4 4 0 0 1 5 30 V13 A4 4 0 0 1 9 9 Z',
  heart: 'M24 41 C10 31 4 24 4 16 C4 10 9 6 14 6 C18 6 22 8 24 12 C26 8 30 6 34 6 C39 6 44 10 44 16 C44 24 38 31 24 41 Z',
  share: 'M43 5 L5 20 L20 27 L27 43 Z M20 27 L43 5',
};
export const CtaIcons: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < MK.comenta5 - 4 || f > SPEECH_END + 2) return null;
  const items: [string, number, boolean][] = [
    [ICONS.comment, MK.comenta5, false],
    [ICONS.heart, MK.curte5, true],
    [ICONS.share, MK.compartilha5, false],
  ];
  return (
    <AbsoluteFill>
      {items.map(([d, at, fill], i) => {
        if (f < at - 2) return null;
        const p = pop(f, at - 2, fps);
        const active = i === items.length - 1 ? f >= at - 2 : f < items[i + 1][1] - 2;
        const col = active ? C.gold : C.white;
        return (
          <div key={i} style={{position: 'absolute', left: 360 + i * 180 - 64, top: 1180 - 64, width: 128, height: 128, borderRadius: 128, background: 'rgba(10,14,12,0.6)', border: `3px solid ${active ? C.gold : 'rgba(255,255,255,0.5)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', scale: String(p)}}>
            <svg width={64} height={64} viewBox="0 0 48 48">
              <path d={d} fill={fill && active ? col : 'none'} stroke={col} strokeWidth={3.4} strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// "isso vai salvar o seu resultado"
export const ResultadoChip: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const a0 = MK.resultado2 - 3;
  const out = MK.comenta2 + 2;
  if (f < a0 || f > out + 8) return null;
  const p = pop(f, a0, fps) * interpolate(f, [out, out + 8], [1, 0], clamp);
  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <div style={{position: 'absolute', top: 240, scale: String(p), display: 'flex', alignItems: 'center', gap: 14, padding: '14px 30px 12px 18px', borderRadius: 999, background: 'rgba(10,14,12,0.86)', border: `2px solid ${C.gold}`, fontFamily: SANS, fontWeight: 900, fontSize: 44, color: C.white, whiteSpace: 'nowrap'}}>
        <svg width={52} height={52} viewBox="0 0 48 48">
          <path d="M24 4 L40 10 V22 C40 32 33 40 24 44 C15 40 8 32 8 22 V10 Z" fill={C.gold} />
          <path d="M16 24 L22 30 L33 18" fill="none" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        SEU <span style={{color: C.gold}}>RESULTADO</span>
      </div>
    </AbsoluteFill>
  );
};

// "Parece perfeito, não é mesmo? Mas calma, o problema está escondido aí."
export const PerfeitoChip: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const a0 = MK.parece3 - 2;
  const flip = MK.calma3 - 3;
  const out = MK.voce3b - 6;
  if (f < a0 || f > out + 8) return null;
  const p = pop(f, a0, fps) * interpolate(f, [out, out + 8], [1, 0], clamp);
  const fl = interpolate(f, [flip, flip + 8], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const shake = f > MK.escondido3 && f < MK.escondido3 + 10 ? Math.sin(f * 2.4) * 4 : 0;
  const warn = fl > 0.5;
  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <div
        style={{
          position: 'absolute',
          top: 240,
          scale: String(p),
          translate: `${shake}px 0`,
          transform: `rotateX(${(warn ? 1 - fl : fl) * 90}deg)`,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '14px 30px 12px 18px',
          borderRadius: 999,
          background: warn ? C.red : C.gold,
          fontFamily: SANS,
          fontWeight: 900,
          fontSize: 44,
          color: C.ink,
          whiteSpace: 'nowrap',
          boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
        }}
      >
        {warn ? (
          <svg width={50} height={50} viewBox="0 0 48 48">
            <path d="M24 6 L44 40 H4 Z" fill="none" stroke={C.ink} strokeWidth={4.5} strokeLinejoin="round" />
            <path d="M24 19 V29" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" />
            <circle cx={24} cy={34.5} r={2.6} fill={C.ink} />
          </svg>
        ) : (
          <svg width={50} height={50} viewBox="0 0 48 48">
            <circle cx={24} cy={24} r={20} fill="none" stroke={C.ink} strokeWidth={4.5} />
            <path d="M15 24 L21 30 L33 18" fill="none" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {warn ? 'MAS CALMA…' : 'PARECE PERFEITO'}
      </div>
    </AbsoluteFill>
  );
};
