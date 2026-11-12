import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, clamp, SANS, SHADOW_BIG} from '../theme';

// ================= Identidade "ATRÁS DO RÓTULO" (reutilizável nos próximos episódios) =================
export const Lockup: React.FC<{sc?: number; sweep?: number; align?: 'left' | 'center'}> = ({sc = 1, sweep = -1, align = 'center'}) => (
  <div style={{display: 'inline-flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 16 * sc, fontFamily: SANS, fontWeight: 700, fontSize: 34 * sc, letterSpacing: '0.46em', color: C.white, paddingLeft: '0.46em'}}>
      <div style={{width: 46 * sc, height: 2 * sc, background: C.gold}} />
      ATRÁS DO
      <div style={{width: 46 * sc, height: 2 * sc, background: C.gold}} />
    </div>
    <div
      style={{
        position: 'relative',
        fontFamily: SANS,
        fontWeight: 900,
        fontSize: 150 * sc,
        lineHeight: 0.95,
        letterSpacing: '-0.01em',
        backgroundImage: `linear-gradient(100deg, ${C.goldDeep} 0%, ${C.gold} 30%, #FFF0C2 ${sweep >= 0 ? 30 + sweep * 60 : 45}%, ${C.gold} ${sweep >= 0 ? 40 + sweep * 60 : 60}%, ${C.goldDeep} 100%)`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.5))',
      }}
    >
      RÓTULO
    </div>
  </div>
);

// Vinheta: um rótulo de papel cobre o nome e é descolado, revelando o que existe por trás dele.
export const Vinheta: React.FC<{episode?: string}> = ({episode}) => {
  const f = useCurrentFrame();
  const inA = interpolate(f, [0, 5], [0, 1], clamp);
  const peel = interpolate(f, [7, 25], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const sweep = interpolate(f, [20, 46], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)});
  const titleIn = interpolate(f, [10, 26], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const epIn = interpolate(f, [26, 36], [0, 1], clamp);
  const light = interpolate(f, [0, 62], [-20, 20]);
  return (
    <AbsoluteFill style={{backgroundColor: C.bg, opacity: inA}}>
      {/* luz sutil de cima e brilho que atravessa a cena */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 30%, rgba(242,193,78,0.16) 0%, rgba(242,193,78,0) 55%)'}} />
      <AbsoluteFill style={{background: `linear-gradient(${105 + light}deg, rgba(255,255,255,0) 40%, rgba(255,240,200,0.06) 50%, rgba(255,255,255,0) 60%)`}} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{position: 'relative', perspective: 1400}}>
          <div style={{opacity: 0.15 + 0.85 * titleIn, scale: String(0.96 + 0.04 * titleIn), filter: `blur(${(1 - titleIn) * 6}px)`}}>
            <Lockup sc={1.05} sweep={sweep} />
          </div>
          {/* o rótulo */}
          <div
            style={{
              position: 'absolute',
              left: -60,
              right: -60,
              top: -50,
              bottom: -50,
              transformOrigin: 'left center',
              transform: `rotateY(${-peel * 112}deg) translateX(${peel * -40}px)`,
              opacity: interpolate(peel, [0.75, 1], [1, 0], clamp),
              backfaceVisibility: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 18,
                background: 'linear-gradient(135deg, #F3EAD6 0%, #E4D5B5 100%)',
                boxShadow: `0 ${20 + peel * 30}px ${50 + peel * 40}px rgba(0,0,0,${0.45 + peel * 0.2})`,
                border: '3px solid #C9B48A',
                overflow: 'hidden',
              }}
            >
              <div style={{position: 'absolute', inset: 14, border: '2px solid rgba(59,47,34,0.35)', borderRadius: 10}} />
              <div style={{position: 'absolute', left: 0, right: 0, top: '50%', translate: '0 -50%', textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 44, letterSpacing: '0.3em', color: 'rgba(59,47,34,0.75)'}}>
                MARCA
              </div>
              <div style={{position: 'absolute', left: 60, right: 60, bottom: 40, height: 34, backgroundImage: 'repeating-linear-gradient(90deg, rgba(59,47,34,0.7) 0 3px, transparent 3px 7px, rgba(59,47,34,0.7) 7px 8px, transparent 8px 13px)'}} />
              <div style={{position: 'absolute', inset: 0, background: `linear-gradient(90deg, rgba(0,0,0,0) 40%, rgba(0,0,0,${0.35 * peel}) 100%)`}} />
            </div>
          </div>
        </div>
        {episode ? (
          <div style={{marginTop: 46, fontFamily: SANS, fontWeight: 700, fontSize: 30, letterSpacing: '0.3em', color: 'rgba(246,244,239,0.8)', opacity: epIn, textShadow: SHADOW_BIG}}>{episode}</div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
