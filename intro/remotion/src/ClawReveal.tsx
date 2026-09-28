import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';

// Timeline (seconds). Keep in sync with make_audio.py.
export const T = {slash: 0.58, reveal: 0.85, out: 4.2, zoom: 4.35, flash: 4.72};
export const BEATS = [1.5, 2, 2.5, 3, 3.5, 4];
export const SHINES = [1.9, 3.3];
const SIZE = 880;
const PURPLE = '139,61,255';
const ORANGE = '255,140,26';
const LOGO = 'logo.png';

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const eIn = (p: number) => p * p * p;
const eOut = (p: number) => 1 - Math.pow(1 - p, 3);
const decay = (t: number, t0: number, k: number) => (t >= t0 ? Math.exp(-(t - t0) * k) : 0);

const Background: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const lit = clamp((t - 0.1) / 0.6);
  const rays = clamp((t - T.reveal) / 0.6) * (1 - clamp((t - T.out) / 0.4));
  const blobs = [
    {c: PURPLE, x: 28 + 8 * Math.sin(t * 0.7), y: 32 + 6 * Math.cos(t * 0.5), r: 950},
    {c: ORANGE, x: 74 + 6 * Math.cos(t * 0.6), y: 72 + 5 * Math.sin(t * 0.8), r: 750},
    {c: '200,80,255', x: 55 + 10 * Math.sin(t * 0.4 + 2), y: 18 + 4 * Math.sin(t), r: 850},
  ];
  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, #3e1270 0%, #190629 48%, #050109 100%)', overflow: 'hidden', opacity: lit}}>
      {blobs.map((b, i) => (
        <div key={i} style={{position: 'absolute', left: `${b.x}%`, top: `${b.y}%`, width: b.r, height: b.r, marginLeft: -b.r / 2, marginTop: -b.r / 2,
          borderRadius: '50%', background: `radial-gradient(circle, rgba(${b.c},0.3), rgba(${b.c},0) 70%)`, filter: 'blur(40px)'}} />
      ))}
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 3000, height: 3000, marginLeft: -1500, marginTop: -1500, opacity: rays,
        transform: `rotate(${t * 7}deg)`,
        background: 'repeating-conic-gradient(from 0deg, rgba(190,110,255,0.14) 0deg 4deg, rgba(0,0,0,0) 4deg 12deg)',
        WebkitMaskImage: 'radial-gradient(circle, black 8%, transparent 55%)', maskImage: 'radial-gradient(circle, black 8%, transparent 55%)'}} />
      {new Array(40).fill(0).map((_, i) => {
        const x = random(`bx${i}`) * 1920, y0 = random(`by${i}`) * 1080, r = 3 + random(`br${i}`) * 9;
        const y = (((y0 - t * (20 + 50 * random(`bv${i}`))) % 1080) + 1080) % 1080;
        const a = (0.35 + 0.35 * Math.sin(t * 2 + i)) * clamp((t - T.reveal) / 0.5);
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: r * 2, height: r * 2, borderRadius: '50%',
          background: i % 3 ? `rgba(${ORANGE},${a})` : `rgba(210,160,255,${a})`, filter: `blur(${r > 8 ? 3 : 1}px)`}} />;
      })}
      <svg width="1920" height="1080" style={{position: 'absolute', opacity: 0.07, mixBlendMode: 'overlay'}}>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 12} /></filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.78) 100%)'}} />
    </AbsoluteFill>
  );
};

// Energy streaks converging on the centre before the reveal.
const Converge: React.FC<{t: number}> = ({t}) => {
  if (t > T.reveal + 0.05) return null;
  return (
    <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
      <defs><filter id="cg"><feGaussianBlur stdDeviation="4" /></filter></defs>
      {new Array(48).fill(0).map((_, i) => {
        const a = random(`ca${i}`) * Math.PI * 2;
        const pk = clamp((t - random(`cd${i}`) * 0.35) / 0.5);
        if (pk <= 0 || pk >= 1) return null;
        const rh = 1200 - 1120 * eIn(pk), len = 120 + 260 * pk;
        const c = i % 2 ? `rgba(${ORANGE},${0.9 * (1 - pk * 0.6)})` : `rgba(200,150,255,${0.9 * (1 - pk * 0.6)})`;
        return <line key={i} x1={960 + rh * Math.cos(a)} y1={540 + rh * Math.sin(a)} x2={960 + (rh + len) * Math.cos(a)} y2={540 + (rh + len) * Math.sin(a)}
          stroke={c} strokeWidth={2 + (i % 4)} strokeLinecap="round" />;
      })}
      <circle cx={960} cy={540} r={20 + 90 * eIn(clamp(t / T.reveal))} fill={`rgba(255,220,255,${0.9 * clamp(t / T.reveal)})`} filter="url(#cg)" />
    </svg>
  );
};

// Three glowing claw strokes swiping across the screen.
const Claws: React.FC<{t: number}> = ({t}) => {
  const strokes = [0, 1, 2].map((k) => {
    const t0 = T.slash + k * 0.04;
    const draw = eOut(clamp((t - t0) / 0.14));
    const fade = 1 - clamp((t - t0 - 0.2) / 0.3);
    const off = (k - 1) * 95;
    const d = `M ${1580 + off} ${-80 + Math.abs(off) * 0.6} Q ${1240 + off * 0.7} ${470} ${380 + off} ${1160 - Math.abs(off) * 0.6}`;
    return {d, draw, fade, key: k};
  });
  if (t < T.slash || t > T.slash + 0.7) return null;
  return (
    <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
      <defs><filter id="clawglow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="12" /></filter></defs>
      {strokes.map((s) => (
        <g key={s.key} opacity={s.fade}>
          <path d={s.d} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - s.draw} fill="none" stroke={`rgb(${ORANGE})`} strokeWidth={46} strokeLinecap="round" filter="url(#clawglow)" />
          <path d={s.d} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - s.draw} fill="none" stroke="white" strokeWidth={12} strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
};

const Shine: React.FC<{t: number}> = ({t}) => {
  const active = SHINES.find((s) => t >= s && t < s + 0.65);
  if (active === undefined) return null;
  const pos = interpolate(t, [active, active + 0.65], [110, -10], {easing: Easing.inOut(Easing.cubic)});
  const mask = `url(${staticFile(LOGO)})`;
  return (
    <div style={{position: 'absolute', inset: 0, WebkitMaskImage: mask, maskImage: mask, WebkitMaskSize: '100% 100%', maskSize: '100% 100%',
      background: 'linear-gradient(110deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0) 60%)',
      backgroundSize: '300% 100%', backgroundPosition: `${pos}% 0`, mixBlendMode: 'screen'}} />
  );
};

const Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < T.reveal - 0.02) return null;
  const s = spring({frame: frame - T.reveal * fps, fps, config: {damping: 10, stiffness: 150, mass: 0.9}});
  let beat = 0;
  for (const b of BEATS) beat += 0.02 * decay(t, b, 12);
  let scale = (0.25 + 0.75 * s) * (1 + beat);
  let ry = (1 - s) * -80 + 7 * Math.sin(t * 1.1) * clamp((t - 1.3) / 0.5);
  let rx = (1 - s) * 25 + 3.5 * Math.sin(t * 0.8 + 1) * clamp((t - 1.3) / 0.5);
  const rz = (1 - s) * -12;
  let y = 6 * Math.sin((2 * Math.PI * t) / 1.8) * clamp((t - 1.3) / 0.5);
  if (t >= T.out) {
    const dip = Math.sin((Math.PI / 2) * clamp((t - T.out) / (T.zoom - T.out)));
    const z = eIn(clamp((t - T.zoom) / (T.flash - T.zoom)));
    scale *= (1 - 0.07 * dip) * (1 + 7 * z);
    ry *= 1 - z; rx *= 1 - z; y *= 1 - z;
  }
  const glow = 26 + 70 * beat + 60 * decay(t, T.reveal, 3);
  return (
    <div style={{position: 'absolute', left: (1920 - SIZE) / 2, top: (1080 - SIZE) / 2 - 10, width: SIZE, height: SIZE,
      transform: `translateY(${y}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale})`, opacity: clamp(s * 4)}}>
      <Img src={staticFile(LOGO)} style={{position: 'absolute', inset: 0, width: SIZE, height: SIZE,
        filter: `drop-shadow(0 0 ${glow}px rgba(${PURPLE},0.8)) drop-shadow(0 22px 28px rgba(0,0,0,0.6))`}} />
      <Shine t={t} />
    </div>
  );
};

const Burst: React.FC<{t: number}> = ({t}) => {
  const tau = t - T.reveal;
  if (tau < 0 || tau > 1.6) return null;
  const rings = [{d: 0, c: ORANGE}, {d: 0.07, c: PURPLE}, {d: 0.14, c: '255,220,160'}];
  return (
    <>
      <svg width="1920" height="1080" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <defs><filter id="rg" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
        {rings.map((rg, i) => {
          const p = (tau - rg.d) / 0.65;
          if (p < 0 || p > 1) return null;
          const r = 160 + 1250 * eOut(p);
          return <circle key={i} cx={960} cy={540} r={r} fill="none" stroke={`rgba(${rg.c},${0.9 * (1 - p)})`} strokeWidth={Math.max(1, 30 * (1 - p))} filter="url(#rg)" />;
        })}
        {tau < 0.35 && new Array(30).fill(0).map((_, i) => {
          const a = (i / 30) * Math.PI * 2 + random(`sl${i}`) * 0.2, bp = tau / 0.35;
          const r0 = 300 + 950 * bp, r1 = r0 + 280 * (1 - bp);
          return <line key={i} x1={960 + r0 * Math.cos(a)} y1={540 + r0 * Math.sin(a)} x2={960 + r1 * Math.cos(a)} y2={540 + r1 * Math.sin(a)}
            stroke={`rgba(255,230,190,${1 - bp})`} strokeWidth={5} strokeLinecap="round" filter="url(#rg)" />;
        })}
      </svg>
      {new Array(18).fill(0).map((_, i) => {
        const a = random(`a${i}`) * Math.PI * 2, v = 700 + random(`v${i}`) * 900, R = 24 + random(`r${i}`) * 22;
        const r = 180 + (v * (1 - Math.exp(-2.6 * tau))) / 2.6;
        const x = 960 + r * Math.cos(a), y = 540 + r * Math.sin(a) * 0.75 + 950 * tau * tau;
        const flip = Math.max(0.12, Math.abs(Math.cos((6 + random(`f${i}`) * 6) * tau)));
        return <div key={i} style={{position: 'absolute', left: x - R, top: y - R, width: 2 * R, height: 2 * R, borderRadius: '50%',
          transform: `scaleX(${flip})`, opacity: 1 - clamp((tau - 1.1) / 0.5),
          background: 'radial-gradient(circle at 35% 30%, #fff3b0 0%, #ffcd46 35%, #e8961e 70%, #8a4a0c 100%)',
          boxShadow: '0 0 18px rgba(255,190,60,0.7), inset 0 0 0 4px rgba(120,60,10,0.8)'}} />;
      })}
    </>
  );
};

const Sparkles: React.FC<{t: number}> = ({t}) => (
  <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
    <defs><filter id="sg"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
    {[...BEATS, 2.25, 2.75, 3.25, 3.75].map((b, i) => {
      const p = (t - b) / 0.45;
      if (p < 0 || p > 1 || t > T.out) return null;
      const x = 960 + (random(`gx${i}`) - 0.5) * 760, y = 540 + (random(`gy${i}`) - 0.5) * 640, r = (35 + 30 * random(`gr${i}`)) * Math.sin(Math.PI * p);
      const w = r * 0.12;
      return <path key={i} filter="url(#sg)" fill="white" transform={`rotate(${p * 90} ${x} ${y})`}
        d={`M${x},${y - r} L${x + w},${y - w} L${x + r},${y} L${x + w},${y + w} L${x},${y + r} L${x - w},${y + w} L${x - r},${y} L${x - w},${y - w} Z`} />;
    })}
  </svg>
);

export const ClawReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const amp = 8 * decay(t, T.slash, 12) + 30 * decay(t, T.reveal, 8);
  const dx = amp * Math.sin(t * 97), dy = amp * Math.cos(t * 83);
  const push = 1 + 0.05 * clamp((t - 1.0) / 3.2);
  const flash = 0.18 * decay(t, T.reveal, 22);
  const endFlash = t >= T.flash ? 1 - clamp((t - T.flash) / 0.08) : 0;
  const black = t >= T.flash + 0.08 ? 1 : 0;
  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      <Audio src={staticFile('sfx.wav')} />
      <AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px) scale(${push})`}}>
        <Background t={t} frame={frame} />
        <Converge t={t} />
        <Burst t={t} />
        <AbsoluteFill style={{perspective: 1600, perspectiveOrigin: '50% 45%'}}>
          <CameraMotionBlur shutterAngle={200} samples={6}>
            <Logo />
          </CameraMotionBlur>
        </AbsoluteFill>
        <Sparkles t={t} />
        <Claws t={t} />
      </AbsoluteFill>
      <AbsoluteFill style={{backgroundColor: 'rgb(255,235,255)', opacity: flash}} />
      <AbsoluteFill style={{backgroundColor: 'white', opacity: endFlash}} />
      <AbsoluteFill style={{backgroundColor: 'black', opacity: black}} />
    </AbsoluteFill>
  );
};
