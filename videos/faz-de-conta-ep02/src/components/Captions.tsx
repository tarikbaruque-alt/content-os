import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {PAGES, Page, T, Tok} from '../timeline';
import {C, clamp, COND, SANS, SERIF, SHADOW, TYPE} from '../theme';

// Legenda de até 2 palavras. Tipografia muda só quando a palavra pede:
// impacto = Montserrat ExtraBold maior · emoção = serifada itálica · tensão = condensada · plot twist = máquina de escrever.
const Word: React.FC<{tok: Tok}> = ({tok}) => {
  const f = useCurrentFrame();
  const pop = interpolate(f, [0, 7], [1.15, 1], {...clamp, easing: Easing.out(Easing.back(2))});
  const base: React.CSSProperties = {display: 'inline-block', textShadow: SHADOW, lineHeight: 1};
  switch (tok.e) {
    case 'impact':
      return <span style={{...base, fontFamily: SANS, fontWeight: 800, fontSize: 96, letterSpacing: -1, textTransform: 'uppercase', color: C.white, scale: String(pop)}}>{tok.t}</span>;
    case 'serif':
      return <span style={{...base, fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 98, letterSpacing: -0.5, color: C.copperLight, padding: '0 4px'}}>{tok.t}</span>;
    case 'tension':
      return <span style={{...base, fontFamily: COND, fontSize: 112, letterSpacing: 3, textTransform: 'uppercase', color: C.white, scale: String(pop)}}>{tok.t}</span>;
    case 'twist': {
      const n = Math.floor(interpolate(f, [0, 14], [0, tok.t.length], clamp));
      return <span style={{...base, fontFamily: TYPE, fontSize: 92, letterSpacing: 2, color: C.copperLight}}>{tok.t.slice(0, n)}<span style={{opacity: f % 16 < 8 ? 1 : 0}}>|</span></span>;
    }
    default:
      return <span style={{...base, fontFamily: SANS, fontWeight: 600, fontSize: 76, letterSpacing: -1, color: C.white}}>{tok.t}</span>;
  }
};

const PageView: React.FC<{page: Page; y: number}> = ({page, y}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, 5], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 40,
          right: 40,
          top: y - 70,
          height: 140,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          columnGap: 20,
          whiteSpace: 'nowrap',
          opacity: interpolate(f, [0, 3], [0, 1], clamp),
          translate: `0 ${(1 - p) * 10}px`,
        }}
      >
        {page.toks.map((tok, i) => (
          <Word key={i} tok={tok} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const yFor = (f: number) => (f >= T(13) && f < T(14) ? 860 : 1480);

export const Captions: React.FC = () => (
  <>
    {PAGES.map((p, i) => (
      <Sequence key={i} name={`Legenda · ${p.toks.map((t) => t.t).join(' ')}`} from={p.start} durationInFrames={Math.max(1, p.end - p.start)} layout="none">
        <PageView page={p} y={yFor(p.start)} />
      </Sequence>
    ))}
  </>
);
