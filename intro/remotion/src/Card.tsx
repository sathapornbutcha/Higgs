import React from 'react';
import {AbsoluteFill, Audio, Img, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {ASPECT, Coin, Grain, Layer, ORANGE, PURPLE, Shine, Sprite, Vignette, beatPulse, clamp, decay, eIn, eInOut, eOut, el, springT} from './lib';

// 10 s collectible-card reveal: a card spins in showing its back, flips to a holographic front,
// the bunny breaks out of the card frame, title slam, shimmering hold, the card spins away.
export const CD = {flip: 1.7, breakout: 3.2, text: 4.6, out: 9.0, end: 10.0};
export const CD_BEATS = Array.from({length: 9}, (_, i) => 5.0 + 0.5 * i);
const CW = 560, CH = 780;
const WIN = {x: 40, y: 40, w: CW - 80, h: 470};

const CardBack: React.FC<{t: number}> = ({t}) => (
  <div style={{position: 'absolute', inset: 0, borderRadius: 34, overflow: 'hidden', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
    background: 'radial-gradient(circle at 50% 45%, #5a1fa8, #1c0838 70%)', boxShadow: 'inset 0 0 0 10px #f2c14e, inset 0 0 0 16px #6b2bc4'}}>
    <div style={{position: 'absolute', inset: 30, borderRadius: 24, backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,205,70,0.12) 0 12px, transparent 12px 36px)'}} />
    <div style={{position: 'absolute', left: CW / 2 - 150, top: CH / 2 - 150, width: 300, height: 300, borderRadius: '50%', border: '6px solid rgba(255,205,70,0.8)',
      transform: `rotate(${t * 40}deg)`, borderStyle: 'dashed'}} />
    <Coin x={CW / 2} y={CH / 2} w={210} phase={t * 8} />
  </div>
);

const CardFront: React.FC<{t: number; charOut: number}> = ({t, charOut}) => {
  const holo = (t * 60) % 400;
  return (
    <div style={{position: 'absolute', inset: 0, borderRadius: 34, overflow: 'hidden', backfaceVisibility: 'hidden',
      background: 'linear-gradient(160deg, #f7d77a, #e39a2a)', boxShadow: '0 0 0 3px #fff3c4 inset'}}>
      <div style={{position: 'absolute', left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, borderRadius: 18, overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 50%, #7b35e0, #220944 80%)', boxShadow: 'inset 0 0 0 4px #3b1370'}}>
        <Img src={el('back_frame')} style={{position: 'absolute', left: -60, top: -40, width: WIN.w + 120, height: WIN.h + 80, transform: `rotate(${t * 20}deg)`, opacity: 0.9}} />
        <Img src={el('character')} style={{position: 'absolute', left: 10, top: 30, width: WIN.w - 20, opacity: 1 - charOut}} />
      </div>
      <div style={{position: 'absolute', left: 30, top: WIN.y + WIN.h + 22, width: CW - 60, height: 150, borderRadius: 14, background: 'linear-gradient(180deg, #2a0c54, #140528)',
        boxShadow: 'inset 0 0 0 3px #f2c14e', opacity: 1 - charOut}}>
        <Img src={el('logo_text')} style={{position: 'absolute', left: 30, top: 18, width: CW - 120}} />
      </div>
      {[0, 1, 2].map((i) => <div key={i} style={{position: 'absolute', left: CW / 2 - 60 + i * 45, top: CH - 50, width: 22, height: 22, transform: 'rotate(45deg)',
        background: i === 1 ? `rgb(${ORANGE})` : `rgb(${PURPLE})`, boxShadow: '0 0 10px white'}} />)}
      <div style={{position: 'absolute', inset: 0, mixBlendMode: 'color-dodge', opacity: 0.45,
        background: 'linear-gradient(115deg, rgba(255,0,150,0.6), rgba(0,220,255,0.6) 25%, rgba(255,240,0,0.6) 50%, rgba(140,60,255,0.6) 75%, rgba(255,0,150,0.6))',
        backgroundSize: '400% 400%', backgroundPosition: `${holo}% 50%`}} />
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(110deg, rgba(255,255,255,0) ${holo / 4 - 20}%, rgba(255,255,255,0.55) ${holo / 4}%, rgba(255,255,255,0) ${holo / 4 + 12}%)`}} />
    </div>
  );
};

const CardObj: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const inP = eOut(clamp(t / 1.3));
  let ry = 900 * (1 - inP) + 180;                       // spins in, lands showing the back
  if (t >= CD.flip) ry = 180 - 180 * springT(t - CD.flip, 7, 16);
  const breakout = eInOut(clamp((t - CD.breakout) / 1.0));
  let rx = 6 * Math.sin(t * 1.2), rz = 3 * Math.sin(t * 0.9);
  let scale = (0.25 + 0.75 * inP) * (1 + 0.15 * clamp((t - CD.flip) / 1.4) + 0.25 * breakout);
  let y = 10 * Math.sin(t * 1.6) * (1 - breakout);
  if (t >= CD.out) {
    const q = eIn(clamp((t - CD.out) / 0.7));
    ry += 540 * q; scale *= 1 - q; rx += 30 * q;
  }
  ry += 8 * Math.sin(t * 0.8) * clamp((t - CD.flip - 0.8) / 0.5) * (1 - breakout);
  rx += 62 * breakout;            // after the breakout the card tips back into a stage under the bunny
  rz *= 1 - breakout;
  y += 250 * breakout - 30 * breakout;
  return (
    <AbsoluteFill style={{opacity: 1 - 0.45 * breakout, filter: `drop-shadow(0 40px 50px rgba(0,0,0,0.6)) drop-shadow(0 0 30px rgba(${PURPLE},0.6))`}}>
      <div style={{position: 'absolute', left: 960 - CW / 2, top: 540 - CH / 2 - 20, width: CW, height: CH, transformStyle: 'preserve-3d',
        transform: `perspective(2000px) translateY(${y}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale})`}}>
        <CardFront t={t} charOut={clamp((t - CD.breakout) / 0.15)} />
        <CardBack t={t} />
      </div>
    </AbsoluteFill>
  );
};

const Breakout: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < CD.breakout) return null;
  const p = eOut(clamp((t - CD.breakout) / 0.9));
  const s = springT(t - CD.breakout - 0.5, 8, 18);
  const beat = beatPulse(t, CD_BEATS, 0.02);
  const out = eIn(clamp((t - CD.out) / 0.5));
  const w = 520 + 240 * p;
  const y = 330 - 20 * p + 8 * Math.sin(t * 2.2) * clamp((t - CD.text) / 0.5) - 900 * out;
  return (
    <Layer src="character" x={960} y={y} w={w} aspect={ASPECT.character} transform={`scale(${(0.96 + 0.04 * s) * (1 + beat)}) rotate(${-4 * (1 - p) + 2 * Math.sin(t)}deg)`}
      filter={`drop-shadow(0 0 ${28 + 60 * beat}px rgba(${PURPLE},0.85)) drop-shadow(0 30px 34px rgba(0,0,0,0.6))`}>
      <Shine src="character" t={t} at={[5.8, 7.6]} />
    </Layer>
  );
};

export const Card: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const ts = springT(t - CD.text, 10, 24);
  const beat = beatPulse(t, CD_BEATS, 0.02);
  const amp = 22 * decay(t, CD.breakout + 0.3, 8) + 22 * decay(t, CD.text, 10);
  const flash = 0.5 * decay(t, CD.flip + 0.15, 14) + 0.35 * decay(t, CD.breakout, 12) + 0.25 * decay(t, CD.text, 20);
  return (
    <AbsoluteFill style={{backgroundColor: 'black', overflow: 'hidden'}}>
      <Audio src={staticFile('sfx_card.wav')} />
      <AbsoluteFill style={{transform: `translate(${amp * Math.sin(t * 97)}px, ${amp * Math.cos(t * 83)}px) scale(${1 + 0.05 * clamp((t - CD.text) / 4.4)})`}}>
        <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, #3a1270 0%, #120424 55%, #040108 100%)'}} />
        <div style={{position: 'absolute', left: 960 - 1500, top: 540 - 1500, width: 3000, height: 3000, opacity: 0.5 * clamp((t - CD.flip) / 0.5),
          transform: `rotate(${t * 8}deg)`, background: 'repeating-conic-gradient(from 0deg, rgba(255,205,70,0.12) 0deg 6deg, rgba(0,0,0,0) 6deg 15deg)',
          WebkitMaskImage: 'radial-gradient(circle, black 5%, transparent 50%)', maskImage: 'radial-gradient(circle, black 5%, transparent 50%)'}} />
        {new Array(40).fill(0).map((_, i) => {
          const a = (0.3 + 0.5 * Math.max(0, Math.sin(t * 3 + i * 1.7))) * clamp((t - CD.flip) / 0.5);
          const x = random(`sx${i}`) * 1920, y = ((random(`sy${i}`) * 1080 - t * 25) % 1080 + 1080) % 1080, r = 2 + 4 * random(`sr${i}`);
          return <div key={i} style={{position: 'absolute', left: x, top: y, width: 2 * r, height: 2 * r, borderRadius: '50%', background: `rgba(255,220,140,${a})`}} />;
        })}
        {t >= CD.text && new Array(8).fill(0).map((_, i) => {
          const th = (i / 8) * Math.PI * 2 + t * 1.1;
          return <Coin key={i} x={960 + 760 * Math.cos(th)} y={500 + 260 * Math.sin(th)} w={90 + 40 * (Math.sin(th) + 1) / 2} phase={t * 10 + i}
            opacity={clamp((t - CD.text - 0.2) / 0.5) * (1 - clamp((t - CD.out) / 0.4))} />;
        })}
        <AbsoluteFill style={{perspective: 2000}}>
          <CameraMotionBlur shutterAngle={200} samples={4}><CardObj /></CameraMotionBlur>
        </AbsoluteFill>
        <CameraMotionBlur shutterAngle={200} samples={4}><Breakout /></CameraMotionBlur>
        {t >= CD.breakout && t < CD.breakout + 0.6 && new Array(14).fill(0).map((_, i) => {
          const p = (t - CD.breakout) / 0.6, a = random(`sh${i}`) * Math.PI * 2, r = 200 + 700 * eOut(p);
          return <Sprite key={i} src={i % 2 ? 'effect_08' : 'effect_05'} x={960 + r * Math.cos(a)} y={450 + r * Math.sin(a) * 0.7} w={110} rot={a * 57} opacity={1 - p} blend="screen" />;
        })}
        {t >= CD.text && (
          <Layer src="logo_text" x={960} y={880} w={860} aspect={ASPECT.logo_text} transform={`scale(${(2.3 - 1.3 * ts) * (1 + beat)})`}
            opacity={clamp(ts * 5) * (1 - clamp((t - CD.out) / 0.4))} filter="drop-shadow(0 0 20px rgba(255,205,70,0.6)) drop-shadow(0 16px 20px rgba(0,0,0,0.7))">
            <Shine src="logo_text" t={t} at={[5.3, 6.9, 8.3]} />
          </Layer>
        )}
        <Vignette strength={0.7} />
      </AbsoluteFill>
      <Grain frame={frame} opacity={0.06} />
      <AbsoluteFill style={{backgroundColor: 'rgb(255,245,225)', opacity: flash}} />
      <AbsoluteFill style={{backgroundColor: 'black', opacity: Math.max(1 - clamp(t / 0.4), clamp((t - CD.out - 0.6) / 0.3))}} />
    </AbsoluteFill>
  );
};
