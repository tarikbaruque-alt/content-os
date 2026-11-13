import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {C, clamp, GRAD, SANS} from '../theme';

export const ease = {...clamp, easing: Easing.out(Easing.cubic)};
export const easeIO = {...clamp, easing: Easing.inOut(Easing.cubic)};
export const ramp = (f: number, a: number, len = 10) => interpolate(f, [a, a + len], [0, 1], ease);
export const pop = (f: number, at: number, damping = 13) => (f < at ? 0 : spring({frame: f - at, fps: 30, config: {damping, stiffness: 170, mass: 0.6}}));
export const fadeOut = (f: number, at: number, len = 8) => interpolate(f, [at, at + len], [1, 0], clamp);
export const rnd = (i: number, k = 1) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------- fundo escuro com brilho sutil ----------
export const Bg: React.FC<{glow?: number; children?: React.ReactNode}> = ({glow = 1, children}) => {
  const f = useCurrentFrame();
  const d = Math.sin(f / 40) * 30;
  return (
    <AbsoluteFill style={{backgroundColor: C.bg, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 700px at ${200 + d}px 260px, rgba(255,200,61,${0.13 * glow}), rgba(0,0,0,0) 70%), radial-gradient(800px 700px at ${920 - d}px 860px, rgba(90,200,255,${0.14 * glow}), rgba(0,0,0,0) 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1.4px, transparent 1.6px)',
          backgroundSize: '36px 36px',
          maskImage: 'radial-gradient(ellipse at 50% 45%, black 20%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 45%, black 20%, transparent 78%)',
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

export const Grain: React.FC<{o?: number}> = ({o = 0.07}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        backgroundImage: `url(${staticFile('grain.png')})`,
        backgroundSize: '480px 480px',
        backgroundPosition: `${(f * 137) % 480}px ${(f * 263) % 480}px`,
        opacity: o,
        mixBlendMode: 'overlay',
      }}
    />
  );
};

// ---------- ícones de traço (viewBox 48) ----------
export const ICON: Record<string, string> = {
  heart: 'M24 41 C10 31 4 24 4 16 C4 10 9 6 14 6 C18 6 22 8 24 12 C26 8 30 6 34 6 C39 6 44 10 44 16 C44 24 38 31 24 41 Z',
  comment: 'M24 6 C35 6 43 13 43 22 C43 31 35 38 24 38 C21 38 18 37.4 15.5 36.4 L6 41 L8.6 32.6 C6.3 29.6 5 26 5 22 C5 13 13 6 24 6 Z',
  send: 'M44 5 L4 20.5 L19.5 27 L26.5 43 Z M19.5 27 L44 5',
  check: 'M11 25 L20 34 L37 15',
  book: 'M24 12 C20 9 14 8 7 8 V37 C14 37 20 38 24 41 C28 38 34 37 41 37 V8 C34 8 28 9 24 12 Z M24 12 V41',
  list: 'M8 13 L11.5 16.5 L18 9.5 M24 13 H41 M8 25 L11.5 28.5 L18 21.5 M24 25 H41 M8 37 L11.5 40.5 L18 33.5 M24 37 H41',
  course: 'M6 9 H42 V33 H6 Z M17 41 H31 M24 33 V41 M20.5 15.5 L29.5 21 L20.5 26.5 Z',
  mentor: 'M6 8 H29 V25 H18 L11 31 V25 H6 Z M34 17 H42 V34 H38 V40 L31 34 H21 V30',
  brief: 'M6 16 H42 V40 H6 Z M17 16 V10 H31 V16 M6 27 H42 M21 27 V31 H27 V27',
  door: 'M8 43 H40 M13 43 V6 H35 V43 M13 6 L27 11 V47 L13 43 M22 27 V30',
  path: 'M24 45 V7 M24 11 H38 L43 16 L38 21 H24 M24 26 H10 L5 31 L10 36 H24',
  megaphone: 'M7 20 V29 H14 L31 39 V10 L14 20 Z M37 18 C40 21 40 28 37 31 M14 29 L17 41 H23 L21 30',
  bulb: 'M24 5 C16 5 10.5 11 10.5 18.5 C10.5 23.5 13.5 27 17 30 V35 H31 V30 C34.5 27 37.5 23.5 37.5 18.5 C37.5 11 32 5 24 5 Z M18 40 H30 M20.5 44.5 H27.5',
  trophy: 'M14 7 H34 V18 C34 25 30 29.5 24 29.5 C18 29.5 14 25 14 18 Z M14 11 H7 C7 18 10 21.5 15 22.5 M34 11 H41 C41 18 38 21.5 33 22.5 M24 29.5 V37 M16 42 H32 M19 37 H29',
  folder: 'M5 11 H19 L23 15.5 H43 V39 H5 Z',
  store: 'M9 23 V41 H39 V23 M6 19 L10 7 H38 L42 19 C42 22 39.5 24 36 24 C33 24 30 22 30 19 C30 22 27 24 24 24 C21 24 18 22 18 19 C18 22 15 24 12 24 C8.5 24 6 22 6 19 Z M20 41 V31 H28 V41',
  phone: 'M15 4 H33 A3 3 0 0 1 36 7 V41 A3 3 0 0 1 33 44 H15 A3 3 0 0 1 12 41 V7 A3 3 0 0 1 15 4 Z M21 38.5 H27',
  shield: 'M24 4 L40 10 V22 C40 32 33 40 24 44 C15 40 8 32 8 22 V10 Z M16 24 L22 30 L33 18',
  camoff: 'M6 14 H12 L16 9 H32 L36 14 H42 V38 H6 Z M24 20 A6.5 6.5 0 1 0 24.01 20 M5 5 L43 43',
  loop: 'M38.5 24 A14.5 14.5 0 1 1 31 11.4 M31 3.5 V12 H39.5',
  up: 'M24 41 V9 M11 22 L24 9 L37 22',
  eye: 'M3 24 C9 13 16 9 24 9 C32 9 39 13 45 24 C39 35 32 39 24 39 C16 39 9 35 3 24 Z M24 17.5 A6.5 6.5 0 1 0 24.01 17.5',
};

export const Icon: React.FC<{n?: string; d?: string; size?: number; color?: string; fill?: string; w?: number}> = ({n, d, size = 48, color = C.white, fill = 'none', w = 3.2}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" style={{overflow: 'visible', display: 'block'}}>
    <path d={d ?? ICON[n ?? 'check']} fill={fill} stroke={color} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" />
  </svg>
);

export const Clock: React.FC<{size?: number; color?: string; p?: number}> = ({size = 48, color = C.white, p = 0}) => {
  const a = -Math.PI / 2 + p * Math.PI * 2;
  const b = -Math.PI / 2 + (p / 12) * Math.PI * 2;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{display: 'block'}}>
      <circle cx={24} cy={24} r={19} fill="none" stroke={color} strokeWidth={3.2} />
      <path d={`M24 24 L${24 + Math.cos(a) * 13} ${24 + Math.sin(a) * 13}`} stroke={color} strokeWidth={3.2} strokeLinecap="round" />
      <path d={`M24 24 L${24 + Math.cos(b) * 8} ${24 + Math.sin(b) * 8}`} stroke={color} strokeWidth={3.6} strokeLinecap="round" />
    </svg>
  );
};

export const starPath = (cx: number, cy: number, r: number, inner = 0.44) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * inner;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(2)} ${(cy + Math.sin(a) * rr).toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
};

// avatar genérico (silhueta) ou foto
export const Avatar: React.FC<{size: number; hue?: number; dim?: number; ring?: string; ringW?: number; img?: string}> = ({size, hue = 220, dim = 0, ring, ringW = 4, img}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size,
      overflow: 'hidden',
      background: `linear-gradient(160deg, hsl(${hue} 70% ${62 - dim * 30}%), hsl(${hue + 30} 65% ${42 - dim * 22}%))`,
      boxShadow: ring ? `0 0 0 ${ringW}px ${ring}` : undefined,
      filter: dim > 0 ? `grayscale(${dim})` : undefined,
      position: 'relative',
      flexShrink: 0,
    }}
  >
    {img ? (
      <Img src={staticFile(img)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    ) : (
      <svg width={size} height={size} viewBox="0 0 100 100" style={{position: 'absolute', left: 0, top: 0}}>
        <circle cx={50} cy={40} r={17} fill="rgba(255,255,255,0.88)" />
        <path d="M18 92 C20 70 34 62 50 62 C66 62 80 70 82 92 Z" fill="rgba(255,255,255,0.88)" />
      </svg>
    )}
  </div>
);

export const Chip: React.FC<{children: React.ReactNode; style?: React.CSSProperties; tone?: 'dark' | 'gold' | 'light' | 'red'}> = ({children, style, tone = 'dark'}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 24px 11px',
      borderRadius: 999,
      fontFamily: SANS,
      fontWeight: 800,
      fontSize: 30,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      color: tone === 'dark' || tone === 'red' ? C.white : C.ink,
      background: tone === 'gold' ? GRAD : tone === 'light' ? '#fff' : tone === 'red' ? '#E5484D' : 'rgba(8,12,22,0.8)',
      border: tone === 'dark' ? '1.5px solid rgba(255,255,255,0.16)' : undefined,
      boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
      ...style,
    }}
  >
    {children}
  </div>
);

// ---------- "escada do digital": 5 etapas que vão acendendo ao longo do vídeo ----------
export const STEPS = ['Exposição', 'Autoridade', 'Confiança', 'Clientes', 'Escala'];
export const Stepper: React.FC<{active: number; f: number; shade?: boolean}> = ({active, f, shade}) => {
  const a = ramp(f, 2, 10);
  const blink = pop(f, 4, 11);
  return (
    <>
      {shade ? <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 420, background: 'linear-gradient(to bottom, rgba(7,10,18,0.86) 0%, rgba(7,10,18,0.6) 62%, rgba(7,10,18,0) 100%)'}} /> : null}
      <div style={{position: 'absolute', left: 0, right: 0, top: 232, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: a}}>
        <div style={{display: 'flex', alignItems: 'center'}}>
          {STEPS.map((_, i) => {
            const done = i + 1 < active;
            const cur = i + 1 === active;
            const sz = cur ? 30 : 18;
            return (
              <React.Fragment key={i}>
                {i > 0 ? <div style={{width: 74, height: 4, borderRadius: 2, background: i + 1 <= active ? C.gold : 'rgba(255,255,255,0.22)'}} /> : null}
                <div
                  style={{
                    width: sz,
                    height: sz,
                    borderRadius: sz,
                    background: done || cur ? C.gold : 'rgba(255,255,255,0.22)',
                    boxShadow: cur ? `0 0 0 ${6 * blink}px rgba(255,200,61,0.28), 0 0 24px rgba(255,200,61,0.8)` : 'none',
                    scale: cur ? String(0.6 + blink * 0.4) : '1',
                  }}
                />
              </React.Fragment>
            );
          })}
        </div>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 26, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.white, textShadow: '0 2px 10px rgba(0,0,0,0.6)'}}>
          <span style={{color: C.gold}}>{active}/5</span> · {STEPS[active - 1]}
        </div>
      </div>
    </>
  );
};

// ---------- câmera sobre foto (coordenadas da imagem original) ----------
export type CamKey = {f: number; z: number; cx: number; cy: number};
const camAt = (f: number, keys: CamKey[]) => {
  if (f <= keys[0].f) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (f <= b.f) {
      const p = interpolate(f, [a.f, b.f], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)});
      return {f, z: a.z + (b.z - a.z) * p, cx: a.cx + (b.cx - a.cx) * p, cy: a.cy + (b.cy - a.cy) * p};
    }
  }
  return keys[keys.length - 1];
};
export const PhotoCam: React.FC<{src: string; iw: number; ih: number; vw?: number; vh: number; keys: CamKey[]; f: number; filter?: string; children?: React.ReactNode}> = ({
  src,
  iw,
  ih,
  vw = 1080,
  vh,
  keys,
  f,
  filter,
  children,
}) => {
  const {z, cx, cy} = camAt(f, keys);
  const S = Math.max(vw / iw, vh / ih) * z;
  const x = Math.min(0, Math.max(vw - iw * S, vw / 2 - cx * S));
  const y = Math.min(0, Math.max(vh - ih * S, vh / 2 - cy * S));
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: iw, height: ih, transformOrigin: '0 0', transform: `translate(${x}px, ${y}px) scale(${S})`}}>
        <Img src={staticFile(src)} style={{position: 'absolute', width: iw, height: ih, filter}} />
        {children}
      </div>
    </AbsoluteFill>
  );
};
