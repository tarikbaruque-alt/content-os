import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, clamp, SANS, SHADOW_BIG} from '../theme';

export type Pt = [number, number];
const d = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
const ease = {...clamp, easing: Easing.out(Easing.cubic)};

// ---------- Foto com câmera suave (zoom + deslocamento por quadros-chave) ----------
// Os elementos filhos ficam no espaço da imagem (1080 × 1919) e acompanham o movimento.
export type Key = {f: number; s: number; cx: number; cy: number};
const camAt = (f: number, keys: Key[]) => {
  if (f <= keys[0].f) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (f <= b.f) {
      const p = interpolate(f, [a.f, b.f], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)});
      return {f, s: a.s + (b.s - a.s) * p, cx: a.cx + (b.cx - a.cx) * p, cy: a.cy + (b.cy - a.cy) * p};
    }
  }
  return keys[keys.length - 1];
};

export const Photo: React.FC<{src: string; keys: Key[]; svg?: React.ReactNode; children?: React.ReactNode; grade?: string}> = ({
  src,
  keys,
  svg,
  children,
  grade = 'contrast(1.03) saturate(1.0)',
}) => {
  const f = useCurrentFrame();
  const {s, cx, cy} = camAt(f, keys);
  const x = Math.min(0, Math.max(1080 - 1080 * s, 540 - cx * s));
  const y = Math.min(0, Math.max(1920 - 1919 * s, 960 - cy * s));
  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: C.ink}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1919, transformOrigin: '0 0', transform: `translate(${x}px, ${y}px) scale(${s})`}}>
        <Img src={staticFile(src)} style={{position: 'absolute', width: 1080, height: 1919, filter: grade}} />
        <svg width={1080} height={1919} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.65))'}}>
          {svg}
        </svg>
        {children}
      </div>
    </AbsoluteFill>
  );
};

// ---------- Traço que se desenha (linha, seta ou tracejado) ----------
export const Stroke: React.FC<{
  id: string;
  pts: Pt[];
  at: number;
  dur?: number;
  out?: number;
  color?: string;
  w?: number;
  dash?: boolean;
  head?: 'end' | 'both';
}> = ({id, pts, at, dur = 10, out = 1e9, color = C.line, w = 4, dash = false, head}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + dur], [0, 1], ease);
  const o = interpolate(f, [out, out + 6], [1, 0], clamp) * (f >= at ? 1 : 0);
  if (o <= 0) return null;
  const path = d(pts);
  const hp = interpolate(p, [0.75, 1], [0, 1], clamp);
  const arrow = (tip: Pt, from: Pt) => {
    const ang = Math.atan2(tip[1] - from[1], tip[0] - from[0]);
    const L = 24;
    const a1 = ang + Math.PI - 0.5;
    const a2 = ang + Math.PI + 0.5;
    return `M${tip[0] + Math.cos(a1) * L} ${tip[1] + Math.sin(a1) * L} L${tip[0]} ${tip[1]} L${tip[0] + Math.cos(a2) * L} ${tip[1] + Math.sin(a2) * L}`;
  };
  return (
    <g opacity={o}>
      <mask id={`m-${id}`} maskUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920}>
        <path d={path} stroke="white" strokeWidth={w + 8} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} strokeLinecap="round" strokeLinejoin="round" />
      </mask>
      <path d={path} stroke={color} strokeWidth={w} fill="none" strokeDasharray={dash ? '14 12' : undefined} mask={`url(#m-${id})`} strokeLinecap="round" strokeLinejoin="round" />
      {head ? <path d={arrow(pts[pts.length - 1], pts[pts.length - 2])} stroke={color} strokeWidth={w} fill="none" opacity={hp} strokeLinecap="round" strokeLinejoin="round" /> : null}
      {head === 'both' ? <path d={arrow(pts[0], pts[1])} stroke={color} strokeWidth={w} fill="none" opacity={hp} strokeLinecap="round" strokeLinejoin="round" /> : null}
    </g>
  );
};

// ---------- Ponto de apoio (bolinha + anel que pulsa uma vez) ----------
export const Dot: React.FC<{x: number; y: number; at: number; out?: number; color?: string; r?: number}> = ({x, y, at, out = 1e9, color = C.green, r = 8}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const a = interpolate(f, [at, at + 5], [0, 1], ease);
  const o = interpolate(f, [out, out + 6], [1, 0], clamp);
  const ring = interpolate(f, [at, at + 16], [0, 1], ease);
  return (
    <g opacity={o}>
      <circle cx={x} cy={y} r={r + ring * 18} fill="none" stroke={color} strokeWidth={2.5} opacity={1 - ring} />
      <circle cx={x} cy={y} r={r * a} fill={color} stroke="white" strokeWidth={2.5} />
    </g>
  );
};

// ---------- Palavra posicionada na cena (perto do equipamento ou do corpo) ----------
export const CtxText: React.FC<{
  x: number;
  y: number;
  at: number;
  out?: number;
  rot?: number;
  size?: number;
  color?: string;
  align?: 'center' | 'left';
  weight?: number;
  children: React.ReactNode;
}> = ({x, y, at, out = 1e9, rot = 0, size = 92, color = C.green, align = 'center', weight = 900, children}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const p = interpolate(f, [at, at + 9], [0, 1], ease);
  const o = interpolate(f, [out, out + 6], [1, 0], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        translate: align === 'center' ? '-50% -50%' : '0 -50%',
        rotate: `${rot}deg`,
        transformOrigin: align === 'center' ? 'center' : 'left center',
        whiteSpace: 'nowrap',
        fontFamily: SANS,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: '-0.015em',
        textTransform: 'uppercase',
        color,
        textShadow: SHADOW_BIG,
        opacity: o,
        clipPath: `inset(-20% ${(1 - p) * 100}% -20% -5%)`,
        scale: String(0.96 + 0.04 * p),
      }}
    >
      {children}
    </div>
  );
};
