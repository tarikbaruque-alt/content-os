import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {PAGES, Page, sectionAt, Tok} from '../timeline';
import {C, clamp, SANS, SERIF, SHADOW, SPLIT_Y} from '../theme';

// Legenda de até 2 palavras · Montserrat Bold branca. Destaques: dourado (estrelas, marca, números),
// serifada itálica dourada, sublinhado dourado e vermelho para o que é "problema". Entrada suave, sem pulos.
const Word: React.FC<{tok: Tok}> = ({tok}) => {
  const f = useCurrentFrame();
  const base: React.CSSProperties = {display: 'inline-block', textShadow: SHADOW, lineHeight: 1};
  const settle = interpolate(f, [0, 6], [1.06, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  if (tok.e === 'serif') return <span style={{...base, fontFamily: SERIF, fontStyle: 'italic', fontSize: 104, color: C.gold, scale: String(settle), padding: '0 4px'}}>{tok.t}</span>;
  if (tok.e === 'gold') return <span style={{...base, fontFamily: SANS, fontWeight: 900, fontSize: 80, letterSpacing: '-0.01em', textTransform: 'uppercase', color: C.gold, scale: String(settle)}}>{tok.t}</span>;
  if (tok.e === 'red') return <span style={{...base, fontFamily: SANS, fontWeight: 900, fontSize: 76, letterSpacing: '-0.01em', textTransform: 'uppercase', color: C.red}}>{tok.t}</span>;
  if (tok.e === 'under') {
    const u = interpolate(f, [2, 9], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
    return (
      <span style={{...base, position: 'relative', fontFamily: SANS, fontWeight: 700, fontSize: 72, color: C.white}}>
        {tok.t}
        <span style={{position: 'absolute', left: 0, right: 0, bottom: -12, height: 8, borderRadius: 4, backgroundColor: C.gold, transformOrigin: 'left', scale: `${u} 1`}} />
      </span>
    );
  }
  return <span style={{...base, fontFamily: SANS, fontWeight: 700, fontSize: 72, letterSpacing: '-0.01em', color: C.white}}>{tok.t}</span>;
};

const PageView: React.FC<{page: Page; y: number}> = ({page, y}) => {
  const f = useCurrentFrame();
  const a = interpolate(f, [0, 4], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 40,
          right: 40,
          top: y - 75,
          height: 150,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          columnGap: 20,
          whiteSpace: 'nowrap',
          opacity: a,
          translate: `0 ${(1 - a) * 10}px`,
        }}
      >
        {page.toks.map((tok, i) => (
          <Word key={i} tok={tok} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Posição: na tela dividida, sobre a divisão; com o rosto ou em tela cheia, abaixo do queixo (área segura).
const yFor = (f: number) => {
  const s = sectionAt(f);
  if (s.capY) return s.capY;
  return s.mode === 'split' ? SPLIT_Y + 20 : 1480;
};

export const Captions: React.FC = () => (
  <>
    {PAGES.map((p, i) =>
      p.hide ? null : (
        <Sequence key={i} name={`Legenda · ${p.toks.map((t) => t.t).join(' ')}`} from={p.start} durationInFrames={Math.max(1, p.end - p.start)} layout="none">
          <PageView page={p} y={yFor(p.start)} />
        </Sequence>
      ),
    )}
  </>
);
