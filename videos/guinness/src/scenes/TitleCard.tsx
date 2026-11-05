import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {FilmLook} from '../components/FilmLook';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Abertura: rótulo vintage "Atrás do Rótulo" já visível no 1º quadro (serve de miniatura).
// Em exitAt ele avança para a câmera e revela o apresentador.
export const TitleCard: React.FC<{exitAt?: number; episode?: string}> = ({exitAt = 36, episode = 'GUINNESS'}) => {
  const frame = useCurrentFrame();
  const settle = interpolate(frame, [0, 10], [1.04, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const exit = interpolate(frame, [exitAt, exitAt + 12], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  const labelScale = settle * (1 + 1.8 * exit);
  const labelOp = interpolate(frame, [exitAt + 4, exitAt + 12], [1, 0], clamp);
  const bgOp = interpolate(frame, [exitAt + 2, exitAt + 12], [1, 0], clamp);
  const sweep = interpolate(frame, [4, 26], [-40, 140], clamp);
  const ribbon = interpolate(frame, [0, 8], [0.92, 1], {...clamp, easing: Easing.out(Easing.back(2))});

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{opacity: bgOp, backgroundColor: C.black, overflow: 'hidden'}}>
        <Img
          src={staticFile('images/pub.webp')}
          style={{position: 'absolute', inset: -60, width: 1200, height: 2040, objectFit: 'cover', filter: 'sepia(0.6) blur(18px) brightness(0.32)'}}
        />
        <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 40%, rgba(242,193,78,0.22) 0%, rgba(0,0,0,0) 55%)'}} />
        <FilmLook grain={0.18} vignette={0.7} seed="title" />
      </AbsoluteFill>

      <AbsoluteFill style={{alignItems: 'center', opacity: labelOp, filter: `blur(${exit * 8}px)`}}>
        <div style={{position: 'absolute', top: 250, width: 840, height: 1000, scale: String(labelScale)}}>
          <svg width={840} height={1000} viewBox="0 0 840 1000" style={{position: 'absolute', inset: 0}}>
            <defs>
              <radialGradient id="lab" cx="50%" cy="42%" r="60%">
                <stop offset="0%" stopColor="#2a2016" />
                <stop offset="100%" stopColor="#0f0b07" />
              </radialGradient>
              <path id="arcTop" d="M 150 500 A 270 350 0 0 1 690 500" />
              <path id="arcBottom" d="M 170 760 A 330 410 0 0 0 670 760" />
              <clipPath id="labClip">
                <ellipse cx={420} cy={500} rx={410} ry={490} />
              </clipPath>
            </defs>
            <ellipse cx={420} cy={500} rx={410} ry={490} fill="url(#lab)" stroke={C.gold} strokeWidth={8} />
            <ellipse cx={420} cy={500} rx={384} ry={464} fill="none" stroke={C.gold} strokeWidth={2.5} />
            <ellipse cx={420} cy={500} rx={366} ry={446} fill="none" stroke={C.gold} strokeWidth={2} strokeDasharray="2 10" strokeLinecap="round" />
            <text fill={C.gold} fontFamily={F.fell} fontSize={46} letterSpacing={10} textAnchor="middle">
              <textPath href="#arcTop" startOffset="50%">★ O QUADRO ★</textPath>
            </text>
            <text fill={C.gold} fontFamily={F.fell} fontSize={27} letterSpacing={4} textAnchor="middle" opacity={0.9}>
              <textPath href="#arcBottom" startOffset="50%">HISTÓRIAS POR TRÁS DAS MARCAS</textPath>
            </text>
            <g clipPath="url(#labClip)">
              <rect x={0} y={0} width={180} height={1000} fill="rgba(255,236,180,0.18)" transform={`translate(${(sweep / 100) * 840 - 90} 0) skewX(-18)`} />
            </g>
          </svg>
          <div style={{position: 'absolute', top: 268, width: 840, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
              <div style={{width: 70, height: 3, background: C.gold}} />
              <div style={{fontFamily: F.serif, fontWeight: 900, fontStyle: 'italic', fontSize: 92, color: C.cream, lineHeight: 1}}>Atrás do</div>
              <div style={{width: 70, height: 3, background: C.gold}} />
            </div>
            <div
              style={{
                fontFamily: F.serif,
                fontWeight: 900,
                fontSize: 196,
                lineHeight: 1,
                marginTop: 6,
                color: C.gold,
                textShadow: '0 6px 0 #6b4a14, 0 14px 30px rgba(0,0,0,0.7)',
              }}
            >
              Rótulo
            </div>
            <div style={{position: 'relative', marginTop: 34, scale: String(ribbon)}}>
              <svg width={640} height={130} viewBox="0 0 640 130" style={{position: 'absolute', inset: 0}}>
                <polygon points="0,30 60,30 60,110 0,110 26,70" fill="#6f1d12" />
                <polygon points="640,30 580,30 580,110 640,110 614,70" fill="#6f1d12" />
                <rect x={40} y={14} width={560} height={102} fill={C.red} stroke={C.gold} strokeWidth={3} />
              </svg>
              <div
                style={{
                  position: 'relative',
                  width: 640,
                  height: 130,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: F.sans,
                  fontWeight: 800,
                  fontSize: 64,
                  letterSpacing: 14,
                  color: C.cream,
                  paddingLeft: 14,
                }}
              >
                {episode}
              </div>
            </div>
            <div style={{marginTop: 20, fontFamily: F.type, fontSize: 40, color: C.gold, letterSpacing: 6}}>1951 · 1955</div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Capa estática para o Reels (sem legenda e sem saída).
export const ReelsCover: React.FC = () => <TitleCard exitAt={100000} />;
