import React from 'react';
import {AbsoluteFill, Sequence, staticFile} from 'remotion';
import {Audio} from '@remotion/media';
import './theme';
import {Captions} from './components/Captions';
import {ARoll, FullLayer, TopPanel, Voice} from './components/Layers';
import {OVERLAYS} from './components/Overlays';
import {MK, SECTIONS, TOTAL} from './timeline';
import {C} from './theme';

const sfx = (n: string) => staticFile(`sfx/${n}.wav`);
const Fx: React.FC<{n: string; at: number; v: number; dur?: number}> = ({n, at, v, dur = 30}) => (
  <Sequence name={`sfx ${n}`} from={Math.max(0, Math.round(at))} durationInFrames={dur} layout="none">
    <Audio src={sfx(n)} volume={v} />
  </Sequence>
);

export const Ep: React.FC = () => {
  // clique suave em toda troca de cena; whoosh discreto só quando um gráfico entra por cima do rosto
  const trocas = SECTIONS.slice(1).map((s) => s.from - 1);
  const whoosh = SECTIONS.filter((s, i) => i > 0 && s.mode !== 'face' && SECTIONS[i - 1].mode === 'face').map((s) => s.from - 3);
  // clique mais marcado em tudo o que ele cita
  const citados = [
    MK.ebook, MK.manual, MK.curso, MK.mentoria, MK.consultoria,
    MK.portas, MK.caminhos, MK.parcerias, MK.collabs, MK.publicidade,
    MK.qualidade, MK.autoridade, MK.assunto, MK.visto,
    MK.captar, MK.clientes, MK.portfólio, MK.cases,
    MK.gostam, MK.acham, MK.faltaTempo, MK.disponibilidade + 18, MK.diga - 3,
  ].map((f) => f - 3);
  const pops = [MK.jornada - 3, MK.antes - 3, MK.seguidores, MK.seguidores + 6, MK.mundo - 3, MK.pergunta - 4, MK.i_falta + 7, MK.talvez - 2];
  const escada = SECTIONS.find((s) => s.scene === 'escada')!.from;
  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      <ARoll />
      <TopPanel />
      <FullLayer />
      {/* base escura bem leve sob a legenda, para ela ficar limpa sobre o vídeo claro */}
      <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(7,10,18,0) 66%, rgba(7,10,18,0.34) 84%, rgba(7,10,18,0.5) 100%)', pointerEvents: 'none'}} />
      {OVERLAYS.map((O, i) => (
        <Sequence key={i} name={`Overlay ${O.name}`} from={0} durationInFrames={TOTAL} layout="none">
          <O />
        </Sequence>
      ))}
      <Captions />
      <Voice />
      {trocas.map((f, i) => (
        <Fx key={`t${i}`} n="tick" at={f} v={0.07} dur={6} />
      ))}
      {whoosh.map((f, i) => (
        <Fx key={`w${i}`} n="whoosh" at={f} v={0.035} dur={20} />
      ))}
      {citados.map((f, i) => (
        <Fx key={`c${i}`} n="click" at={f} v={0.11} dur={8} />
      ))}
      {pops.map((f, i) => (
        <Fx key={`p${i}`} n="pop" at={f} v={0.045} dur={8} />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <Fx key={`e${i}`} n="tick" at={escada + 8 + i * 7} v={0.09} dur={6} />
      ))}
      <Fx n="stamp" at={MK.expert + 4} v={0.12} dur={12} />
      <Fx n="shine" at={MK.escalando - 3} v={0.06} dur={40} />
      <Fx n="click" at={0} v={0.08} dur={8} />
    </AbsoluteFill>
  );
};
