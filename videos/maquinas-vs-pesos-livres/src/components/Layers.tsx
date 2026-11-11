import React from 'react';
import {AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Audio, Video} from '@remotion/media';
import {DUO_Y, duoP, faceFix, punchAt, SEGS, TOTAL} from '../timeline';
import {C, clamp} from '../theme';

const take = (f: string) => staticFile(`takes/t${f}.mp4`);
const voice = (f: string) => staticFile(`audio/a${f}.wav`);

// ---------- Rosto (A-roll) ----------
const Shot: React.FC<{i: number}> = ({i}) => {
  const seg = SEGS[i];
  const local = useCurrentFrame();
  const f = local + seg.from_;
  const same = SEGS.filter((s) => s.take === seg.take);
  const k = same.indexOf(seg);
  const cut = k % 2 === 1 ? 1.06 : 1; // pequeno ajuste de enquadramento a cada corte dentro da mesma frase
  const p = punchAt(f) * cut * (1 + Math.min(local, 240) * 0.00008);
  const fx = faceFix(seg.file);
  return (
    <AbsoluteFill style={{translate: `0 ${duoP(f) * DUO_Y}px`}}>
      <AbsoluteFill style={{scale: String(p), transformOrigin: '540px 640px'}}>
        <AbsoluteFill style={{transformOrigin: '0 0', scale: String(fx.s), translate: `${fx.x}px ${fx.y}px`}}>
          <Video src={take(seg.file)} trimBefore={seg.src} muted style={{width: 1080, height: 1920, filter: 'contrast(1.04) saturate(1.02) brightness(1.01)'}} />
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const ARoll: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.ink}}>
    {SEGS.map((s, i) => (
      // a imagem segue rodando até o próximo trecho (sem tela preta nos respiros entre frases)
      <Sequence key={i} name={`Trecho ${s.take} · ${i}`} from={s.from_} durationInFrames={(i + 1 < SEGS.length ? SEGS[i + 1].from_ : TOTAL) - s.from_} premountFor={30}>
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
          <Audio src={voice(s.file)} trimBefore={s.src} volume={(f) => interpolate(f, [0, 1, d - 1, d], [0, 1, 1, 0], clamp)} />
        </Sequence>
      );
    })}
  </>
);

// vinheta leve (cor natural, sem filtro pesado)
export const Finish: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.28) 100%)'}} />
);
