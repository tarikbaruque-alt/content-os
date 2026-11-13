import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Audio, Video} from '@remotion/media';
import {EXIT, faceFix, neighbors, punchAt, SECTIONS, SEGS, Section, splitProgress, TOTAL} from '../timeline';
import {C, clamp, PANEL_H, SPLIT_OFFSET, SPLIT_Y} from '../theme';
import {SCENES} from './Scenes';

const take = (n: number) => staticFile(`takes/t${String(n).padStart(2, '0')}.mp4`);
const voice = (n: number) => staticFile(`audio/a${String(n).padStart(2, '0')}.wav`);

// ---------------- Rosto ----------------
const Shot: React.FC<{i: number}> = ({i}) => {
  const seg = SEGS[i];
  const local = useCurrentFrame();
  const f = local + seg.from_;
  // o enquadramento só muda quando o corte tirou bastante coisa (disfarça o pulo sem "respirar" a cada frase)
  const cut = seg.z ? 1.06 : 1;
  const drift = 1 + Math.min(local, 240) * 0.00008;
  const fx = faceFix(seg.take);
  const sp = splitProgress(f);
  return (
    <AbsoluteFill style={{translate: `0 ${sp * SPLIT_OFFSET}px`}}>
      <AbsoluteFill style={{scale: String(punchAt(f) * cut * drift), transformOrigin: '560px 780px'}}>
        <AbsoluteFill style={{transformOrigin: '0 0', scale: String(fx.s), translate: `${fx.x}px ${fx.y}px`}}>
          <Video src={take(seg.take)} trimBefore={seg.src} muted style={{width: 1080, height: 1920, filter: 'contrast(1.07) saturate(1.08)'}} />
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

// ---------------- Painel de cima: sem divisória, a base se dissolve com desfoque sobre o vídeo ----------------
const FEATHER = `linear-gradient(to bottom, black 0%, black ${((SPLIT_Y - 170) / PANEL_H) * 100}%, transparent 100%)`;
const BLUR_BAND = `linear-gradient(to bottom, transparent ${((SPLIT_Y - 260) / PANEL_H) * 100}%, black ${((SPLIT_Y - 80) / PANEL_H) * 100}%, black ${((SPLIT_Y + 30) / PANEL_H) * 100}%, transparent 100%)`;

const PanelScene: React.FC<{s: Section; dur: number}> = ({s, dur}) => {
  const f = useCurrentFrame();
  const Scene = SCENES[s.scene ?? ''];
  const {prev} = neighbors(s);
  const o = prev?.mode === 'split' ? interpolate(f, [0, 7], [0, 1], clamp) : 1;
  return Scene ? (
    <AbsoluteFill style={{opacity: o}}>
      <Scene from={s.from} dur={dur} vh={PANEL_H} />
    </AbsoluteFill>
  ) : null;
};

const PanelStack: React.FC = () => (
  <>
    {SECTIONS.map((s) => {
      if (s.mode !== 'split') return null;
      return (
        <Sequence key={s.name} name={`Painel · ${s.name}`} from={s.from} durationInFrames={s.to - s.from + 10} premountFor={30}>
          <PanelScene s={s} dur={s.to - s.from} />
        </Sequence>
      );
    })}
  </>
);

export const TopPanel: React.FC = () => {
  const f = useCurrentFrame();
  const sp = splitProgress(f);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: PANEL_H, translate: `0 ${-(1 - sp) * (PANEL_H + 40)}px`, opacity: interpolate(sp, [0, 0.3], [0, 1], clamp)}}>
        {/* camada desfocada que faz a ponte com o vídeo de baixo */}
        <div style={{position: 'absolute', inset: 0, WebkitMaskImage: BLUR_BAND, maskImage: BLUR_BAND, filter: 'blur(26px)', transform: 'scale(1.04)'}}>
          <div style={{position: 'absolute', inset: 0, backgroundColor: C.panel}}>
            <PanelStack />
          </div>
        </div>
        <div style={{position: 'absolute', inset: 0, WebkitMaskImage: FEATHER, maskImage: FEATHER}}>
          <div style={{position: 'absolute', inset: 0, backgroundColor: C.panel}}>
            <PanelStack />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- Cenas em tela cheia ----------------
const FullWrap: React.FC<{s: Section; children: React.ReactNode}> = ({s, children}) => {
  const f = useCurrentFrame();
  const dur = s.to - s.from;
  const {prev, next} = neighbors(s);
  let clipBottom = 0;
  let opacity = 1;
  if (prev?.mode === 'split') {
    clipBottom = interpolate(f, [0, 10], [1920 - SPLIT_Y, 0], {...clamp, easing: Easing.inOut(Easing.cubic)});
    opacity = interpolate(f, [0, 6], [0.4, 1], clamp);
  } else if (prev) {
    opacity = interpolate(f, [0, 7], [0, 1], clamp);
  }
  if (next?.mode === 'split') {
    clipBottom = Math.max(clipBottom, interpolate(f, [dur - EXIT, dur], [0, 1920 - SPLIT_Y], {...clamp, easing: Easing.inOut(Easing.cubic)}));
  } else if (next?.mode === 'face') {
    opacity *= interpolate(f, [dur - 6, dur], [1, 0], clamp);
  }
  const feather = clipBottom > 0 ? `linear-gradient(to bottom, black 0%, black ${((1920 - clipBottom - 160) / 1920) * 100}%, transparent ${((1920 - clipBottom + 60) / 1920) * 100}%)` : undefined;
  return <AbsoluteFill style={{opacity, WebkitMaskImage: feather, maskImage: feather}}>{children}</AbsoluteFill>;
};

export const FullLayer: React.FC = () => (
  <>
    {SECTIONS.map((s) => {
      if (s.mode !== 'full') return null;
      const Scene = SCENES[s.scene ?? ''];
      if (!Scene) return null;
      return (
        <Sequence key={s.name} name={`Tela cheia · ${s.name}`} from={s.from} durationInFrames={s.to - s.from} premountFor={30}>
          <FullWrap s={s}>
            <Scene from={s.from} dur={s.to - s.from} vh={1920} />
          </FullWrap>
        </Sequence>
      );
    })}
  </>
);
