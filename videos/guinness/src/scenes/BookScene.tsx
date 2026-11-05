import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {Paper} from './Paper';
import {FilmLook} from '../components/FilmLook';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// 1955: nasce o livro. Ilustração em motion da 1ª edição (não é a capa real).
export const BookScene: React.FC<{yearAt?: number; dropAt?: number}> = ({yearAt = 7, dropAt = 30}) => {
  const frame = useCurrentFrame();
  const yearS = interpolate(frame, [yearAt, yearAt + 6], [1.9, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const yearOp = interpolate(frame, [yearAt, yearAt + 3], [0, 1], clamp);
  const drop = interpolate(frame, [dropAt, dropAt + 12], [-1300, 0], {...clamp, easing: Easing.out(Easing.bounce)});
  const rotY = interpolate(frame, [dropAt, dropAt + 80], [-38, -16], clamp);
  const float = Math.sin(frame / 14) * 8;
  const rays = interpolate(frame, [dropAt + 8, dropAt + 24], [0, 0.55], clamp);
  const label = Math.max(0, Math.floor((frame - dropAt - 16) * 1.5));
  const LABEL = '1ª edição · agosto de 1955';
  const landed = frame >= dropAt + 10;
  const dust = landed
    ? new Array(14).fill(0).map((_, i) => {
        const age = frame - dropAt - 10;
        const ang = random(`d-a-${i}`) * Math.PI;
        const sp = 6 + random(`d-s-${i}`) * 10;
        return {x: 540 + Math.cos(ang) * sp * age * (random(`d-x-${i}`) > 0.5 ? 1 : -1), y: 1120 - Math.sin(ang) * sp * age * 0.4, o: interpolate(age, [0, 24], [0.6, 0], clamp), r: 10 + random(`d-r-${i}`) * 18};
      })
    : [];

  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: C.black}}>
      <Paper>
        <AbsoluteFill
          style={{
            background: 'repeating-conic-gradient(from 0deg at 50% 52%, rgba(255,230,160,0.55) 0deg 6deg, rgba(255,230,160,0) 6deg 18deg)',
            opacity: rays,
            rotate: `${frame * 0.4}deg`,
            scale: '2',
            maskImage: 'radial-gradient(circle at 50% 52%, black 0%, transparent 45%)',
          }}
        />
        <div style={{position: 'absolute', top: 120, width: 1080, display: 'flex', justifyContent: 'center'}}>
          <div
            style={{
              fontFamily: F.serif,
              fontWeight: 900,
              fontSize: 200,
              lineHeight: 1,
              color: C.red,
              border: `8px double ${C.red}`,
              padding: '6px 40px 18px',
              rotate: '-3deg',
              scale: String(yearS),
              opacity: yearOp,
            }}
          >
            1955
          </div>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 420, height: 720, perspective: 1600, display: 'flex', justifyContent: 'center'}}>
          <div
            style={{
              position: 'relative',
              width: 520,
              height: 700,
              transformStyle: 'preserve-3d',
              transform: `translateY(${drop + float}px) rotateY(${rotY}deg) rotateX(6deg)`,
            }}
          >
            {/* lombada */}
            <div style={{position: 'absolute', left: -60, top: 0, width: 60, height: 700, background: '#163626', transform: 'rotateY(-90deg)', transformOrigin: 'right center'}} />
            {/* páginas */}
            <div style={{position: 'absolute', right: -2, top: 8, width: 50, height: 684, background: 'repeating-linear-gradient(90deg,#f3ead2 0 3px,#d9ccaa 3px 5px)', transform: 'rotateY(90deg)', transformOrigin: 'left center'}} />
            {/* capa */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(135deg, #2a6045 0%, ${C.guinnessGreen} 55%, #12301f 100%)`,
                borderRadius: '4px 10px 10px 4px',
                boxShadow: '0 40px 80px rgba(0,0,0,0.55)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: C.gold,
                textAlign: 'center',
              }}
            >
              <div style={{position: 'absolute', inset: 22, border: `3px solid ${C.gold}`, borderRadius: 4}} />
              <div style={{position: 'absolute', inset: 34, border: `1px solid ${C.gold}`, borderRadius: 2}} />
              <div style={{fontFamily: F.fell, fontSize: 40, letterSpacing: 8}}>THE</div>
              <div style={{fontFamily: F.serif, fontWeight: 900, fontSize: 92, lineHeight: 1}}>GUINNESS</div>
              <div style={{fontFamily: F.fell, fontSize: 56, letterSpacing: 6, marginTop: 10}}>BOOK OF</div>
              <div style={{fontFamily: F.serif, fontWeight: 900, fontSize: 84, lineHeight: 1}}>RECORDS</div>
              <div style={{width: 200, height: 3, background: C.gold, margin: '34px 0 18px'}} />
              <div style={{fontFamily: F.type, fontSize: 40}}>1955</div>
            </div>
          </div>
        </div>
        {dust.map((d, i) => (
          <div key={i} style={{position: 'absolute', left: d.x, top: d.y, width: d.r, height: d.r, borderRadius: '50%', background: '#a88a5a', opacity: d.o, filter: 'blur(4px)'}} />
        ))}
        <div style={{position: 'absolute', top: 1160, width: 1080, textAlign: 'center', fontFamily: F.type, fontSize: 44, color: C.ink, whiteSpace: 'pre'}}>
          {LABEL.slice(0, label)}
        </div>
      </Paper>
      <FilmLook grain={0.2} vignette={0.65} flicker={0.05} scratches seed="book" />
    </AbsoluteFill>
  );
};
