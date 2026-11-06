import React from 'react';
import {AbsoluteFill} from 'remotion';
import './fonts';
import {Card} from './components/Card';
import {C, F} from './theme';

// Capa do Reels: painel do garçom + título.
export const Capa: React.FC = () => (
  <AbsoluteFill>
    <Card src="images/painel1.jpg" enter={false} keys={[{f: 0, s: 1, x: 0.5, y: 0.5}]} />
    <AbsoluteFill style={{alignItems: 'center'}}>
      <div style={{position: 'absolute', top: 1385, display: 'flex', flexDirection: 'column', alignItems: 'center', filter: 'drop-shadow(0 10px 22px rgba(0,0,0,0.5))'}}>
        <div style={{WebkitTextStroke: '12px #000', paintOrder: 'stroke fill', fontFamily: F.sans, fontWeight: 900, fontSize: 56, color: C.white, letterSpacing: 1, whiteSpace: 'nowrap', textAlign: 'center'}}>COMO SER UM MARKETEIRO…</div>
        <div style={{WebkitTextStroke: '12px #000', paintOrder: 'stroke fill', fontFamily: F.display, fontSize: 170, lineHeight: 1, color: C.yellow, marginTop: 4}}>INTELIGENTE</div>
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);
