import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {captionPages, CaptionPageData, CaptionToken} from '../data/captions';
import {C, F} from '../theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Legenda com no máximo 2 linhas; palavras relevantes mudam de tipografia.
const BASE = 64;

const Token: React.FC<{token: CaptionToken; nowMs: number}> = ({token, nowMs}) => {
  const {fps} = useVideoConfig();
  const spoken = nowMs >= token.fromMs - 30;
  const active = nowMs >= token.fromMs && nowMs < token.toMs;
  const sinceF = ((nowMs - token.fromMs) / 1000) * fps;
  const stroke = {WebkitTextStroke: '12px #000', paintOrder: 'stroke fill'} as React.CSSProperties;
  const common: React.CSSProperties = {
    display: 'inline-block',
    opacity: spoken ? 1 : 0.42,
    margin: '0 10px',
    ...stroke,
  };

  if (token.emph === 'gold') {
    const s = spoken ? interpolate(sinceF, [0, 6], [1.35, 1], {...clamp, easing: Easing.out(Easing.back(2))}) : 1;
    return (
      <span
        style={{
          ...common,
          fontFamily: F.serif,
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: BASE * 1.2,
          color: spoken ? C.gold : '#fff',
          scale: String(s),
        }}
      >
        {token.text}
      </span>
    );
  }
  if (token.emph === 'date') {
    const s = spoken ? interpolate(sinceF, [0, 5], [1.6, 1], {...clamp, easing: Easing.out(Easing.cubic)}) : 1;
    return (
      <span
        style={{
          display: 'inline-block',
          margin: '0 10px',
          padding: '2px 16px 0',
          fontFamily: F.type,
          fontSize: BASE * 1.12,
          color: C.cream,
          background: spoken ? C.red : 'rgba(0,0,0,0.4)',
          rotate: '-3deg',
          scale: String(s),
          opacity: spoken ? 1 : 0.42,
          boxShadow: spoken ? '0 8px 20px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {token.text.replace(/[,.]$/, '')}
      </span>
    );
  }
  if (token.emph === 'strike') {
    const w = spoken ? interpolate(sinceF, [2, 9], [0, 108], {...clamp, easing: Easing.out(Easing.cubic)}) : 0;
    return (
      <span style={{...common, position: 'relative', fontFamily: F.sans, fontWeight: 800, fontSize: BASE, color: spoken ? '#d9d2c5' : '#fff'}}>
        {token.text}
        <span
          style={{
            position: 'absolute',
            left: '-4%',
            top: '50%',
            height: 10,
            width: `${w}%`,
            background: C.red,
            rotate: '-4deg',
            borderRadius: 5,
            WebkitTextStroke: '0px',
          }}
        />
      </span>
    );
  }
  return (
    <span
      style={{
        ...common,
        fontFamily: F.sans,
        fontWeight: 800,
        fontSize: BASE,
        color: '#fff',
        scale: active ? '1.06' : '1',
      }}
    >
      {token.text}
    </span>
  );
};

const Page: React.FC<{page: CaptionPageData}> = ({page}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const nowMs = page.startMs + (frame / fps) * 1000;
  const enter = interpolate(frame, [0, 4], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{pointerEvents: 'none', alignItems: 'center'}}>
      <div
        style={{
          position: 'absolute',
          top: 1255,
          width: 940,
          minHeight: 240,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          alignContent: 'center',
          lineHeight: 1.18,
          textAlign: 'center',
          opacity: enter,
          scale: String(0.94 + 0.06 * enter),
          textShadow: '0 6px 18px rgba(0,0,0,0.55)',
        }}
      >
        {page.tokens.map((t, i) => (
          <Token key={`${t.fromMs}-${i}`} token={t} nowMs={nowMs} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const Captions: React.FC<{hidden: [number, number][]}> = ({hidden}) => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {captionPages.map((page, i) => {
        const from = Math.round((page.startMs / 1000) * fps);
        let to = Math.round((page.endMs / 1000) * fps);
        for (const [a, b] of hidden) {
          if (from >= a && from < b) return null;
          if (from < a && to > a) to = a;
        }
        if (to - from <= 0) return null;
        return (
          <Sequence key={i} from={from} durationInFrames={to - from} name={`Legenda ${i + 1}`} layout="none">
            <Page page={page} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
