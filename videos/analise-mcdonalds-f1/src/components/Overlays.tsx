import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {MK, SECOND_TAKE_FROM, T} from '../timeline';
import {C, clamp, SANS, SERIF, TEXT_SHADOW} from '../theme';

const ease = (f: number, a: number, len = 10) => interpolate(f, [a, a + len], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});

// Todos os overlays usam o frame global (são montados em <Sequence from={0}>).
const useSp = (f: number, at: number, damping = 15) => {
  const {fps} = useVideoConfig();
  return spring({frame: f - at, fps, config: {damping, stiffness: 170, mass: 0.7}});
};

const Chip: React.FC<{children: React.ReactNode; gold?: boolean; p: number; style?: React.CSSProperties}> = ({children, gold, p, style}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      fontFamily: SANS,
      fontWeight: 800,
      fontSize: 36,
      letterSpacing: -0.5,
      padding: '14px 26px',
      borderRadius: 999,
      color: gold ? C.bg : C.white,
      backgroundColor: gold ? C.gold : 'rgba(11,11,13,0.78)',
      border: gold ? 'none' : '2px solid rgba(255,255,255,0.18)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
      opacity: p,
      scale: String(0.85 + 0.15 * p),
      transformOrigin: 'left center',
      ...style,
    }}
  >
    {children}
  </div>
);

// ---------- Abertura: selo da série ----------
export const HookKicker: React.FC = () => {
  const f = useCurrentFrame();
  const a = useSp(f, -4);
  const out = interpolate(f, [SECOND_TAKE_FROM - 6, SECOND_TAKE_FROM], [1, 0], clamp);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 420, background: 'linear-gradient(to bottom, rgba(11,11,13,0.75), rgba(11,11,13,0))'}} />
      <div style={{position: 'absolute', left: 70, top: 175, fontFamily: SANS, opacity: a, translate: `0 ${(1 - a) * 20}px`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, fontWeight: 800, fontSize: 26, letterSpacing: 4, color: C.gold}}>
          <div style={{width: 34, height: 3, backgroundColor: C.gold}} />
          ANÁLISE DE CAMPANHA
        </div>
        <div style={{marginTop: 10, fontWeight: 900, fontSize: 64, letterSpacing: -2, color: C.white, textShadow: TEXT_SHADOW}}>
          McDonald&apos;s <span style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, color: C.gold}}>×</span> Fórmula 1
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- "Mais uma logo na pista" → "oportunidade que ninguém via" ----------
export const LogoChips: React.FC = () => {
  const f = useCurrentFrame();
  const a = useSp(f, MK.logo - 3);
  const strike = ease(f, MK.oportunidade - 8, 8);
  const b = useSp(f, MK.oportunidade - 2);
  const out = interpolate(f, [T(5) - 5, T(5)], [1, 0], clamp);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <div style={{position: 'absolute', left: 70, top: 200}}>
        <Chip p={a} style={{position: 'relative', opacity: a * (1 - 0.5 * strike)}}>
          + 1 logo na pista
          <span style={{position: 'absolute', left: 18, right: 18, top: '50%', height: 5, borderRadius: 3, backgroundColor: C.red, transformOrigin: 'left', scale: `${strike} 1`}} />
        </Chip>
      </div>
      <div style={{position: 'absolute', left: 70, top: 300}}>
        <Chip p={b} gold>
          Oportunidade que ninguém via
        </Chip>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Tela cheia: 24 circuitos ----------
export const Counter24: React.FC = () => {
  const f = useCurrentFrame();
  const s0 = T(5);
  const a = ease(f, s0 + 2, 10);
  const n = Math.round(interpolate(f, [MK.circuitos24 - 4, MK.circuitos24 + 16], [1, 24], {...clamp, easing: Easing.out(Easing.cubic)}));
  const num = ease(f, MK.circuitos24 - 4, 6);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 70, top: 250, fontFamily: SANS, opacity: a}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, fontWeight: 800, fontSize: 26, letterSpacing: 4, color: C.gold}}>
          <div style={{width: 34, height: 3, backgroundColor: C.gold}} />A INVESTIGAÇÃO
        </div>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 20, marginTop: 6, opacity: num, translate: `0 ${(1 - num) * 16}px`}}>
          <div style={{fontWeight: 900, fontSize: 190, letterSpacing: -8, color: C.gold, lineHeight: 1, opacity: num, fontVariantNumeric: 'tabular-nums', width: 250}}>{n}</div>
          <div style={{fontWeight: 800, fontSize: 56, letterSpacing: -1.5, color: C.white, lineHeight: 1.05}}>
            circuitos
            <br />
            analisados
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Tela cheia: arcos dourados ----------
export const ArcosTitle: React.FC = () => {
  const f = useCurrentFrame();
  const a = ease(f, T(6) + 2, 10);
  const b = useSp(f, MK.arcos - 3);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 70, right: 70, top: 260, fontFamily: SANS}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, fontWeight: 800, fontSize: 26, letterSpacing: 4, color: C.gold, opacity: a}}>
          <div style={{width: 34, height: 3, backgroundColor: C.gold}} />O PADRÃO ESCONDIDO
        </div>
        <div style={{marginTop: 14, fontWeight: 800, fontSize: 64, letterSpacing: -2, color: C.white, opacity: a, lineHeight: 1.05}}>Curvas que lembram</div>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 120, letterSpacing: -2, color: C.gold, lineHeight: 1.05, opacity: b, translate: `0 ${(1 - b) * 20}px`}}>os arcos dourados</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Golden Zone / oferta no app ----------
export const ZoneChips: React.FC = () => {
  const f = useCurrentFrame();
  const a = useSp(f, MK.golden13 - 3);
  const b = useSp(f, MK.oferta13 - 2);
  const out = interpolate(f, [T(14) - 5, T(14)], [1, 0], clamp);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <div style={{position: 'absolute', left: 70, top: 200}}>
        <Chip p={a} gold>
          GOLDEN ZONE
        </Chip>
      </div>
      <div style={{position: 'absolute', left: 70, top: 300}}>
        <Chip p={b}>Oferta liberada no app</Chip>
      </div>
    </AbsoluteFill>
  );
};

// ---------- CTA ----------
const Plane: React.FC = () => (
  <svg width={46} height={46} viewBox="0 0 48 48" fill="none">
    <path d="M44 4 L20 28 M44 4 L30 44 L20 28 L4 18 Z" stroke={C.bg} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
  </svg>
);
export const CtaPill: React.FC = () => {
  const f = useCurrentFrame();
  const a = useSp(f, MK.direct21 - 4, 13);
  const pulse = 1 + 0.03 * Math.sin(Math.max(0, f - MK.direct21) / 4);
  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <div style={{position: 'absolute', top: 1215, scale: String(pulse)}}>
        <Chip p={a} gold style={{fontSize: 44, padding: '18px 34px', transformOrigin: 'center'}}>
          <Plane /> Me chama no direct
        </Chip>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Encerramento ----------
export const EndCard: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame();
  const a = ease(f, from, 10);
  const b = useSp(f, from + 6);
  return (
    <AbsoluteFill style={{backgroundColor: C.bg, opacity: a, alignItems: 'center', justifyContent: 'center', fontFamily: SANS}}>
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, rgba(255,199,44,0.16) 0%, rgba(255,199,44,0) 55%)'}} />
      <div style={{textAlign: 'center', translate: `0 ${(1 - b) * 20}px`, opacity: b}}>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 14, fontWeight: 800, fontSize: 26, letterSpacing: 4, color: C.gold}}>
          <div style={{width: 34, height: 3, backgroundColor: C.gold}} />
          ANÁLISE DE CAMPANHA
          <div style={{width: 34, height: 3, backgroundColor: C.gold}} />
        </div>
        <div style={{marginTop: 26, fontWeight: 900, fontSize: 92, letterSpacing: -3, color: C.white, lineHeight: 1}}>Atenção</div>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 150, color: C.gold, lineHeight: 1}}>vira ação.</div>
        <div style={{marginTop: 40, fontWeight: 700, fontSize: 38, color: C.white, opacity: 0.85}}>Me chama no direct.</div>
      </div>
    </AbsoluteFill>
  );
};
