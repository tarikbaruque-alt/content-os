import React from 'react';
import {BEBAS, K} from './brand';

// Halter "deitado" sozinho no chão (capa)
export const Dumbbell: React.FC<{w?: number}> = ({w = 600}) => (
  <svg width={w} height={(w * 300) / 600} viewBox="0 0 600 300" style={{overflow: 'visible'}}>
    <defs>
      <linearGradient id="db-bar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="0.5" stopColor={K.cream} />
        <stop offset="1" stopColor="#C9C6B8" />
      </linearGradient>
      <linearGradient id="db-plate" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3B4934" />
        <stop offset="1" stopColor="#1E271B" />
      </linearGradient>
      <filter id="db-sh" x="-30%" y="-80%" width="160%" height="260%">
        <feGaussianBlur stdDeviation="14" />
      </filter>
    </defs>
    <ellipse cx="300" cy="262" rx="270" ry="22" fill="rgba(30,40,24,0.45)" filter="url(#db-sh)" />
    {/* barra */}
    <rect x="150" y="128" width="300" height="40" rx="12" fill="url(#db-bar)" />
    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
      <line key={i} x1={238 + i * 13} y1="132" x2={232 + i * 13} y2="164" stroke="rgba(60,70,50,0.25)" strokeWidth="3" />
    ))}
    {/* anilhas */}
    {[
      [96, 36, 64, 224, 18],
      [40, 66, 58, 164, 16],
      [440, 36, 64, 224, 18],
      [502, 66, 58, 164, 16],
    ].map(([x, y, w2, h2, r], i) => (
      <g key={i}>
        <rect x={x} y={y} width={w2} height={h2} rx={r} fill="url(#db-plate)" />
        <rect x={x + 8} y={y + 10} width={6} height={h2 - 20} rx={3} fill="rgba(255,255,255,0.16)" />
      </g>
    ))}
    <rect x="18" y="120" width="26" height="56" rx="8" fill="url(#db-bar)" />
    <rect x="556" y="120" width="26" height="56" rx="8" fill="url(#db-bar)" />
  </svg>
);

// Balão de pensamento com "?"
export const Thought: React.FC<{size?: number; bg?: string; fg?: string}> = ({size = 150, bg = K.ink, fg = K.cream}) => (
  <svg width={size} height={size} viewBox="0 0 150 150" style={{overflow: 'visible'}}>
    <circle cx="86" cy="62" r="56" fill={bg} />
    <circle cx="30" cy="118" r="13" fill={bg} />
    <circle cx="12" cy="142" r="7" fill={bg} />
    <text x="86" y="92" textAnchor="middle" fontFamily={BEBAS} fontSize="88" fill={fg}>
      ?
    </text>
  </svg>
);

// Esteira em traço
export const Treadmill: React.FC<{w?: number; color?: string}> = ({w = 520, color = K.cream}) => (
  <svg width={w} height={(w * 380) / 560} viewBox="0 0 560 380" style={{overflow: 'visible'}}>
    <g fill="none" stroke={color} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round">
      {/* base / lona */}
      <path d="M40 318 L452 268 Q478 265 482 290 L486 300 Q488 318 468 322 L58 360 Q36 362 34 342 Z" />
      <line x1="90" y1="352" x2="96" y2="368" />
      <line x1="430" y1="318" x2="436" y2="336" />
      {/* coluna */}
      <path d="M450 272 L410 92" />
      {/* painel */}
      <path d="M352 52 L470 30 Q486 28 488 44 L492 70 Q494 84 480 86 L362 106 Q348 108 346 94 L342 70 Q340 56 352 52 Z" />
      {/* corrimão */}
      <path d="M418 128 L300 150" />
    </g>
    {/* linhas de velocidade */}
    <g stroke={color} strokeWidth="6" strokeLinecap="round" opacity="0.55">
      <line x1="120" y1="300" x2="200" y2="290" />
      <line x1="240" y1="285" x2="300" y2="278" />
    </g>
  </svg>
);

// Rosto frustrado
export const Frustrated: React.FC<{size?: number; color?: string; bg?: string}> = ({size = 140, color = K.ink, bg = K.leaf}) => (
  <svg width={size} height={size} viewBox="0 0 140 140">
    <circle cx="70" cy="70" r="64" fill={bg} />
    <g stroke={color} strokeWidth="7" strokeLinecap="round" fill="none">
      <line x1="38" y1="46" x2="58" y2="56" />
      <line x1="102" y1="46" x2="82" y2="56" />
      <path d="M42 100 Q52 90 62 100 Q72 110 82 100 Q92 90 100 100" />
    </g>
    <circle cx="52" cy="70" r="6" fill={color} />
    <circle cx="88" cy="70" r="6" fill={color} />
  </svg>
);

// "Faísca" de incômodo
export const Spark: React.FC<{size?: number; color?: string}> = ({size = 90, color = K.leaf}) => (
  <svg width={size} height={size} viewBox="0 0 90 90">
    <g stroke={color} strokeWidth="7" strokeLinecap="round" fill="none">
      <path d="M45 6 L45 26" />
      <path d="M14 22 L28 36" />
      <path d="M76 22 L62 36" />
      <path d="M22 66 L36 54 L46 66 L58 52 L70 64" />
    </g>
  </svg>
);

export const CommentIcon: React.FC<{size?: number; color?: string}> = ({size = 48, color = K.cream}) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <path d="M24 6 C13 6 5 13 5 22 C5 27 7.5 31 11.5 34 L10 42 L18.5 38 C20.3 38.5 22.1 38.7 24 38.7 C35 38.7 43 31.6 43 22.4 C43 13 35 6 24 6 Z" fill="none" stroke={color} strokeWidth="3.6" strokeLinejoin="round" />
  </svg>
);

export const Arrow: React.FC<{w?: number; color?: string; stroke?: number}> = ({w = 60, color = K.cream, stroke = 5}) => (
  <svg width={w} height={w * 0.5} viewBox="0 0 60 30" style={{overflow: 'visible'}}>
    <g stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <line x1="3" y1="15" x2="55" y2="15" />
      <path d="M42 4 L56 15 L42 26" />
    </g>
  </svg>
);
