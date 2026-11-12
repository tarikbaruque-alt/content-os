import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {MK, SPEECH_END, TE} from '../timeline';
import {C, clamp, SERIF} from '../theme';
import {Star} from './Draw';

// Todos usam o frame global (montados em <Sequence from={0}>).

// ---------- "três estrelas" → "se foi uma…" (callback) ----------
export const StarsCallback: React.FC = () => {
  const f = useCurrentFrame();
  const t3 = MK.tres22;
  const u1 = MK.uma23;
  const pp = MK.parada23;
  if (f < t3 - 4 || f > SPEECH_END + 2) return null;
  const xs = [360, 540, 720];
  const lbl = interpolate(f, [pp - 2, pp + 8], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const end = interpolate(f, [SPEECH_END - 6, SPEECH_END], [1, 0], clamp);
  return (
    <AbsoluteFill style={{opacity: end}}>
      {xs.map((x, i) => {
        const p = interpolate(f, [t3 + i * 6, t3 + i * 6 + 9], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.8))});
        const gone = i === 1 ? 0 : interpolate(f, [u1 + (i === 0 ? 0 : 3), u1 + (i === 0 ? 0 : 3) + 9], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
        const center = i === 1 ? interpolate(f, [u1 + 6, u1 + 16], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)}) : 0;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - 55,
              top: 250 - 55 + gone * 40 + center * 6,
              opacity: 1 - gone,
              scale: String(1 + center * 0.15),
            }}
          >
            <Star size={110} p={p} glow={0.9} />
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 0, right: 0, top: 330, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 68, color: C.gold, textShadow: '0 4px 18px rgba(0,0,0,0.85), 0 2px 4px rgba(0,0,0,0.8)', opacity: lbl, translate: `0 ${(1 - lbl) * 10}px`}}>
        vale uma parada
      </div>
    </AbsoluteFill>
  );
};

// ---------- detalhe da calça jeans (discreto, ao lado) ----------
export const JeansSticker: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = MK.calca18 - 3;
  const snap = MK.fechando18 + 4;
  const out = TE(18) + 4;
  if (f < a0 || f > out + 8) return null;
  const a = interpolate(f, [a0, a0 + 8], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.6))}) * interpolate(f, [out, out + 8], [1, 0], clamp);
  const s = interpolate(f, [snap, snap + 4, snap + 10], [0, 1, 0], clamp);
  const ok = interpolate(f, [snap, snap + 6], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', left: 800, top: 1150, width: 200, height: 200, opacity: a, scale: String(0.7 + 0.3 * a), rotate: '8deg'}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 200, background: 'rgba(11,11,13,0.72)', border: `3px solid ${C.gold}`, boxShadow: '0 10px 30px rgba(0,0,0,0.45)'}} />
      <svg width={200} height={200} viewBox="0 0 200 200" style={{position: 'absolute', inset: 0}}>
        <g transform="translate(100 104)">
          <path d="M-42 -58 H42 L50 64 H14 L0 -6 L-14 64 H-50 Z" fill="#3D5E8C" stroke="#9FB7D6" strokeWidth={3} strokeLinejoin="round" />
          <path d="M-42 -42 H42" stroke="#9FB7D6" strokeWidth={3} />
          <path d="M0 -42 V-12" stroke="#C8D7EA" strokeWidth={2.5} strokeDasharray="4 4" />
          <circle cx={0} cy={-50} r={6 + 3 * s} fill={C.gold} />
        </g>
        <g opacity={ok} transform="translate(148 52)">
          <circle r={20} fill={C.gold} />
          <path d="M-9 0 L-3 6 L9 -7" fill="none" stroke={C.bg} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
};
