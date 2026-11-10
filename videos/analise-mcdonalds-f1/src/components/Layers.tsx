import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Audio, Video} from '@remotion/media';
import {faceFix, SECTIONS, SEGS, Section, sectionAt, splitProgress} from '../timeline';
import {C, clamp, SANS, SPLIT_Y} from '../theme';
import {Graphic} from './Graphics';

const take = (n: number) => staticFile(`takes/take${String(n).padStart(2, '0')}.mp4`);
const voice = (n: number) => staticFile(`audio/a${String(n).padStart(2, '0')}.wav`);

// ---------------- Rosto (A-roll) ----------------
// Na tela dividida, o rosto desce para a metade de baixo (SPLIT_OFFSET). Nos cortes dentro do mesmo take,
// a escala alterna (1,0 ↔ 1,07) para disfarçar o pulo da imagem.
const SPLIT_OFFSET = 620;

const Shot: React.FC<{i: number}> = ({i}) => {
  const seg = SEGS[i];
  const local = useCurrentFrame();
  const f = local + seg.from_;
  const sameTake = SEGS.filter((s) => s.take === seg.take);
  const k = sameTake.indexOf(seg);
  const sec = sectionAt(f);
  const punch = (k % 2 === 1 ? 1.07 : 1) * (sec.punch ?? 1);
  const drift = 1 + Math.min(local, 200) * 0.00012;
  const fx = faceFix(seg.take);
  const sp = splitProgress(f);
  return (
    <AbsoluteFill style={{translate: `0 ${sp * SPLIT_OFFSET}px`}}>
      <AbsoluteFill style={{scale: String(punch * drift), transformOrigin: '540px 780px'}}>
        <AbsoluteFill style={{transformOrigin: '0 0', scale: String(fx.s), translate: `${fx.x}px ${fx.y}px`}}>
          <Video src={take(seg.take)} trimBefore={seg.src} muted style={{width: 1080, height: 1920, filter: 'contrast(1.05) saturate(1.04)'}} />
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const ARoll: React.FC = () => (
  <AbsoluteFill>
    {SEGS.map((s, i) => (
      <Sequence key={i} name={`Take ${s.take} · ${i}`} from={s.from_} durationInFrames={s.srcEnd - s.src} premountFor={30}>
        <Shot i={i} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

// Voz tratada (RNNoise + EQ + compressão, mesmo volume em todos os takes). Fade de 1 frame nas pontas.
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

// ---------------- Trecho do case no painel de cima ----------------
// Vídeo do case (1920×1080) cobrindo 1080×SPLIT_Y; os 12 % de baixo (legenda em espanhol) ficam fora do quadro.
export const CaseClip: React.FC<{at: number; rate?: number; dur: number; w?: number; h?: number}> = ({at, rate = 1, dur, w = 1080, h = SPLIT_Y}) => {
  const f = useCurrentFrame();
  const sc = (h / 0.88) / 1080;
  const vw = 1920 * Math.max(sc, w / 1920);
  const vh = 1080 * Math.max(sc, w / 1920);
  const zoom = interpolate(f, [0, dur], [1, 1.06], clamp);
  return (
    <AbsoluteFill style={{overflow: 'hidden', width: w, height: h}}>
      <div style={{position: 'absolute', left: (w - vw) / 2, top: 0, width: vw, height: vh, scale: String(zoom), transformOrigin: '50% 40%'}}>
        <Video src={staticFile('caso.mp4')} trimBefore={Math.round(at * 30)} playbackRate={rate} muted style={{width: vw, height: vh}} />
      </div>
    </AbsoluteFill>
  );
};

// Foto vertical (F1) cobrindo o painel, com aproximação lenta em direção ao ponto de interesse.
const PhotoPanel: React.FC<{src: string; focusY: number; zoomTo: number; dur: number}> = ({src, focusY, zoomTo, dur}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, dur], [1, zoomTo], {...clamp, easing: Easing.inOut(Easing.sin)});
  const H = 2160; // foto ~1:2 com 1080 de largura
  const top = Math.min(0, Math.max(SPLIT_Y - H, SPLIT_Y / 2 - focusY * H));
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top, width: 1080, height: H, scale: String(z), transformOrigin: `50% ${focusY * 100}%`}}>
        <Img src={staticFile(src)} style={{width: 1080, height: H, objectFit: 'cover'}} />
      </div>
    </AbsoluteFill>
  );
};

const PanelContent: React.FC<{s: Section; dur: number; seqFrom: number}> = ({s, dur, seqFrom}) => {
  const f = useCurrentFrame();
  const fade = interpolate(f, [0, 5], [0, 1], clamp);
  if (!s.top) return null;
  return (
    <AbsoluteFill style={{opacity: fade}}>
      {s.top.kind === 'case' ? (
        <CaseClip at={s.top.at} rate={s.top.rate} dur={dur} />
      ) : s.top.kind === 'img' ? (
        <PhotoPanel src={s.top.src} focusY={s.top.focusY} zoomTo={s.top.zoomTo ?? 1.1} dur={dur} />
      ) : (
        <Graphic name={s.top.name} seqFrom={seqFrom} />
      )}
    </AbsoluteFill>
  );
};

export const TopPanel: React.FC = () => {
  const f = useCurrentFrame();
  const sp = splitProgress(f);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: SPLIT_Y, overflow: 'hidden', translate: `0 ${-(1 - sp) * (SPLIT_Y + 40)}px`, backgroundColor: C.panel}}>
        {SECTIONS.map((s, i) => {
          if (s.mode !== 'split') return null;
          const prevSplit = i > 0 && SECTIONS[i - 1].mode === 'split';
          const nextSplit = i < SECTIONS.length - 1 && SECTIONS[i + 1].mode === 'split';
          const from = s.from - (prevSplit ? 0 : 3);
          const to = s.to + (nextSplit ? 0 : 8);
          return (
            <Sequence key={s.name} name={`Painel · ${s.name}`} from={from} durationInFrames={to - from} premountFor={30}>
              <PanelContent s={s} dur={to - from} seqFrom={from} />
            </Sequence>
          );
        })}
        {/* degradê na base do painel: a legenda fica sobre a divisão */}
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 220, background: 'linear-gradient(to bottom, rgba(11,11,13,0), rgba(11,11,13,0.72))'}} />
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, backgroundColor: C.gold}} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------- Case em tela cheia (card sobre o próprio vídeo desfocado) ----------------
export const FullCase: React.FC<{s: Section; children?: React.ReactNode}> = ({s, children}) => {
  const f = useCurrentFrame();
  const dur = s.to - s.from;
  const at = s.top && s.top.kind === 'case' ? s.top.at : 0;
  const inP = interpolate(f, [0, 8], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const CW = 1000;
  const CH = Math.round((CW / 1920) * 1080 * 0.88);
  return (
    <AbsoluteFill style={{backgroundColor: C.bg, opacity: interpolate(f, [0, 5], [0, 1], clamp)}}>
      <AbsoluteFill style={{filter: 'blur(38px) brightness(0.45) saturate(1.1)', scale: '1.15'}}>
        <CaseClip at={at} dur={dur} w={1080} h={1920} />
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: (1080 - CW) / 2,
          top: 620,
          width: CW,
          height: CH,
          borderRadius: 28,
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
          outline: `2px solid rgba(255,199,44,0.35)`,
          scale: String(0.94 + 0.06 * inP),
          opacity: inP,
        }}
      >
        <CaseClip at={at} dur={dur} w={CW} h={CH} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 620 + CH + 26, textAlign: 'center', fontFamily: SANS, fontWeight: 600, fontSize: 24, color: C.gray, letterSpacing: 0.5, opacity: inP}}>
        Imagens: case The Golden Zone · TBWA\Colombia para McDonald&apos;s
      </div>
      {children}
    </AbsoluteFill>
  );
};
