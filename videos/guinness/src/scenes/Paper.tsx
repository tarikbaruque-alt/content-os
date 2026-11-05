import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../theme';

// Fundo de papel envelhecido com moldura dupla.
export const Paper: React.FC<{children?: React.ReactNode; frame?: boolean}> = ({children, frame = true}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 80% 70% at 50% 45%, ${C.parchment} 0%, #dccaa0 60%, #b99d69 100%)`,
    }}
  >
    {children}
    {frame ? (
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        <div style={{position: 'absolute', inset: 36, border: `3px solid ${C.ink}`, opacity: 0.55}} />
        <div style={{position: 'absolute', inset: 50, border: `1px solid ${C.ink}`, opacity: 0.45}} />
      </AbsoluteFill>
    ) : null}
  </AbsoluteFill>
);
