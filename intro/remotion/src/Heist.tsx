import React from 'react';
import {AbsoluteFill, Audio, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {ASPECT, Coin, Grain, Layer, PURPLE, Shine, Sprite, Vignette, beatPulse, clamp, decay, eIn, eInOut, eOut, springT} from './lib';

// 10 s heist story: vault with lasers and a searchlight, the paw sneaks in and snatches a coin,
// alarm, the bunny dashes through scattering the stack, title slam, siren-lit hold, blackout.
export const HS = {sneak: 1.6, grab: 3.0, alarm: 3.4, dash: 4.2, land: 5.0, text: 5.4, out: 9.2, end: 10.0};
export const HS_BEATS = Array.from({length: 16}, (_, i) => +(5.4 + 0.43 * i).toFixed(2)).filter((b) => b < 9.2);
const STACK = {x: 960, y: 700};
const COINS = [
  {dx: 0, dy: -150}, {dx: -55, dy: -95}, {dx: 55, dy: -95}, {dx: -110, dy: -40}, {dx: 0, dy: -40}, {dx: 110, dy: -40},
];

const Floor: React.FC<{t: number; alarm: number}> = ({t, alarm}) => (
  <div style={{position: 'absolute', left: -600, top: 640, width: 3120, height: 900, transformOrigin: '50% 0', transform: 'perspective(900px) rotateX(70deg)',
    backgroundImage: `linear-gradient(rgba(${alarm > 0 ? '255,60,90' : PURPLE},0.55) 2px, transparent 2px), linear-gradient(90deg, rgba(${alarm > 0 ? '255,60,90' : PURPLE},0.55) 2px, transparent 2px)`,
    backgroundSize: '120px 120px', backgroundPosition: `0 ${t * 40}px`, WebkitMaskImage: 'linear-gradient(180deg, transparent, black 30%)',
    maskImage: 'linear-gradient(180deg, transparent, black 30%)'}} />
);

const Lasers: React.FC<{t: number; alarm: number}> = ({t, alarm}) => (
  <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
    <defs><filter id="lz" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="4" result="b" />
      <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
    {[0, 1, 2, 3, 4].map((i) => {
      const a = Math.sin(t * (0.6 + i * 0.13) + i * 1.7) * 0.35;
      const y = 180 + i * 150;
      const on = alarm > 0 ? (Math.floor(t * 8 + i) % 2 === 0 ? 1 : 0.35) : 0.85;
      return <line key={i} x1={-100} y1={y + 400 * a} x2={2020} y2={y - 400 * a} stroke={`rgba(255,40,70,${on})`} strokeWidth={3 + 2 * alarm} filter="url(#lz)" />;
    })}
  </svg>
);

const Sirens: React.FC<{t: number; a: number}> = ({t, a}) => {
  if (a <= 0) return null;
  return (
    <>
      {[{x: 0, c: '255,40,70', s: 1}, {x: 1920, c: '60,120,255', s: -1}].map((l, i) => (
        <div key={i} style={{position: 'absolute', left: l.x - 1400, top: -1400, width: 2800, height: 2800, opacity: a * 0.55, mixBlendMode: 'screen',
          background: `conic-gradient(from ${l.s * t * 260}deg, rgba(${l.c},0.9) 0deg, rgba(${l.c},0) 28deg, rgba(0,0,0,0) 180deg, rgba(${l.c},0.9) 180deg, rgba(${l.c},0) 208deg, rgba(0,0,0,0) 360deg)`,
          WebkitMaskImage: 'radial-gradient(circle, black 0%, transparent 60%)', maskImage: 'radial-gradient(circle, black 0%, transparent 60%)'}} />
      ))}
    </>
  );
};

const Searchlight: React.FC<{t: number; a: number}> = ({t, a}) => {
  const x = 960 + 700 * Math.sin(t * 0.9), y = 560 + 180 * Math.sin(t * 1.3);
  return <div style={{position: 'absolute', left: x - 330, top: y - 250, width: 660, height: 500, borderRadius: '50%', opacity: a,
    background: 'radial-gradient(ellipse, rgba(255,245,220,0.35), rgba(255,245,220,0.08) 50%, rgba(0,0,0,0) 70%)', filter: 'blur(6px)'}} />;
};

const Stack: React.FC<{t: number}> = ({t}) => {
  const lit = 0.6 + 0.4 * Math.sin(t * 3);
  return (
    <>
      <div style={{position: 'absolute', left: STACK.x - 170, top: STACK.y + 10, width: 340, height: 330,
        background: 'linear-gradient(180deg, #3a2a5c, #120a22)', clipPath: 'polygon(12% 0, 88% 0, 100% 100%, 0 100%)',
        boxShadow: `0 0 40px rgba(${PURPLE},0.6)`}} />
      <div style={{position: 'absolute', left: STACK.x - 190, top: STACK.y - 4, width: 380, height: 24, borderRadius: 6, background: '#5b4488'}} />
      <div style={{position: 'absolute', left: STACK.x - 240, top: STACK.y - 330, width: 480, height: 360, borderRadius: '50%', opacity: 0.5 * lit,
        background: 'radial-gradient(ellipse, rgba(255,200,80,0.5), rgba(0,0,0,0) 65%)'}} />
      {COINS.map((c, i) => {
        const grabbed = i === 0 && t >= HS.grab;
        const hit = t >= HS.dash + 0.25;
        if (grabbed) return null;
        let x = STACK.x + c.dx, y = STACK.y + c.dy;
        if (hit) {
          const tau = t - HS.dash - 0.25, a = -Math.PI / 2 + (random(`sa${i}`) - 0.5) * 2.4, v = 900 + 700 * random(`sv${i}`);
          x += Math.cos(a) * v * tau + 500 * tau; y += Math.sin(a) * v * tau + 1400 * tau * tau;
          if (y > 1300) return null;
        }
        return <Coin key={i} x={x} y={y} w={110} phase={hit ? t * 14 + i : i * 0.4} />;
      })}
    </>
  );
};

// The paw sneaks in from the lower left, grabs the top coin and yanks it away.
const Paw: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < HS.sneak || t > HS.grab + 0.45) return null;
  const tip = {x: STACK.x - 30, y: STACK.y - 170};
  let p = eInOut(clamp((t - HS.sneak) / (HS.grab - HS.sneak)));
  p = p * (1 + 0.04 * Math.sin(t * 9) * (1 - p));
  let x = -300 + (tip.x + 300) * p, y = 1250 + (tip.y - 1250) * p;
  if (t >= HS.grab) {
    const q = eIn(clamp((t - HS.grab) / 0.35));
    x = tip.x - 1500 * q; y = tip.y + 700 * q;
  }
  return (
    <>
      <Sprite src="paw" x={x} y={y} w={300} rot={-35} filter="drop-shadow(0 20px 20px rgba(0,0,0,0.6))" />
      {t >= HS.grab && <Coin x={x + 60} y={y - 60} w={110} phase={t * 20} />}
    </>
  );
};

const Hero: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < HS.dash) return null;
  const beat = beatPulse(t, HS_BEATS, 0.02);
  if (t < HS.land) {
    const p = (t - HS.dash) / (HS.land - HS.dash);
    // dash across left -> right, then swing back into the centre
    const x = p < 0.55 ? -500 + 2900 * eIn(p / 0.55) : 2400 - 1440 * eOut((p - 0.55) / 0.45);
    const y = p < 0.55 ? 520 : 420 - 60 * Math.sin(Math.PI * (p - 0.55) / 0.45);
    return <Layer src="character" x={x} y={y} w={700} aspect={ASPECT.character} transform={`rotate(${p < 0.55 ? 12 : -8}deg) scaleX(${p < 0.55 ? 1 : -1})`}
      filter={`drop-shadow(0 0 30px rgba(255,60,90,0.7))`} />;
  }
  const s = springT(t - HS.land, 8, 20);
  const bob = 8 * Math.sin(t * 2.6) * clamp((t - HS.text) / 0.5);
  const out = clamp((t - HS.out) / 0.4);
  return (
    <Layer src="character" x={960} y={420 + bob} w={700} aspect={ASPECT.character} origin="50% 90%"
      transform={`scale(${(1.1 - 0.1 * s) * (1 + beat)}, ${(0.9 + 0.1 * s) * (1 + beat)})`} opacity={1 - out}
      filter={`drop-shadow(0 0 ${26 + 60 * beat}px rgba(${PURPLE},0.85)) drop-shadow(0 24px 30px rgba(0,0,0,0.7))`}>
      <Shine src="character" t={t} at={[6.4, 8.2]} />
    </Layer>
  );
};

export const Heist: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const alarm = t >= HS.alarm && t < HS.out + 0.3 ? 1 : 0;
  const strobe = t >= HS.alarm && t < HS.text ? (Math.floor((t - HS.alarm) * 6) % 2 === 0 ? 0.28 : 0) : 0;
  const push = t < HS.alarm ? 1 + 0.12 * eInOut(clamp(t / HS.alarm)) : 1.12 - 0.12 * eOut(clamp((t - HS.alarm) / 0.6));
  const amp = 16 * decay(t, HS.alarm, 6) + 26 * decay(t, HS.dash + 0.25, 8) + 30 * decay(t, HS.text, 9);
  const beat = beatPulse(t, HS_BEATS, 0.02);
  const ts = springT(t - HS.text, 10, 24);
  const blackout = clamp((t - HS.out) / 0.12) * (t < HS.out + 0.3 || t > HS.out + 0.4 ? 1 : 0.2);
  return (
    <AbsoluteFill style={{backgroundColor: 'black', overflow: 'hidden'}}>
      <Audio src={staticFile('sfx_heist.wav')} />
      <AbsoluteFill style={{transform: `translate(${amp * Math.sin(t * 97)}px, ${amp * Math.cos(t * 83)}px) scale(${push})`, transformOrigin: '50% 62%'}}>
        <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, ${alarm ? '#2a0716' : '#150a33'} 0%, #05030d 70%)`}} />
        <Floor t={t} alarm={alarm} />
        <Sirens t={t} a={clamp((t - HS.alarm) / 0.3)} />
        <Lasers t={t} alarm={alarm} />
        {t < HS.dash + 1.2 && <Stack t={t} />}
        {t < HS.alarm + 0.4 && <Searchlight t={t} a={1 - clamp((t - HS.alarm) / 0.4)} />}
        <CameraMotionBlur shutterAngle={220} samples={4}><Paw /></CameraMotionBlur>
        <CameraMotionBlur shutterAngle={220} samples={4}><Hero /></CameraMotionBlur>
        {t >= HS.dash && t < HS.land && new Array(10).fill(0).map((_, i) => {
          const tau = t - HS.dash - i * 0.05;
          if (tau < 0) return null;
          return <Coin key={i} x={-300 + 2600 * eIn(clamp(tau / 0.45)) - 120} y={560 + 60 * Math.sin(i) + 500 * tau * tau} w={80} phase={t * 16 + i} />;
        })}
        {t >= HS.text && (
          <Layer src="logo_text" x={960} y={865} w={880} aspect={ASPECT.logo_text} transform={`scale(${(2.4 - 1.4 * ts) * (1 + beat)})`} opacity={clamp(ts * 5) * (1 - clamp((t - HS.out) / 0.3))}
            filter={`drop-shadow(0 0 22px rgba(255,60,90,0.7)) drop-shadow(0 16px 20px rgba(0,0,0,0.7))`}>
            <Shine src="logo_text" t={t} at={[5.9, 7.4, 8.6]} />
          </Layer>
        )}
        {t >= HS.text && new Array(12).fill(0).map((_, i) => {
          const y = ((random(`ry${i}`) * 1300 + (t - HS.text) * (120 + 80 * random(`rv${i}`))) % 1300) - 120;
          return <Coin key={i} x={100 + random(`rx${i}`) * 1720} y={y} w={60 + 30 * random(`rw${i}`)} phase={t * 8 + i} opacity={0.55 * clamp((t - HS.text - 0.3) / 0.5)} />;
        })}
        <Vignette strength={0.8} />
      </AbsoluteFill>
      <Grain frame={frame} opacity={0.08} />
      <AbsoluteFill style={{backgroundColor: 'rgb(255,30,60)', opacity: strobe, mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{backgroundColor: 'white', opacity: 0.45 * decay(t, HS.text, 18) + 0.3 * decay(t, HS.alarm, 14)}} />
      <AbsoluteFill style={{backgroundColor: 'black', opacity: Math.max(1 - clamp(t / 0.5), blackout)}} />
      {t >= HS.out + 0.3 && t < HS.out + 0.4 && <AbsoluteFill style={{backgroundColor: 'rgb(255,30,60)', opacity: 0.35}} />}
    </AbsoluteFill>
  );
};
