import React from 'react';
import {AbsoluteFill, Composition, OffthreadVideo, staticFile} from 'remotion';
import './theme';
import {Ep} from './Ep';
import {TOTAL} from './timeline';
import {C, GRAD, SANS} from './theme';
import {MetaLogo} from './components/Kit';

// Capa do Reels: rosto como protagonista, manchete legível no feed (área segura 3:4), logo da Meta de apoio.
const Capa: React.FC<{take: number; t: number}> = ({take, t}) => (
  <AbsoluteFill style={{backgroundColor: C.bg}}>
    <OffthreadVideo src={staticFile(`takes/t${String(take).padStart(2, '0')}.mp4`)} startFrom={Math.round(t * 30)} muted style={{width: 1080, height: 1920, filter: 'contrast(1.06) saturate(1.05)'}} />
    <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(6,10,21,0.7) 0%, rgba(6,10,21,0) 24%, rgba(6,10,21,0) 52%, rgba(6,10,21,0.88) 74%, rgba(6,10,21,0.95) 100%)'}} />
    <div style={{position: 'absolute', left: 0, right: 0, top: 270, display: 'flex', justifyContent: 'center'}}>
      <div style={{padding: '16px 30px', borderRadius: 999, background: 'rgba(255,255,255,0.95)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)'}}>
        <MetaLogo h={46} variant="cor" />
      </div>
    </div>
    <div style={{position: 'absolute', left: 50, right: 50, top: 1215, textAlign: 'center', fontFamily: SANS, fontWeight: 900, lineHeight: 1.0, color: C.white, textShadow: '0 6px 26px rgba(0,0,0,0.5)'}}>
      <div style={{fontSize: 92}}>A META DEU</div>
      <div style={{fontSize: 92}}>ESPERANÇA AOS</div>
      <div style={{display: 'inline-block', marginTop: 14, padding: '6px 26px 10px', borderRadius: 18, background: GRAD, fontSize: 98, boxShadow: '0 14px 40px rgba(0,100,224,0.45)', rotate: '-1.5deg'}}>MEROS MORTAIS!</div>
    </div>
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Ep" component={Ep} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="Capa" component={Capa} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{take: 1, t: 2.4}} />
  </>
);
