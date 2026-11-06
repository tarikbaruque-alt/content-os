import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {Highlight} from '@remotion/rough-notation';
import {pages, Page as PageData, Token} from '../data/pages';
import {C, F} from '../theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const STROKE: React.CSSProperties = {WebkitTextStroke: '14px #000', paintOrder: 'stroke fill'};

// Legenda de 2 palavras. A palavra de destaque muda de tipografia, cresce ou é grifada.
const Word: React.FC<{t: Token}> = ({t}) => {
  const frame = useCurrentFrame();
  const bounce = interpolate(frame, [0, 7], [1.3, 1], {...clamp, easing: Easing.out(Easing.back(2.2))});
  if (t.emph === 'big') {
    return (
      <span style={{...STROKE, display: 'inline-block', fontFamily: F.display, fontSize: 150, lineHeight: 1, color: C.yellow, textTransform: 'uppercase', scale: String(bounce)}}>
        {t.text}
      </span>
    );
  }
  if (t.emph === 'serif') {
    return (
      <span style={{...STROKE, WebkitTextStroke: '12px #000', display: 'inline-block', fontFamily: F.serif, fontWeight: 900, fontStyle: 'italic', fontSize: 122, lineHeight: 1, color: C.yellow, scale: String(bounce), padding: '0 6px'}}>
        {t.text}
      </span>
    );
  }
  if (t.emph === 'marker') {
    return (
      <span style={{display: 'inline-block', scale: String(interpolate(frame, [0, 6], [1.15, 1], clamp))}}>
        <Highlight color={C.yellow} progress={interpolate(frame, [0, 4], [0, 1], clamp)} iterations={1} padding={{top: 6, bottom: 6, left: 14, right: 14}}>
          <span style={{fontFamily: F.sans, fontWeight: 900, fontSize: 88, lineHeight: 1.1, color: C.black, textTransform: 'uppercase'}}>{t.text}</span>
        </Highlight>
      </span>
    );
  }
  return (
    <span style={{...STROKE, display: 'inline-block', fontFamily: F.sans, fontWeight: 900, fontSize: 86, lineHeight: 1.1, color: C.white, textTransform: 'uppercase'}}>
      {t.text}
    </span>
  );
};

const CaptionPage: React.FC<{page: PageData}> = ({page}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 5], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.8))});
  return (
    <AbsoluteFill style={{pointerEvents: 'none', alignItems: 'center'}}>
      <div
        style={{
          position: 'absolute',
          top: 1395,
          width: 1020,
          minHeight: 170,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          alignContent: 'center',
          columnGap: 26,
          rowGap: 4,
          opacity: interpolate(frame, [0, 3], [0, 1], clamp),
          scale: String(0.82 + 0.18 * p),
          filter: 'drop-shadow(0 10px 22px rgba(0,0,0,0.45))',
        }}
      >
        {page.tokens.map((t, i) => (
          <Word key={i} t={t} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Os selos das técnicas entram nestes frames: a legenda anterior termina ali.
const STAMPS = [176, 432, 783];

export const Captions: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    {pages.map((page, i) => {
      const end = STAMPS.reduce((e, s) => (page.start < s && e > s ? s : e), page.end);
      return (
        <Sequence key={i} name={`Legenda ${i + 1}`} from={page.start} durationInFrames={end - page.start} layout="none">
          <CaptionPage page={page} />
        </Sequence>
      );
    })}
  </AbsoluteFill>
);
