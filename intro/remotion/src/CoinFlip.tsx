import React from 'react';
import {AbsoluteFill, Audio, Img, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {ASPECT, Coin, Grain, Layer, Shine, Sprite, Vignette, beatPulse, clamp, decay, eIn, eInOut, eOut, el, springT} from './lib';

// 10 s coin flip: a paw flicks a big 3D coin into the air, it lands on its edge and spins like a top, wobbles flat,
// then rises to face the camera as a medallion; the bunny bursts out of it, title slam, and the coin spins away.
export const CF = {flick: 0.8, land: 2.3, flat: 3.4, rise: 3.75, burst: 4.1, text: 4.8, out: 9.0, end: 10.0};
export const CF_BEATS = Array.from({length: 9}, (_, i) => 5.0 + 0.5 * i);
const D = 300, T = 30, FLOOR = 850, N = 12;

const faceBase: React.CSSProperties = {position: 'absolute', left: -D / 2, top: -D / 2, width: D, height: D, borderRadius: '50%'};

const CoinFace: React.FC<{back?: boolean; sheen: number}> = ({back, sheen}) => (
  <div style={{...faceBase, backfaceVisibility: 'hidden', transform: back ? `rotateY(180deg) translateZ(${T / 2}px)` : `translateZ(${T / 2}px)`,
    background: 'radial-gradient(circle at 35% 30%, #fff7cc, #ffd046 30%, #e39a2a 68%, #9a5a12 100%)',
    boxShadow: `inset 0 0 0 ${D * 0.035}px #b8701a, inset 0 0 0 ${D * 0.06}px #ffe07a, inset 0 0 0 ${D * 0.075}px #9a5a12`}}>
    <div style={{position: 'absolute', inset: D * 0.12, borderRadius: '50%', border: `${D * 0.012}px dashed rgba(122,61,12,0.7)`,
      background: back ? 'radial-gradient(circle at 40% 35%, #a466ff, #5a1fa8 60%, #2a0c54)' : 'transparent'}} />
    <Img src={el(back ? 'face_mark' : 'paw')} style={back
      ? {position: 'absolute', left: D * 0.34, top: D * 0.24, width: D * 0.32, filter: 'drop-shadow(0 3px 2px rgba(0,0,0,0.5))'}
      : {position: 'absolute', left: D * 0.22, top: D * 0.3, width: D * 0.56, filter: 'drop-shadow(0 4px 3px rgba(90,40,0,0.6))'}} />
    <div style={{position: 'absolute', inset: 0, borderRadius: '50%', mixBlendMode: 'screen',
      background: `linear-gradient(120deg, rgba(255,255,255,0) ${sheen - 18}%, rgba(255,255,255,0.75) ${sheen}%, rgba(255,255,255,0) ${sheen + 18}%)`}} />
  </div>
);

const Coin3D: React.FC<{x: number; y: number; s: number; rx: number; ry: number; rz?: number}> = ({x, y, s, rx, ry, rz = 0}) => {
  const sheen = ((ry + rx) * 0.4) % 160 - 30;
  return (
    <div style={{position: 'absolute', left: x, top: y, transformStyle: 'preserve-3d',
      transform: `perspective(1600px) scale(${s}) rotateZ(${rz}deg) rotateX(${rx}deg) rotateY(${ry}deg)`}}>
      {new Array(N).fill(0).map((_, i) => (
        <div key={i} style={{...faceBase, transform: `translateZ(${-T / 2 + (T * (i + 0.5)) / N}px)`,
          background: `repeating-conic-gradient(#c7801c 0deg 3deg, #f2b233 3deg 6deg)`}} />
      ))}
      <CoinFace sheen={sheen} />
      <CoinFace back sheen={sheen} />
    </div>
  );
};

/** Where the coin is at time t (screen x/y, scale, rotations). */
const coinState = (t: number) => {
  const pawY = 1300 - 420 * eOut(clamp((t - 0.15) / 0.5));
  if (t < CF.flick) return {x: 960, y: pawY - 150, s: 1, rx: 75, ry: 0, rz: 0};
  if (t < CF.land) {
    const p = (t - CF.flick) / (CF.land - CF.flick);
    const y0 = pawY - 150, yl = FLOOR - D / 2;
    return {x: 960 + 60 * Math.sin(Math.PI * p), y: y0 + (yl - y0) * p - 4 * 520 * p * (1 - p), s: 1 + 0.9 * Math.sin(Math.PI * p), rx: 75 + (2160 - 75) * p, ry: 0, rz: 10 * Math.sin(Math.PI * p)};
  }
  if (t < CF.rise) {
    const q = clamp((t - CF.land) / (CF.flat - CF.land));
    let tilt = 86 * eIn(q);
    tilt -= 6 * decay(t, CF.flat, 9) * Math.abs(Math.sin((t - CF.flat) * 30));
    const ry = 900 * eOut(q) + 20 * Math.sin(t * 40) * (1 - q) * clamp((t - CF.land) / 0.1);
    const s = 1 - 0.04 * decay(t, CF.land, 12);
    return {x: 960, y: FLOOR - (D / 2) * s * Math.cos((tilt * Math.PI) / 180), s, rx: tilt, ry, rz: 0};
  }
  const r = springT(t - CF.rise, 7, 12);
  const mv = eInOut(clamp((t - CF.rise) / 0.5));
  let s = 1 + 1.2 * mv, ry = 900 + 180 * r + 14 * Math.sin(t * 0.9) * clamp((t - CF.text) / 1);
  let rx = 86 * (1 - r) + 6 * Math.sin(t * 0.7) * clamp((t - CF.text) / 1);
  if (t >= CF.out) { const o = eIn(clamp((t - CF.out - 0.3) / 0.6)); ry += 900 * o; s *= 1 - o; rx += 20 * o; }
  return {x: 960, y: 840 + (450 - 840) * mv, s, rx, ry, rz: 0};
};

const CoinLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const c = coinState(frame / fps);
  if (c.s <= 0.001) return null;
  return <AbsoluteFill><Coin3D {...c} /></AbsoluteFill>;
};

export const CoinFlip: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const beat = beatPulse(t, CF_BEATS, 0.02);
  const c = coinState(t);
  const pawY = t < 1.0 ? 1300 - 420 * eOut(clamp((t - 0.15) / 0.5)) - 60 * Math.sin(Math.PI * clamp((t - CF.flick + 0.08) / 0.2)) : 880 + 500 * eIn(clamp((t - 1.0) / 0.5));
  const burst = t >= CF.burst;
  const bp = springT(t - CF.burst, 8, 16);
  const shrink = eIn(clamp((t - CF.out) / 0.4));
  const amp = 14 * decay(t, CF.land, 12) + 10 * decay(t, CF.flat, 12) + 30 * decay(t, CF.burst, 8) + 14 * decay(t, CF.text, 10);
  const flash = 0.25 * decay(t, CF.flick, 16) + 0.85 * decay(t, CF.burst, 9) + 0.25 * decay(t, CF.text, 18) + 0.6 * decay(t, CF.out + 0.7, 10) * (t < CF.out + 1.0 ? 1 : 0);
  const ts = springT(t - CF.text, 10, 24);
  const glow = clamp((t - CF.rise) / 0.4) * (1 - clamp((t - CF.out - 0.3) / 0.5));
  // camera: follows the coin up during the flip
  const camY = 160 * Math.sin(Math.PI * clamp((t - CF.flick) / (CF.land - CF.flick))) * 0.8;
  return (
    <AbsoluteFill style={{backgroundColor: 'black', overflow: 'hidden'}}>
      <Audio src={staticFile('sfx_coinflip.wav')} />
      <AbsoluteFill style={{transform: `translate(${amp * Math.sin(t * 97)}px, ${camY + amp * Math.cos(t * 83)}px) scale(${1.02 + 0.05 * clamp((t - CF.text) / 4.2)})`}}>
        <div style={{position: 'absolute', left: -100, top: -400, width: 2120, height: 1880, background: 'radial-gradient(ellipse at 50% 40%, #2e0f5c 0%, #12052a 45%, #040108 80%)'}} />
        {/* spotlight cone + glossy floor */}
        <div style={{position: 'absolute', left: 960 - 600, top: -200, width: 1200, height: 1100, opacity: 0.35 * (1 - glow * 0.6),
          background: 'linear-gradient(180deg, rgba(255,230,170,0.5), rgba(255,230,170,0))', clipPath: 'polygon(42% 0, 58% 0, 100% 100%, 0 100%)'}} />
        <div style={{position: 'absolute', left: 0, top: FLOOR, width: 1920, height: 400, background: 'linear-gradient(180deg, #1a0833, #050109)'}} />
        <div style={{position: 'absolute', left: 960 - 560, top: FLOOR - 70, width: 1120, height: 140, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255,215,130,0.35), rgba(0,0,0,0) 70%)', opacity: 1 - glow}} />
        {t >= CF.land && t < CF.rise + 0.4 && <div style={{position: 'absolute', left: 960 - 170, top: FLOOR - 16, width: 340, height: 32, borderRadius: '50%',
          background: 'rgba(0,0,0,0.6)', filter: 'blur(8px)', opacity: 1 - clamp((t - CF.rise) / 0.4)}} />}
        {/* medallion glow, rays and energy ring behind the risen coin */}
        {glow > 0 && <>
          <div style={{position: 'absolute', left: 960 - 1500, top: 450 - 1500, width: 3000, height: 3000, opacity: 0.7 * glow * (1 + 5 * beat), transform: `rotate(${t * 9}deg)`,
            background: 'repeating-conic-gradient(from 0deg, rgba(255,210,110,0.3) 0deg 4deg, rgba(0,0,0,0) 4deg 12deg)', mixBlendMode: 'screen',
            WebkitMaskImage: 'radial-gradient(circle, black 5%, transparent 50%)', maskImage: 'radial-gradient(circle, black 5%, transparent 50%)'}} />
          <Img src={el('back_frame')} style={{position: 'absolute', left: 960 - 520, top: 450 - 420, width: 1040, height: 840, opacity: glow * 0.9,
            transform: `rotate(${-t * 30}deg) scale(${(0.6 + 0.4 * eOut(clamp((t - CF.rise) / 0.6))) * (1 + beat)})`, mixBlendMode: 'screen'}} />
        </>}
        {t < 1.6 && <Sprite src="paw" x={960} y={pawY} w={380} rot={-6 * Math.sin(Math.PI * clamp((t - CF.flick + 0.08) / 0.2))}
          filter="drop-shadow(0 10px 18px rgba(0,0,0,0.6))" />}
        <AbsoluteFill style={{filter: `drop-shadow(0 20px 30px rgba(0,0,0,0.6)) drop-shadow(0 0 ${14 + 40 * glow}px rgba(255,200,90,${0.35 + 0.4 * glow}))`}}>
          <CameraMotionBlur shutterAngle={180} samples={4}><CoinLayer /></CameraMotionBlur>
        </AbsoluteFill>
        {t >= CF.flick && t < CF.flick + 0.4 && new Array(8).fill(0).map((_, i) => {
          const p = (t - CF.flick) / 0.4, a = -Math.PI / 2 + (i - 3.5) * 0.3;
          return <Sprite key={i} src="effect_05" x={960 + (120 + 260 * eOut(p)) * Math.cos(a)} y={c.y + 60 + (120 + 260 * eOut(p)) * Math.sin(a)} w={80} rot={a * 57.3 + 90} opacity={1 - p} blend="screen" />;
        })}
        {[CF.land, CF.flat].map((ti, k) => t >= ti && t < ti + 0.5 && new Array(10).fill(0).map((_, i) => {
          const p = (t - ti) / 0.5, dir = i % 2 ? 1 : -1, sp = 120 + 380 * random(`sp${k}${i}`);
          return <div key={`${k}${i}`} style={{position: 'absolute', left: 960 + dir * sp * eOut(p), top: FLOOR - 10 - 90 * Math.sin(Math.PI * p) * random(`sh${k}${i}`),
            width: 8, height: 8, borderRadius: 4, background: '#ffe07a', opacity: 1 - p, boxShadow: '0 0 10px #ffc93a'}} />;
        }))}
        {/* burst: shards + streaks as the bunny breaks out of the coin */}
        {burst && t < CF.burst + 0.7 && new Array(18).fill(0).map((_, i) => {
          const p = (t - CF.burst) / 0.7, a = (i / 18) * Math.PI * 2 + 0.2, r = 180 + 800 * eOut(p);
          return <Sprite key={i} src={['effect_03', 'effect_09', 'effect_05', 'effect_12'][i % 4]} x={960 + r * Math.cos(a)} y={450 + r * Math.sin(a) * 0.8} w={150}
            rot={a * 57.3 + 30} opacity={1 - p} blend="screen" />;
        })}
        {burst && [0, 1, 2, 3, 4, 5].map((i) => {
          const th = (i / 6) * Math.PI * 2 + t * 0.9;
          return <Coin key={i} x={960 + 690 * Math.cos(th)} y={470 + 230 * Math.sin(th)} w={70 + 30 * (Math.sin(th) + 1) / 2} phase={t * 10 + i}
            opacity={clamp((t - CF.burst - 0.2) / 0.5) * (1 - clamp((t - CF.out) / 0.4))} />;
        })}
        {burst && (
          <Layer src="character" x={960} y={430 + 8 * Math.sin(t * 2.2) * clamp((t - CF.text) / 0.5)} w={660} aspect={ASPECT.character}
            transform={`scale(${(0.2 + 0.8 * bp) * (1 + beat) * (1 - shrink)}) rotate(${-6 * (1 - clamp(bp)) + 2 * Math.sin(t * 1.2)}deg)`}
            filter={`drop-shadow(0 0 ${26 + 60 * beat}px rgba(255,205,90,0.8)) drop-shadow(0 24px 28px rgba(0,0,0,0.6))`}>
            <Shine src="character" t={t} at={[5.6, 7.5]} />
          </Layer>
        )}
        {t >= CF.text && (
          <Layer src="logo_text" x={960} y={880} w={740} aspect={ASPECT.logo_text} transform={`scale(${(2.3 - 1.3 * ts) * (1 + beat) * (1 - shrink)})`}
            opacity={clamp(ts * 5)} filter="drop-shadow(0 0 20px rgba(255,205,70,0.6)) drop-shadow(0 14px 18px rgba(0,0,0,0.75))">
            <Shine src="logo_text" t={t} at={[5.3, 6.9, 8.3]} />
          </Layer>
        )}
      </AbsoluteFill>
      <Vignette strength={0.7} />
      <Grain frame={frame} opacity={0.06} />
      <AbsoluteFill style={{backgroundColor: 'rgb(255,242,210)', opacity: flash}} />
      <AbsoluteFill style={{backgroundColor: 'black', opacity: Math.max(1 - clamp(t / 0.35), clamp((t - CF.out - 0.75) / 0.2))}} />
    </AbsoluteFill>
  );
};
