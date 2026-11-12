import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Audio, Video} from '@remotion/media';
import {EXIT, faceFix, neighbors, SECTIONS, SEGS, Section, sectionAt, splitProgress, TOTAL} from '../timeline';
import {C, clamp, SPLIT_OFFSET, SPLIT_Y} from '../theme';
import {SCENES} from './Scenes';

const take = (n: number) => staticFile(`takes/t${String(n).padStart(2, '0')}.mp4`);
const voice = (n: number) => staticFile(`audio/a${String(n).padStart(2, '0')}.wav`);

// ---------------- Rosto ----------------
// Jump cuts discretos: dentro do mesmo take a escala alterna (1,0 ↔ 1,06) a cada corte.
const Shot: React.FC<{i: number}> = ({i}) => {
  const seg = SEGS[i];
  const local = useCurrentFrame();
  const f = local + seg.from_;
  const same = SEGS.filter((s) => s.take === seg.take);
  const k = same.indexOf(seg);
  const punch = (k % 2 === 1 ? 1.06 : 1) * (sectionAt(f).punch ?? 1);
  const drift = 1 + Math.min(local, 200) * 0.0001;
  const fx = faceFix(seg.take);
  const sp = splitProgress(f);
  return (
    <AbsoluteFill style={{translate: `0 ${sp * SPLIT_OFFSET}px`}}>
      <AbsoluteFill style={{scale: String(punch * drift), transformOrigin: '540px 780px'}}>
        <AbsoluteFill style={{transformOrigin: '0 0', scale: String(fx.s), translate: `${fx.x}px ${fx.y}px`}}>
          <Video src={take(seg.take)} trimBefore={seg.src} muted style={{width: 1080, height: 1920, filter: 'contrast(1.05) saturate(1.03) brightness(1.03)'}} />
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const ARoll: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.bg}}>
    {SEGS.map((s, i) => (
      <Sequence key={i} name={`Take ${s.take} · ${i}`} from={s.from_} durationInFrames={(i + 1 < SEGS.length ? SEGS[i + 1].from_ : TOTAL) - s.from_} premountFor={30}>
        <Shot i={i} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

export const Voice: React.FC = () => (
  <>
    {SEGS.map((s, i) => {
      const d = s.srcEnd - s.src;
      return (
        <Sequence key={i} name={`Voz ${s.take}`} from={s.from_} durationInFrames={d} layout="none">
          <Audio src={voice(s.take)} trimBefore={s.src} volume={(f) => interpolate(f, [0, 1, d - 1, d], [0, 1, 1, 0], clamp)} />
        </Sequence>
      );
    })}
  </>
);

// ---------------- Painel de cima (tela dividida) ----------------
const PanelScene: React.FC<{s: Section; dur: number}> = ({s, dur}) => {
  const Scene = SCENES[s.scene ?? ''];
  return Scene ? <Scene from={s.from} dur={dur} vh={SPLIT_Y} /> : null;
};

export const TopPanel: React.FC = () => {
  const f = useCurrentFrame();
  const sp = splitProgress(f);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: SPLIT_Y, overflow: 'hidden', translate: `0 ${-(1 - sp) * (SPLIT_Y + 40)}px`, backgroundColor: C.panel}}>
        {SECTIONS.map((s) => {
          if (s.mode !== 'split') return null;
          return (
            <Sequence key={s.name} name={`Painel · ${s.name}`} from={s.from} durationInFrames={s.to - s.from + 10} premountFor={30}>
              <PanelScene s={s} dur={s.to - s.from} />
            </Sequence>
          );
        })}
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 200, background: 'linear-gradient(to bottom, rgba(11,11,13,0), rgba(11,11,13,0.7))'}} />
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, backgroundColor: C.gold}} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------- Cenas em tela cheia (com entrada/saída conforme o vizinho) ----------------
const FullWrap: React.FC<{s: Section; children: React.ReactNode}> = ({s, children}) => {
  const f = useCurrentFrame();
  const dur = s.to - s.from;
  const {prev, next} = neighbors(s);
  let clipBottom = 0;
  let opacity = 1;
  let circle: number | null = null;
  // entrada
  if (prev?.mode === 'split' && s.scene !== 'vinheta') {
    clipBottom = interpolate(f, [0, 10], [1920 - SPLIT_Y, 0], {...clamp, easing: Easing.inOut(Easing.cubic)});
  } else if (prev?.mode === 'full' && s.scene !== 'tire') {
    opacity = interpolate(f, [0, 8], [0, 1], clamp);
  } else if (prev && s.scene !== 'tire' && s.scene !== 'vinheta') {
    opacity = interpolate(f, [0, 6], [0, 1], clamp);
  }
  // saída
  if (next?.mode === 'split') {
    clipBottom = Math.max(clipBottom, interpolate(f, [dur - EXIT, dur], [0, 1920 - SPLIT_Y], {...clamp, easing: Easing.inOut(Easing.cubic)}));
  } else if (s.scene === 'road') {
    circle = interpolate(f, [dur - 10, dur], [1400, 0], {...clamp, easing: Easing.in(Easing.cubic)});
  } else if (next?.mode === 'face' && s.scene !== 'tire') {
    opacity *= interpolate(f, [dur - 6, dur], [1, 0], clamp);
  }
  return (
    <AbsoluteFill
      style={{
        opacity,
        clipPath: circle !== null ? `circle(${circle}px at 540px 905px)` : `inset(0 0 ${clipBottom}px 0)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const FullLayer: React.FC = () => (
  <>
    {SECTIONS.map((s) => {
      if (s.mode !== 'full') return null;
      const Scene = SCENES[s.scene ?? ''];
      if (!Scene) return null;
      const {next} = neighbors(s);
      const extra = next?.mode === 'full' && next.scene !== 'tire' ? 8 : 0;
      return (
        <Sequence key={s.name} name={`Tela cheia · ${s.name}`} from={s.from} durationInFrames={s.to - s.from + extra} premountFor={30}>
          <FullWrap s={s}>
            <Scene from={s.from} dur={s.to - s.from} vh={1920} />
          </FullWrap>
        </Sequence>
      );
    })}
  </>
);
