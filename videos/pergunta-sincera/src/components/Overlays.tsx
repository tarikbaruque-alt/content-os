import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {MK, TOTAL} from '../timeline';
import {C, clamp, COND, GRAD, SANS} from '../theme';
import {Chip, fadeOut, Icon, pop} from './Kit';

// Elementos sobre o rosto (frame global).
const Win: React.FC<{a: number; b: number; children: (f: number) => React.ReactNode}> = ({a, b, children}) => {
  const f = useCurrentFrame();
  if (f < a || f > b) return null;
  return <>{children(f)}</>;
};
const gradText: React.CSSProperties = {background: GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'};

// Headline já no primeiro quadro (vale como capa): "PERGUNTA SINCERA"
export const HookTitle: React.FC = () => (
  <Win a={0} b={MK.i_voces + 6}>
    {(f) => {
      const o = fadeOut(f, MK.i_voces - 6, 8);
      const l1 = interpolate(f, [0, 8], [0.96, 1], {...clamp, easing: Easing.out(Easing.cubic)});
      const ls = interpolate(f, [0, 70], [0.005, 0.02], clamp);
      return (
        <AbsoluteFill style={{opacity: o}}>
          <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(7,10,18,0) 48%, rgba(7,10,18,0.78) 64%, rgba(7,10,18,0.9) 100%)'}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 1068, display: 'flex', flexDirection: 'column', alignItems: 'center', scale: String(l1)}}>
            <div style={{padding: '10px 30px 8px', borderRadius: 14, background: GRAD, fontFamily: COND, fontSize: 58, letterSpacing: '0.05em', color: C.ink, rotate: '-2deg', boxShadow: '0 12px 34px rgba(0,0,0,0.45)'}}>PERGUNTA SINCERA</div>
            <div style={{marginTop: 26, textAlign: 'center', fontFamily: COND, fontSize: 112, lineHeight: 1.08, letterSpacing: `${ls}em`, color: C.white, textShadow: '0 6px 26px rgba(0,0,0,0.6)'}}>
              <div>O QUE FALTA PRA VOCÊ</div>
              <div>
                COMEÇAR NO <span style={gradText}>DIGITAL?</span>
              </div>
            </div>
          </div>
        </AbsoluteFill>
      );
    }}
  </Win>
);

// "a pergunta volta"
export const PerguntaVolta: React.FC = () => (
  <Win a={MK.pergunta - 4} b={MK.i_ese}>
    {(f) => {
      const p = pop(f, MK.pergunta - 4, 13) * fadeOut(f, MK.i_ese - 8, 7);
      const rot = interpolate(f, [MK.pergunta - 4, MK.pergunta + 20], [0, -360], {...clamp, easing: Easing.out(Easing.cubic)});
      return (
        <AbsoluteFill style={{alignItems: 'center'}}>
          <div style={{position: 'absolute', top: 232, scale: String(p)}}>
            <Chip tone="gold" style={{fontSize: 34, fontWeight: 900}}>
              <div style={{rotate: `${rot}deg`}}>
                <Icon n="loop" size={36} color={C.ink} w={4.6} />
              </div>
              A pergunta volta
            </Chip>
          </div>
        </AbsoluteFill>
      );
    }}
  </Win>
);

// "o que que falta?" — tipografia grande no lugar da legenda
export const OQueFalta: React.FC = () => (
  <Win a={MK.i_falta - 3} b={MK.i_qual + 4}>
    {(f) => {
      const out = fadeOut(f, MK.i_qual - 4, 6);
      const p1 = pop(f, MK.i_falta - 3, 13);
      const p2 = pop(f, MK.i_falta + 7, 11);
      const grow = interpolate(f, [MK.i_falta - 3, MK.i_qual], [0.96, 1.05], clamp);
      return (
        <AbsoluteFill style={{opacity: out}}>
          <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(7,10,18,0) 50%, rgba(7,10,18,0.8) 68%, rgba(7,10,18,0.9) 100%)', opacity: p1}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 1150, textAlign: 'center', fontFamily: COND, lineHeight: 1.0, scale: String(grow)}}>
            <div style={{fontSize: 110, color: C.white, opacity: Math.min(1, p1 * 1.4), translate: `0 ${(1 - p1) * 24}px`, letterSpacing: '0.02em'}}>O QUE</div>
            <div style={{fontSize: 230, ...gradText, scale: String(0.7 + p2 * 0.3), opacity: Math.min(1, p2 * 1.4), letterSpacing: '0.02em', filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.6))'}}>FALTA?</div>
          </div>
        </AbsoluteFill>
      );
    }}
  </Win>
);

// "Me diga, que talvez eu possa vir ajudar vocês" — convite para comentar
export const MeDiga: React.FC = () => (
  <Win a={MK.diga - 5} b={TOTAL}>
    {(f) => {
      const p = pop(f, MK.diga - 5, 13);
      const p2 = pop(f, MK.talvez - 2, 13);
      const b = Math.sin(f / 4) * 10;
      return (
        <AbsoluteFill>
          <div style={{position: 'absolute', left: 0, right: 0, top: 232, display: 'flex', justifyContent: 'center', scale: String(p)}}>
            <Chip tone="gold" style={{fontSize: 36, fontWeight: 900, padding: '14px 30px 12px'}}>
              <Icon n="comment" size={38} color={C.ink} w={4.4} />
              Me diga nos comentários
            </Chip>
          </div>
          {/* seta apontando para o botão de comentar do Instagram (lateral direita) */}
          <div style={{position: 'absolute', right: 150 - b, top: 1196, display: 'flex', alignItems: 'center', gap: 14, scale: String(p2), transformOrigin: '100% 50%', opacity: Math.min(1, p2 * 1.4)}}>
            <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 34, color: C.white, textShadow: '0 4px 16px rgba(0,0,0,0.7)', letterSpacing: '0.04em'}}>1, 2 OU 3?</div>
            <svg width={92} height={56} viewBox="0 0 92 56">
              <path d="M6 28 H80 M58 8 L82 28 L58 48" fill="none" stroke={C.gold} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </AbsoluteFill>
      );
    }}
  </Win>
);

export const OVERLAYS = [HookTitle, PerguntaVolta, OQueFalta, MeDiga];
