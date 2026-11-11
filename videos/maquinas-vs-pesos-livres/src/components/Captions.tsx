import React from 'react';
import {AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {duoP, PAGES, type Page} from '../timeline';
import {C, clamp, SANS, SHADOW} from '../theme';

// Legenda: no máximo 2 palavras, Montserrat Bold branca; conceitos em verde e maiores.
// Centro da legenda abaixo do rosto e acima da interface do Instagram.
const Y_FULL = 1350;
const Y_DUO = 985;

const Word: React.FC<{t: string; e: Page['toks'][number]['e']; f: number}> = ({t, e, f}) => {
  const {fps} = useVideoConfig();
  const sp = spring({frame: f, fps, config: {damping: 15, stiffness: 210, mass: 0.6}});
  const big = e === 'key' || e === 'strong';
  const s = big ? 1.14 - 0.14 * sp : 0.94 + 0.06 * sp;
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: SANS,
        fontWeight: big ? 900 : 700,
        fontSize: big ? 88 : 70,
        lineHeight: 1.05,
        letterSpacing: big ? '-0.015em' : '-0.005em',
        color: e === 'key' ? C.green : C.white,
        textTransform: 'uppercase',
        textShadow: SHADOW,
        scale: String(s),
      }}
    >
      {t}
    </span>
  );
};

const PageView: React.FC<{p: Page}> = ({p}) => {
  const f = useCurrentFrame();
  const g = f + p.start;
  const y = Y_FULL + (Y_DUO - Y_FULL) * duoP(g);
  const a = interpolate(f, [0, 3], [0, 1], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        left: 110,
        width: 860,
        top: y,
        translate: `0 calc(-50% + ${(1 - a) * 10}px)`,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'baseline',
        columnGap: 22,
        rowGap: 0,
        opacity: a,
        textAlign: 'center',
      }}
    >
      {p.toks.map((t, i) => (
        <Word key={i} t={t.t} e={t.e} f={f} />
      ))}
    </div>
  );
};

export const Captions: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    {PAGES.map((p, i) =>
      p.pos ? null : (
        <Sequence key={i} name={`Legenda: ${p.toks.map((t) => t.t).join(' ')}`} from={p.start} durationInFrames={Math.max(1, p.end - p.start)} layout="none">
          <PageView p={p} />
        </Sequence>
      ),
    )}
  </AbsoluteFill>
);
