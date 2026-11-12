import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, clamp, SANS} from '../theme';

export type Pt = [number, number];
export const ease = {...clamp, easing: Easing.out(Easing.cubic)};
export const easeIO = {...clamp, easing: Easing.inOut(Easing.cubic)};
export const ramp = (f: number, a: number, len = 10) => interpolate(f, [a, a + len], [0, 1], ease);
const pathD = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');

// ---------- Câmera sobre uma foto (zoom + deslocamento por quadros-chave) ----------
// Filhos ficam no espaço da imagem (1080 × 1919) e acompanham o movimento.
export type Key = {f: number; s: number; cx: number; cy: number};
export const camAt = (f: number, keys: Key[], e = Easing.inOut(Easing.sin)) => {
  if (f <= keys[0].f) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (f <= b.f) {
      const p = interpolate(f, [a.f, b.f], [0, 1], {...clamp, easing: e});
      return {f, s: a.s + (b.s - a.s) * p, cx: a.cx + (b.cx - a.cx) * p, cy: a.cy + (b.cy - a.cy) * p};
    }
  }
  return keys[keys.length - 1];
};

export const camXY = (s: number, cx: number, cy: number, vw = 1080, vh = 1920, iw = 1080, ih = 1919) => {
  const x = Math.min(0, Math.max(vw - iw * s, vw / 2 - cx * s));
  const y = Math.min(0, Math.max(vh - ih * s, vh / 2 - cy * s));
  return {x, y};
};

export const Photo: React.FC<{
  src: string;
  keys: Key[];
  vw?: number;
  vh?: number;
  grade?: string;
  svg?: React.ReactNode;
  children?: React.ReactNode;
  frame?: number;
}> = ({src, keys, vw = 1080, vh = 1920, grade = 'contrast(1.04) saturate(1.02)', svg, children, frame}) => {
  const cur = useCurrentFrame();
  const f = frame ?? cur;
  const {s, cx, cy} = camAt(f, keys);
  const {x, y} = camXY(s, cx, cy, vw, vh);
  return (
    <AbsoluteFill style={{overflow: 'hidden', width: vw, height: vh, backgroundColor: C.bg}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1919, transformOrigin: '0 0', transform: `translate(${x}px, ${y}px) scale(${s})`}}>
        <Img src={staticFile(src)} style={{position: 'absolute', width: 1080, height: 1919, filter: grade}} />
        {svg ? (
          <svg width={1080} height={1919} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))'}}>
            {svg}
          </svg>
        ) : null}
        {children}
      </div>
    </AbsoluteFill>
  );
};

// ---------- Traço que se desenha ----------
export const Stroke: React.FC<{
  id: string;
  pts: Pt[];
  d?: string;
  at: number;
  dur?: number;
  out?: number;
  color?: string;
  w?: number;
  dash?: string;
  head?: boolean;
  f: number;
}> = ({id, pts, d, at, dur = 12, out = 1e9, color = C.white, w = 4, dash, head, f}) => {
  const p = interpolate(f, [at, at + dur], [0, 1], easeIO);
  const o = interpolate(f, [out, out + 6], [1, 0], clamp) * (f >= at ? 1 : 0);
  if (o <= 0) return null;
  const path = d ?? pathD(pts);
  const tip = pts[pts.length - 1];
  const from = pts[pts.length - 2] ?? pts[0];
  const ang = Math.atan2(tip[1] - from[1], tip[0] - from[0]);
  const L = 22;
  const hp = interpolate(p, [0.8, 1], [0, 1], clamp);
  return (
    <g opacity={o}>
      <mask id={`m-${id}`} maskUnits="userSpaceOnUse" x={-200} y={-200} width={1600} height={2400}>
        <path d={path} stroke="white" strokeWidth={w + 10} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} strokeLinecap="round" strokeLinejoin="round" />
      </mask>
      <path d={path} stroke={color} strokeWidth={w} fill="none" strokeDasharray={dash} mask={`url(#m-${id})`} strokeLinecap="round" strokeLinejoin="round" />
      {head ? (
        <path
          d={`M${tip[0] + Math.cos(ang + Math.PI - 0.5) * L} ${tip[1] + Math.sin(ang + Math.PI - 0.5) * L} L${tip[0]} ${tip[1]} L${tip[0] + Math.cos(ang + Math.PI + 0.5) * L} ${tip[1] + Math.sin(ang + Math.PI + 0.5) * L}`}
          stroke={color}
          strokeWidth={w}
          fill="none"
          opacity={hp}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </g>
  );
};

// ---------- Estrela (5 pontas) ----------
export const starPath = (cx: number, cy: number, r: number, inner = 0.42) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * inner;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(2)} ${(cy + Math.sin(a) * rr).toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
};

export const Star: React.FC<{size: number; p?: number; glow?: number; color?: string}> = ({size, p = 1, glow = 0.6, color = C.gold}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{overflow: 'visible', scale: String(p), opacity: Math.min(1, p * 1.5)}}>
    <defs>
      <linearGradient id="star-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFE8A3" />
        <stop offset="0.55" stopColor={color} />
        <stop offset="1" stopColor={C.goldDeep} />
      </linearGradient>
      <filter id="star-glow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
    </defs>
    <path d={starPath(50, 52, 46)} fill={color} opacity={glow * 0.6} filter="url(#star-glow)" />
    <path d={starPath(50, 52, 46)} fill="url(#star-g)" stroke="#FFF3C8" strokeWidth={1.5} strokeLinejoin="round" />
  </svg>
);

// ---------- Selo discreto para imagens geradas ----------
export const IllustrationTag: React.FC<{x?: number; y?: number; o?: number}> = ({x = 48, y = 1300, o = 1}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      fontFamily: SANS,
      fontWeight: 600,
      fontSize: 19,
      letterSpacing: '0.16em',
      color: 'rgba(246,244,239,0.82)',
      background: 'rgba(11,11,13,0.45)',
      padding: '7px 14px',
      borderRadius: 8,
      opacity: o,
      textTransform: 'uppercase',
    }}
  >
    Imagem ilustrativa
  </div>
);

// grão de filme + vinheta (cenas históricas)
export const Film: React.FC<{o?: number; vignette?: number}> = ({o = 0.1, vignette = 0.55}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,${vignette}) 100%)`}} />
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile('grain.png')})`,
          backgroundSize: '480px 480px',
          backgroundPosition: `${(f * 137) % 480}px ${(f * 263) % 480}px`,
          opacity: o,
          mixBlendMode: 'overlay',
        }}
      />
    </AbsoluteFill>
  );
};
