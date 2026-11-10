import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {PAGES, Page, sectionAt, Tok} from '../timeline';
import {C, clamp, SANS, SERIF, SPLIT_Y, TEXT_SHADOW} from '../theme';

// Legenda de 2 palavras. Texto limpo (Inter 800, branco); palavras-chave trocam de tipografia:
//  serif = Instrument Serif itálica dourada · gold = caixa alta dourada · under = sublinhado dourado animado.
const Word: React.FC<{tok: Tok}> = ({tok}) => {
  const f = useCurrentFrame();
  const pop = interpolate(f, [0, 7], [1.18, 1], {...clamp, easing: Easing.out(Easing.back(2))});
  const base: React.CSSProperties = {display: 'inline-block', textShadow: TEXT_SHADOW, lineHeight: 1};
  if (tok.e === 'serif') {
    return <span style={{...base, fontFamily: SERIF, fontStyle: 'italic', fontSize: 118, letterSpacing: -1, color: C.gold, scale: String(pop), padding: '0 6px'}}>{tok.t}</span>;
  }
  if (tok.e === 'gold') {
    return <span style={{...base, fontFamily: SANS, fontWeight: 900, fontSize: 84, letterSpacing: -1, textTransform: 'uppercase', color: C.gold, scale: String(pop)}}>{tok.t}</span>;
  }
  if (tok.e === 'under') {
    const u = interpolate(f, [2, 9], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
    return (
      <span style={{...base, position: 'relative', fontFamily: SANS, fontWeight: 800, fontSize: 80, letterSpacing: -2, color: C.white}}>
        {tok.t}
        <span style={{position: 'absolute', left: 0, right: 0, bottom: -12, height: 9, borderRadius: 5, backgroundColor: C.gold, transformOrigin: 'left', scale: `${u} 1`, boxShadow: '0 2px 8px rgba(0,0,0,0.4)'}} />
      </span>
    );
  }
  return <span style={{...base, fontFamily: SANS, fontWeight: 800, fontSize: 80, letterSpacing: -2, color: C.white}}>{tok.t}</span>;
};

const PageView: React.FC<{page: Page; y: number}> = ({page, y}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, 5], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.5))});
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
          columnGap: 22,
          whiteSpace: 'nowrap',
          opacity: interpolate(f, [0, 3], [0, 1], clamp),
          scale: String(0.9 + 0.1 * p),
        }}
      >
        {page.toks.map((tok, i) => (
          <Word key={i} tok={tok} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Posição: na tela dividida a legenda fica sobre a divisão; com o rosto em tela cheia, abaixo do queixo.
const yFor = (f: number) => {
  const m = sectionAt(f).mode;
  if (m === 'split') return SPLIT_Y + 20;
  if (m === 'full') return 1500;
  return 1430;
};

export const Captions: React.FC = () => (
  <>
    {PAGES.map((p, i) => (
      <Sequence key={i} name={`Legenda · ${p.toks.map((t) => t.t).join(' ')}`} from={p.start} durationInFrames={Math.max(1, p.end - p.start)} layout="none">
        <PageView page={p} y={yFor(p.start)} />
      </Sequence>
    ))}
  </>
);
