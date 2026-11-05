import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {Paper} from './Paper';
import {FilmLook} from '../components/FilmLook';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const YEARS = [
  {y: '1951', x: 0, note: 'a discussão'},
  {y: '1954', x: 760, note: 'a pesquisa'},
  {y: '1955', x: 1160, note: 'o livro'},
];

// Linha do tempo que anda de 1951 até 1954.
export const TimelineScene: React.FC<{panFrom?: number; panTo?: number; hitAt?: number}> = ({panFrom = 4, panTo = 18, hitAt = 19}) => {
  const frame = useCurrentFrame();
  const pos = interpolate(frame, [panFrom, panTo], [0, 760], {...clamp, easing: Easing.bezier(0.7, 0, 0.3, 1)});
  const offset = 540 - pos;
  const entry = interpolate(frame, [0, 8], [1.1, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: C.black}}>
      <AbsoluteFill style={{scale: String(entry)}}>
        <Paper>
          <div style={{position: 'absolute', top: 300, width: 1080, textAlign: 'center', fontFamily: F.type, fontSize: 44, letterSpacing: 6, color: C.ink, opacity: 0.8}}>
            LINHA DO TEMPO
          </div>
          <div style={{position: 'absolute', left: offset - 600, top: 900, width: 3000, height: 6, background: C.ink, opacity: 0.85}} />
          {YEARS.map((it) => {
            const isHit = it.y === '1954';
            const reached = it.x <= pos + 1;
            const hit = isHit ? interpolate(frame, [hitAt, hitAt + 6], [0, 1], {...clamp, easing: Easing.out(Easing.back(2))}) : reached ? 1 : 0;
            const big = isHit ? 1 + 0.25 * hit : 1;
            return (
              <div key={it.y} style={{position: 'absolute', left: offset + it.x - 200, top: 600, width: 400, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <div
                  style={{
                    fontFamily: F.serif,
                    fontWeight: 900,
                    fontSize: 150,
                    color: hit > 0.5 ? C.red : C.ink,
                    opacity: reached ? 1 : 0.3,
                    scale: String(big),
                    lineHeight: 1,
                  }}
                >
                  {it.y}
                </div>
                <div
                  style={{
                    marginTop: 116,
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    background: reached ? C.gold : C.parchment,
                    border: `6px solid ${C.ink}`,
                    scale: String(isHit ? 0.6 + 0.6 * hit : 1),
                  }}
                />
                <div style={{marginTop: 40, fontFamily: F.type, fontSize: 46, color: C.ink, opacity: reached ? 0.9 : 0.3}}>{it.note}</div>
              </div>
            );
          })}
        </Paper>
      </AbsoluteFill>
      <FilmLook grain={0.2} vignette={0.65} flicker={0.05} scratches seed="timeline" />
    </AbsoluteFill>
  );
};
