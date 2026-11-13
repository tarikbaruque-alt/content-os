import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import Q from '../data/citacoes.json';
import {C, clamp, GRAD, SANS, SERIF} from '../theme';

export const ease = {...clamp, easing: Easing.out(Easing.cubic)};
export const easeIO = {...clamp, easing: Easing.inOut(Easing.cubic)};
export const ramp = (f: number, a: number, len = 10) => interpolate(f, [a, a + len], [0, 1], ease);
export const pop = (f: number, at: number, damping = 13) => spring({frame: f - at, fps: 30, config: {damping, stiffness: 170, mass: 0.6}});
export const fadeOut = (f: number, at: number, len = 8) => interpolate(f, [at, at + len], [1, 0], clamp);

// ---------- fundo editorial escuro (azul/roxo bem sutil) ----------
export const Bg: React.FC<{glow?: number; children?: React.ReactNode}> = ({glow = 1, children}) => {
  const f = useCurrentFrame();
  const d = Math.sin(f / 40) * 30;
  return (
    <AbsoluteFill style={{backgroundColor: C.bg, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 700px at ${180 + d}px 240px, rgba(0,100,224,${0.32 * glow}), rgba(0,0,0,0) 70%), radial-gradient(800px 700px at ${940 - d}px 900px, rgba(107,63,224,${0.24 * glow}), rgba(0,0,0,0) 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1.4px, transparent 1.6px)',
          backgroundSize: '36px 36px',
          maskImage: 'radial-gradient(ellipse at 50% 40%, black 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, black 20%, transparent 75%)',
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

// ---------- ícones (viewBox 48) ----------
export const ICON = {
  heart: 'M24 41 C10 31 4 24 4 16 C4 10 9 6 14 6 C18 6 22 8 24 12 C26 8 30 6 34 6 C39 6 44 10 44 16 C44 24 38 31 24 41 Z',
  comment: 'M24 6 C35 6 43 13 43 22 C43 31 35 38 24 38 C21 38 18 37.4 15.5 36.4 L6 41 L8.6 32.6 C6.3 29.6 5 26 5 22 C5 13 13 6 24 6 Z',
  send: 'M44 5 L4 20.5 L19.5 27 L26.5 43 Z M19.5 27 L44 5',
  check: 'M11 25 L20 34 L37 15',
};

export const Icon: React.FC<{d: string; size?: number; color?: string; fill?: string; w?: number}> = ({d, size = 48, color = C.white, fill = 'none', w = 3.4}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" style={{overflow: 'visible'}}>
    <path d={d} fill={fill} stroke={color} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" />
  </svg>
);

export const Clock: React.FC<{size?: number; color?: string; p?: number}> = ({size = 48, color = C.white, p = 0}) => {
  const a = -Math.PI / 2 + p * Math.PI * 2;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <circle cx={24} cy={24} r={18} fill="none" stroke={color} strokeWidth={3.4} />
      <path d={`M24 24 L${24 + Math.cos(a) * 11} ${24 + Math.sin(a) * 11}`} stroke={color} strokeWidth={3.4} strokeLinecap="round" />
      <path d="M24 24 L24 15" stroke={color} strokeWidth={3.4} strokeLinecap="round" />
    </svg>
  );
};

// selo de verificado (azul)
const scallop = (cx: number, cy: number, r: number, n = 12, inner = 0.88) => {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / n;
    const rr = i % 2 === 0 ? r : r * inner;
    pts.push(`${(cx + Math.cos(ang) * rr).toFixed(2)} ${(cy + Math.sin(ang) * rr).toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
};
export const Verified: React.FC<{size?: number}> = ({size = 34}) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <path d={scallop(24, 24, 22)} fill="#1D9BF0" strokeLinejoin="round" stroke="#1D9BF0" strokeWidth={3} />
    <path d="M15 24.5 L21.5 31 L33.5 18" fill="none" stroke="#fff" strokeWidth={4.4} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// avatar genérico (silhueta), com cor por pessoa
export const Avatar: React.FC<{size: number; hue?: number; dim?: number; ring?: string; ringW?: number; img?: string}> = ({size, hue = 220, dim = 0, ring, ringW = 4, img}) => {
  const c1 = `hsl(${hue} 70% ${62 - dim * 30}%)`;
  const c2 = `hsl(${hue + 30} 65% ${42 - dim * 22}%)`;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size,
        overflow: 'hidden',
        background: `linear-gradient(160deg, ${c1}, ${c2})`,
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
};

export const MetaLogo: React.FC<{h: number; variant?: 'branco' | 'cor' | 'simbolo'; style?: React.CSSProperties}> = ({h, variant = 'branco', style}) => {
  const src = variant === 'simbolo' ? 'img/meta_simbolo.png' : variant === 'cor' ? 'img/meta_logo_cor.png' : 'img/meta_logo_branco.png';
  const ratio = variant === 'simbolo' ? 466 / 313 : 1504 / 313;
  return <Img src={staticFile(src)} style={{height: h, width: h * ratio, display: 'block', ...style}} />;
};

// selo pequeno, discreto
export const Chip: React.FC<{children: React.ReactNode; style?: React.CSSProperties; tone?: 'dark' | 'blue' | 'light'}> = ({children, style, tone = 'dark'}) => (
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
      color: tone === 'light' ? C.ink : C.white,
      background: tone === 'blue' ? GRAD : tone === 'light' ? '#fff' : 'rgba(10,16,34,0.78)',
      border: tone === 'dark' ? '1.5px solid rgba(255,255,255,0.16)' : undefined,
      boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
      ...style,
    }}
  >
    {children}
  </div>
);

// ---------- citação real do comunicado (pixels originais, linhas recompostas) ----------
type QName = 'q_sejamos' | 'q_sinais' | 'q_porisso';
type QData = {w: number; h: number; words: {t: string; x0: number; x1: number; y0: number; y1: number}[]};
export type HL = {from: number; to: number; at: number; len: number};

export const QuoteCard: React.FC<{name: QName; width: number; hl: HL[]; f: number; header?: boolean}> = ({name, width, hl, f, header = true}) => {
  const q = (Q as unknown as Record<QName, QData>)[name];
  const pad = 40;
  const inner = width - pad * 2;
  const s = inner / q.w;
  return (
    <div style={{width, borderRadius: 28, background: C.paper, boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 2px 0 rgba(255,255,255,0.4) inset', padding: `${pad - 6}px ${pad}px ${pad - 10}px`, position: 'relative'}}>
      {header ? (
        <div style={{display: 'flex', alignItems: 'center', gap: 18, marginBottom: 20}}>
          <MetaLogo h={34} variant="cor" />
          <div style={{width: 2, height: 30, background: 'rgba(11,18,32,0.15)'}} />
          <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 24, color: 'rgba(11,18,32,0.6)', letterSpacing: '0.02em'}}>Comunicado oficial · 22/10/2026</div>
        </div>
      ) : null}
      <div style={{position: 'relative', width: inner, height: q.h * s}}>
        <Img src={staticFile(`img/${name}.png`)} style={{position: 'absolute', left: 0, top: 0, width: inner, height: q.h * s}} />
        {hl.map((h, k) => {
          const n = h.to - h.from + 1;
          const p = interpolate(f, [h.at, h.at + h.len], [0, n], {...clamp, easing: Easing.inOut(Easing.sin)});
          return q.words.slice(h.from, h.to + 1).map((w, i) => {
            const fill = Math.max(0, Math.min(1, p - i));
            if (fill <= 0) return null;
            const last = i === n - 1;
            const nx = !last ? q.words[h.from + i + 1] : null;
            const sameLine = nx && Math.abs(nx.y0 - w.y0) < 10;
            const x1 = sameLine ? nx.x0 : w.x1;
            return (
              <div
                key={`${k}-${i}`}
                style={{
                  position: 'absolute',
                  left: (w.x0 - 6) * s,
                  top: (w.y0 + 4) * s,
                  width: (x1 - w.x0 + 12) * s * fill,
                  height: (w.y1 - w.y0 - 2) * s,
                  background: 'rgba(76,155,255,0.34)',
                  mixBlendMode: 'multiply',
                  borderRadius: 4,
                }}
              />
            );
          });
        })}
      </div>
      <div style={{position: 'absolute', left: -14, top: -40, fontFamily: SERIF, fontStyle: 'italic', fontSize: 170, lineHeight: 1, color: C.gold}}>“</div>
    </div>
  );
};

export const Source: React.FC<{o?: number; style?: React.CSSProperties}> = ({o = 1, style}) => (
  <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 22, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.62)', opacity: o, ...style}}>
    Fonte: Newsroom da Meta · 22/10/2026
  </div>
);

// título de seção em dois tons
export const Kicker: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 26, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.gold, ...style}}>{children}</div>
);
