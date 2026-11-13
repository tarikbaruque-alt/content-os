import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {MK, T, TOTAL} from '../timeline';
import {C, clamp, GRAD, SANS} from '../theme';
import {Avatar, Chip, ease, fadeOut, Icon, ICON, MetaLogo, pop} from './Kit';

// Elementos sobre o rosto (frame global).
const Win: React.FC<{a: number; b: number; children: (f: number) => React.ReactNode}> = ({a, b, children}) => {
  const f = useCurrentFrame();
  if (f < a || f > b) return null;
  return <>{children(f)}</>;
};

const gradText: React.CSSProperties = {background: GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'};

// Manchete no primeiro quadro (vale como capa) — sai quando a manchete oficial entra
export const HookTitle: React.FC = () => (
  <Win a={0} b={MK.meta1}>
    {(f) => {
      const o = fadeOut(f, MK.meta1 - 9, 7);
      const ls = interpolate(f, [0, 60], [0, 0.015], clamp);
      return (
        <AbsoluteFill style={{opacity: o}}>
          <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(6,10,21,0.78) 0%, rgba(6,10,21,0.35) 22%, rgba(6,10,21,0) 34%)'}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 236, textAlign: 'center', fontFamily: SANS, fontWeight: 900, lineHeight: 1.02, letterSpacing: `${ls}em`, textShadow: '0 6px 24px rgba(0,0,0,0.45)'}}>
            <div style={{fontSize: 70, color: C.white}}>A META DEU ESPERANÇA</div>
            <div style={{fontSize: 70, color: C.white}}>
              AOS <span style={{...gradText, filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.5))'}}>MEROS MORTAIS!</span>
            </div>
          </div>
        </AbsoluteFill>
      );
    }}
  </Win>
);

// "com 105 seguidores" — número real, dito por ele
export const Followers105: React.FC = () => (
  <Win a={MK.n105 - 3} b={MK.meta1}>
    {(f) => {
      const p = pop(f, MK.n105 - 3, 14) * fadeOut(f, MK.meta1 - 8, 6);
      return (
        <AbsoluteFill style={{alignItems: 'center'}}>
          <div
            style={{
              position: 'absolute',
              top: 1290,
              scale: String(p),
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              padding: '18px 34px 18px 20px',
              borderRadius: 28,
              background: 'rgba(8,12,26,0.78)',
              border: '1.5px solid rgba(255,255,255,0.14)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{padding: 4, borderRadius: 80, background: 'linear-gradient(45deg, #FEDA75, #FA7E1E, #D62976, #962FBF, #4F5BD5)'}}>
              <div style={{padding: 3, borderRadius: 80, background: '#0A0F1E'}}>
                <Avatar size={64} hue={215} />
              </div>
            </div>
            <div style={{fontFamily: SANS, color: C.white, lineHeight: 1}}>
              <div style={{fontWeight: 900, fontSize: 56}}>105</div>
              <div style={{fontWeight: 600, fontSize: 24, color: 'rgba(255,255,255,0.7)', marginTop: 4}}>seguidores</div>
            </div>
          </div>
        </AbsoluteFill>
      );
    }}
  </Win>
);

// "eu tenho uma boa notícia"
export const BoaNoticia: React.FC = () => (
  <Win a={MK.boa14 - 4} b={T(15)}>
    {(f) => {
      const p = pop(f, MK.boa14 - 4, 12) * fadeOut(f, T(15) - 8, 6);
      const sw = Math.sin((f - MK.boa14) / 2.2) * interpolate(f, [MK.boa14, MK.boa14 + 24], [18, 0], clamp);
      return (
        <AbsoluteFill style={{alignItems: 'center'}}>
          <div style={{position: 'absolute', top: 250, scale: String(p)}}>
            <Chip tone="blue" style={{fontSize: 40, fontWeight: 900, padding: '14px 30px 12px 22px'}}>
              <svg width={44} height={44} viewBox="0 0 48 48" style={{rotate: `${sw}deg`, transformOrigin: '50% 10%'}}>
                <path d="M24 6 C16 6 12 12 12 20 V30 L8 36 H40 L36 30 V20 C36 12 32 6 24 6 Z" fill="#fff" />
                <circle cx={24} cy={40} r={4} fill="#fff" />
              </svg>
              Boa notícia
            </Chip>
          </div>
        </AbsoluteFill>
      );
    }}
  </Win>
);

// "conta pequena não é (considerada) conta fraca" — tipografia que ganha espaço
export const ContaPequena: React.FC = () => (
  <Win a={MK.conta16 - 4} b={T(17)}>
    {(f) => {
      const out = fadeOut(f, T(17) - 7, 6);
      const grow = interpolate(f, [MK.conta16 - 4, T(17)], [0.95, 1.05], {...clamp, easing: Easing.out(Easing.quad)});
      const ls = interpolate(f, [MK.conta16 - 4, T(17)], [-0.01, 0.035], clamp);
      const l1 = pop(f, MK.conta16 - 3, 14);
      const l2 = f >= MK.nao16 - 2 ? pop(f, MK.nao16 - 2, 14) : 0;
      const l3 = f >= MK.conta16b - 2 ? pop(f, MK.conta16b - 2, 14) : 0;
      const dark = interpolate(f, [MK.conta16 - 4, MK.conta16 + 6], [0, 1], clamp) * out;
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{opacity: dark, background: 'linear-gradient(to bottom, rgba(6,10,21,0) 46%, rgba(6,10,21,0.82) 66%, rgba(6,10,21,0.88) 100%)'}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 1170, textAlign: 'center', fontFamily: SANS, fontWeight: 900, lineHeight: 1.04, letterSpacing: `${ls}em`, scale: String(grow), opacity: out}}>
            <div style={{fontSize: 96, color: C.white, opacity: l1, translate: `0 ${(1 - l1) * 20}px`}}>CONTA PEQUENA</div>
            <div style={{fontSize: 60, color: C.gold, opacity: l2, translate: `0 ${(1 - l2) * 20}px`, margin: '8px 0'}}>NÃO É</div>
            <div style={{fontSize: 96, opacity: l3, translate: `0 ${(1 - l3) * 20}px`}}>
              <span style={{color: C.white}}>CONTA </span>
              <span style={{color: C.red}}>FRACA</span>
            </div>
          </div>
        </AbsoluteFill>
      );
    }}
  </Win>
);

// "Ô, Meta" — símbolo discreto no alto da tela
export const MetaAcima: React.FC = () => (
  <Win a={MK.meta18 - 4} b={T(19) + 2}>
    {(f) => {
      const p = pop(f, MK.meta18 - 4, 14) * fadeOut(f, T(19) - 6, 7);
      const fy = Math.sin(f / 12) * 6;
      return (
        <AbsoluteFill style={{alignItems: 'center'}}>
          <div style={{position: 'absolute', top: 250 + fy, scale: String(p), display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{position: 'absolute', left: -60, top: -50, width: 300, height: 220, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(76,155,255,0.45), rgba(76,155,255,0))'}} />
            <MetaLogo h={86} variant="simbolo" />
          </div>
        </AbsoluteFill>
      );
    }}
  </Win>
);

// "É… visualizou e não respondeu."
export const Visualizou: React.FC = () => (
  <Win a={MK.visualizou21 - 3} b={T(22)}>
    {(f) => {
      const out = fadeOut(f, T(22) - 7, 6);
      const p1 = pop(f, MK.visualizou21 - 3, 13);
      const p2 = f >= MK.nao21 - 2 ? pop(f, MK.nao21 - 2, 12) : 0;
      return (
        <AbsoluteFill style={{alignItems: 'center', opacity: out}}>
          <div style={{position: 'absolute', top: 240, scale: String(p1)}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 16, padding: '16px 34px 14px', borderRadius: 999, background: 'rgba(8,12,26,0.82)', border: '1.5px solid rgba(255,255,255,0.14)', fontFamily: SANS, fontWeight: 900, fontSize: 52, color: C.white, letterSpacing: '0.02em'}}>
              VISUALIZOU
              <svg width={64} height={40} viewBox="0 0 64 40">
                <path d="M4 21 L14 31 L34 8" fill="none" stroke={C.gold} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
                <path d="M26 27 L30 31 L52 8" fill="none" stroke={C.gold} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div style={{position: 'absolute', top: 1265, scale: String(p2), opacity: Math.min(1, p2 * 1.4), fontFamily: SANS, fontWeight: 900, fontSize: 92, color: C.red, letterSpacing: '0.01em', textShadow: '0 6px 26px rgba(0,0,0,0.55)'}}>
            NÃO RESPONDEU
          </div>
        </AbsoluteFill>
      );
    }}
  </Win>
);

// "Manda esse vídeo pra aquele amigo..." — ícone de envio animado
export const Enviar: React.FC = () => (
  <Win a={MK.manda23 - 3} b={T(24)}>
    {(f) => {
      const p = pop(f, MK.manda23 - 3, 14) * fadeOut(f, T(24) - 8, 7);
      const sel = f >= MK.amigo23 - 2 ? pop(f, MK.amigo23 - 2, 12) : 0;
      const sad = f >= MK.desanimado23 - 2 ? pop(f, MK.desanimado23 - 2, 12) : 0;
      const fly = interpolate(f, [MK.seguidores23 + 4, MK.seguidores23 + 22], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
      const wig = Math.sin(f / 4) * 6 * (1 - fly);
      const hues = [20, 200, 290, 140];
      return (
        <AbsoluteFill style={{alignItems: 'center'}}>
          <div style={{position: 'absolute', top: 1140, width: 800, scale: String(p), padding: '22px 30px 24px', borderRadius: 34, background: 'rgba(12,17,32,0.9)', border: '1.5px solid rgba(255,255,255,0.12)', boxShadow: '0 20px 50px rgba(0,0,0,0.45)'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, color: C.white}}>Enviar para</div>
              <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '10px 22px', borderRadius: 999, background: sel > 0.5 ? GRAD : 'rgba(255,255,255,0.12)', fontFamily: SANS, fontWeight: 800, fontSize: 26, color: '#fff'}}>
                <div style={{translate: `${fly * 600}px ${-fly * 300}px`, rotate: `${wig}deg`, opacity: 1 - fly * 0.6}}>
                  <Icon d={ICON.send} size={34} color="#fff" w={3.6} />
                </div>
                Enviar
              </div>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 20, padding: '0 10px'}}>
              {hues.map((h, i) => {
                const me = i === 1;
                return (
                  <div key={i} style={{position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
                    <Avatar size={104} hue={h} ring={me && sel > 0 ? C.gold : undefined} ringW={5} />
                    {me ? (
                      <div style={{position: 'absolute', right: -6, top: 66, width: 40, height: 40, borderRadius: 40, background: C.gold, scale: String(sel), display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #0C1120'}}>
                        <svg width={24} height={24} viewBox="0 0 48 48">
                          <path d="M11 25 L20 34 L37 15" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    ) : null}
                    {me ? (
                      <svg width={54} height={54} viewBox="0 0 54 54" style={{position: 'absolute', left: -14, top: -16, scale: String(sad)}}>
                        <circle cx={27} cy={27} r={24} fill="#FFC94D" stroke="#0C1120" strokeWidth={3} />
                        <circle cx={19} cy={23} r={3.2} fill="#0C1120" />
                        <circle cx={35} cy={23} r={3.2} fill="#0C1120" />
                        <path d="M17 39 Q27 31 37 39" fill="none" stroke="#0C1120" strokeWidth={3.4} strokeLinecap="round" />
                      </svg>
                    ) : null}
                    <div style={{width: 80, height: 12, borderRadius: 6, background: me && sel > 0 ? C.gold : 'rgba(255,255,255,0.35)'}} />
                  </div>
                );
              })}
            </div>
          </div>
        </AbsoluteFill>
      );
    }}
  </Win>
);

// "Me segue" — botão Seguir → Seguindo
export const MeSegue: React.FC = () => (
  <Win a={MK.segue24 - 6} b={MK.meta24 + 6}>
    {(f) => {
      const p = pop(f, MK.segue24 - 6, 13) * fadeOut(f, MK.meta24, 7);
      const tap = MK.segue24 + 8;
      const done = f >= tap + 3;
      const ripple = interpolate(f, [tap, tap + 14], [0, 1], ease);
      const press = f >= tap && f < tap + 4 ? 0.94 : 1;
      return (
        <AbsoluteFill style={{alignItems: 'center'}}>
          <div style={{position: 'absolute', top: 232, scale: String(p), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
            <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 116, lineHeight: 1, letterSpacing: '0.01em', ...gradText, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.55))'}}>ME SEGUE</div>
            <div style={{position: 'relative', scale: String(press)}}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '16px 56px',
                  borderRadius: 18,
                  background: done ? 'rgba(255,255,255,0.16)' : '#0095F6',
                  fontFamily: SANS,
                  fontWeight: 800,
                  fontSize: 38,
                  color: '#fff',
                  border: done ? '1.5px solid rgba(255,255,255,0.3)' : '1.5px solid transparent',
                }}
              >
                {done ? 'Seguindo' : 'Seguir'}
                {done ? (
                  <svg width={30} height={30} viewBox="0 0 48 48">
                    <path d="M11 25 L20 34 L37 15" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </div>
              {ripple > 0 && ripple < 1 ? (
                <div style={{position: 'absolute', left: '62%', top: '50%', width: 160, height: 160, marginLeft: -80, marginTop: -80, borderRadius: 160, border: '4px solid #fff', scale: String(0.2 + ripple), opacity: 1 - ripple}} />
              ) : null}
            </div>
          </div>
        </AbsoluteFill>
      );
    }}
  </Win>
);

// "vamo pra cima!" — setas subindo, corte limpo
export const PraCima: React.FC = () => (
  <Win a={MK.vamo24 - 2} b={TOTAL}>
    {(f) => {
      const p = pop(f, MK.vamo24 - 2, 12);
      return (
        <AbsoluteFill style={{alignItems: 'center'}}>
          <div style={{position: 'absolute', top: 1180, scale: String(p)}}>
            {[0, 1, 2].map((k) => {
              const t = ((f - MK.vamo24 + k * 6) % 18) / 18;
              return (
                <svg key={k} width={120} height={70} viewBox="0 0 120 70" style={{position: 'absolute', left: -60, top: -t * 120 + k * 0, opacity: Math.sin(t * Math.PI)}}>
                  <path d="M14 58 L60 14 L106 58" fill="none" stroke={k === 1 ? C.purple : C.gold} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              );
            })}
          </div>
        </AbsoluteFill>
      );
    }}
  </Win>
);

export const OVERLAYS = [HookTitle, Followers105, BoaNoticia, ContaPequena, MetaAcima, Visualizou, Enviar, MeSegue, PraCima];
