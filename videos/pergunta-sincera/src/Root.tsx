import React from 'react';
import {AbsoluteFill, Composition, OffthreadVideo, staticFile} from 'remotion';
import './theme';
import {Ep} from './Ep';
import {TOTAL} from './timeline';
import {C, COND, GRAD} from './theme';

// Capa do Reels: mesmo layout da abertura, com um quadro de rosto mais simpático.
const Capa: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill style={{backgroundColor: C.bg}}>
    <OffthreadVideo src={staticFile('takes/t01.mp4')} startFrom={Math.round(t * 30)} muted style={{width: 1080, height: 1920, filter: 'contrast(1.07) saturate(1.08)'}} />
    <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(7,10,18,0) 46%, rgba(7,10,18,0.8) 62%, rgba(7,10,18,0.94) 100%)'}} />
    <div style={{position: 'absolute', left: 0, right: 0, top: 1068, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <div style={{padding: '10px 30px 8px', borderRadius: 14, background: GRAD, fontFamily: COND, fontSize: 58, letterSpacing: '0.05em', color: C.ink, rotate: '-2deg', boxShadow: '0 12px 34px rgba(0,0,0,0.45)'}}>PERGUNTA SINCERA</div>
      <div style={{marginTop: 26, textAlign: 'center', fontFamily: COND, fontSize: 112, lineHeight: 1.08, letterSpacing: '0.01em', color: C.white, textShadow: '0 6px 26px rgba(0,0,0,0.6)'}}>
        <div>O QUE FALTA PRA VOCÊ</div>
        <div>
          COMEÇAR NO <span style={{background: GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>DIGITAL?</span>
        </div>
      </div>
    </div>
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Ep" component={Ep} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="Capa" component={Capa} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{t: 91.9}} />
  </>
);
