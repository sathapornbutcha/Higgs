import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';

// Timeline (seconds). Keep in sync with make_audio.py.
export const T = {titleIn: 0.2, titleLand: 0.55, pounce: 0.72, land: 1.08, out: 4.1, zip: 4.28, punch: 4.5, flash: 4.72};
export const BEATS = [1.5, 2, 2.5, 3, 3.5, 4];
export const SHINES = [2.0, 3.2];
const SIZE = 900;
const PURPLE = '139,61,255';
const ORANGE = '255,140,26';

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const eIn = (p: number) => p * p * p;
const decay = (t: number, t0: number, k: number) => (t >= t0 ? Math.exp(-(t - t0) * k) : 0);

const Background: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const rays = clamp((t - T.land + 0.2) / 0.5) * (1 - clamp((t - T.out) / 0.5));
  const blobs = [
    {c: PURPLE, x: 30 + 8 * Math.sin(t * 0.7), y: 35 + 6 * Math.cos(t * 0.5), r: 900},
    {c: ORANGE, x: 72 + 6 * Math.cos(t * 0.6), y: 70 + 5 * Math.sin(t * 0.8), r: 700},
    {c: '200,80,255', x: 55 + 10 * Math.sin(t * 0.4 + 2), y: 20 + 4 * Math.sin(t), r: 800},
  ];
  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, #43147a 0%, #1b0730 48%, #06020b 100%)', overflow: 'hidden'}}>
      {blobs.map((b, i) => (
        <div key={i} style={{position: 'absolute', left: `${b.x}%`, top: `${b.y}%`, width: b.r, height: b.r, marginLeft: -b.r / 2, marginTop: -b.r / 2,
          borderRadius: '50%', background: `radial-gradient(circle, rgba(${b.c},0.28), rgba(${b.c},0) 70%)`, filter: 'blur(40px)'}} />
      ))}
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 3000, height: 3000, marginLeft: -1500, marginTop: -1500, opacity: rays,
        transform: `rotate(${t * 8}deg)`,
        background: 'repeating-conic-gradient(from 0deg, rgba(190,110,255,0.13) 0deg 5deg, rgba(0,0,0,0) 5deg 15deg)',
        WebkitMaskImage: 'radial-gradient(circle, black 5%, transparent 55%)', maskImage: 'radial-gradient(circle, black 5%, transparent 55%)'}} />
      <svg width="1920" height="1080" style={{position: 'absolute', opacity: 0.07, mixBlendMode: 'overlay'}}>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 12} /></filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)'}} />
    </AbsoluteFill>
  );
};

const Shine: React.FC<{src: string; t: number}> = ({src, t}) => {
  const active = SHINES.find((s) => t >= s && t < s + 0.6);
  if (active === undefined) return null;
  const pos = interpolate(t, [active, active + 0.6], [110, -10], {easing: Easing.inOut(Easing.cubic)});
  const mask = `url(${staticFile(src)})`;
  return (
    <div style={{position: 'absolute', inset: 0, WebkitMaskImage: mask, maskImage: mask, WebkitMaskSize: '100% 100%', maskSize: '100% 100%',
      background: 'linear-gradient(110deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 60%)',
      backgroundSize: '300% 100%', backgroundPosition: `${pos}% 0`, mixBlendMode: 'screen'}} />
  );
};

const LogoGroup: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  let beat = 0;
  for (const b of BEATS) beat += 0.022 * decay(t, b, 12);

  // Title: rises from below, tipping forward out of the screen plane
  const tp = spring({frame: frame - T.titleIn * fps, fps, config: {damping: 11, stiffness: 140, mass: 0.9}});
  let titleScale = (1 + (1 - tp) * 0.3) * (1 + beat);
  if (t >= T.punch) titleScale *= 1 + 0.12 * Math.sin(Math.PI * clamp((t - T.punch) / 0.25));
  const title = {
    transform: `translateY(${(1 - tp) * 720}px) rotateX(${(1 - tp) * 60}deg) scale(${titleScale})`,
    opacity: clamp(tp * 3),
  };

  // Bunny: pounces from top-right, squashes on landing, floats, then snatches away upward
  let bx = 0, by = 0, rot = 0, ry = 0, sx = 1, sy = 1, visible = t >= T.pounce;
  if (t < T.land) {
    const q = eIn(clamp((t - T.pounce) / (T.land - T.pounce)));
    bx = (1 - q) * 1050; by = -(1 - q) * 1000; rot = (1 - q) * 28; ry = -(1 - q) * 45; sx = sy = 1 + (1 - q) * 0.45;
  } else {
    const s = spring({frame: frame - T.land * fps, fps, config: {damping: 7, stiffness: 220, mass: 0.8}});
    const osc = 1 - s;
    sy = 1 - 0.14 * osc; sx = 1 + 0.09 * osc;
    by = 9 * Math.sin((2 * Math.PI * (t - 1.5)) / 1.4) * clamp((t - 1.4) / 0.4);
    rot = 1.5 * Math.sin(t * 1.3) * clamp((t - 1.4) / 0.4);
    if (t >= T.out) {
      const dip = Math.sin(Math.PI * clamp((t - T.out) / (T.zip - T.out)));
      by += 40 * dip; sy *= 1 - 0.08 * dip; sx *= 1 + 0.05 * dip;
      const z = eIn(clamp((t - T.zip) / 0.2));
      by -= 1500 * z; sy *= 1 + 0.25 * z; sx *= 1 - 0.1 * z;
      visible = z < 1;
    }
  }
  sx *= 1 + beat * 0.5;
  sy *= 1 + beat * 0.5;
  const glow = 22 + 60 * beat + 40 * decay(t, T.land, 3);
  const imgStyle: React.CSSProperties = {position: 'absolute', inset: 0, width: SIZE, height: SIZE,
    filter: `drop-shadow(0 0 ${glow}px rgba(${PURPLE},0.75)) drop-shadow(0 18px 24px rgba(0,0,0,0.55))`};

  return (
    <div style={{position: 'absolute', left: (1920 - SIZE) / 2, top: (1080 - SIZE) / 2 - 10, width: SIZE, height: SIZE, transformStyle: 'preserve-3d'}}>
      <div style={{position: 'absolute', inset: 0, transformOrigin: '50% 80%', ...title}}>
        <Img src={staticFile('bottom.png')} style={imgStyle} />
        <Shine src="bottom.png" t={t} />
      </div>
      {visible && (
        <div style={{position: 'absolute', inset: 0, transformOrigin: '50% 72%',
          transform: `translate3d(${bx}px, ${by}px, 60px) rotate(${rot}deg) rotateY(${ry}deg) scale(${sx}, ${sy})`}}>
          <Img src={staticFile('top.png')} style={imgStyle} />
          <Shine src="top.png" t={t - 1.2} />
        </div>
      )}
    </div>
  );
};

const Coins: React.FC<{t: number}> = ({t}) => {
  const tau = t - T.land;
  if (tau < 0 || tau > 1.6) return null;
  return (
    <>
      {new Array(18).fill(0).map((_, i) => {
        const a = random(`a${i}`) * Math.PI * 2;
        const v = 700 + random(`v${i}`) * 900;
        const R = 26 + random(`r${i}`) * 22;
        const r = 170 + (v * (1 - Math.exp(-2.6 * tau))) / 2.6;
        const x = 960 + r * Math.cos(a);
        const y = 560 + r * Math.sin(a) * 0.7 + 950 * tau * tau;
        const flip = Math.max(0.12, Math.abs(Math.cos((6 + random(`f${i}`) * 6) * tau)));
        return (
          <div key={i} style={{position: 'absolute', left: x - R, top: y - R, width: 2 * R, height: 2 * R, borderRadius: '50%',
            transform: `scaleX(${flip})`, opacity: 1 - clamp((tau - 1.1) / 0.5),
            background: 'radial-gradient(circle at 35% 30%, #fff3b0 0%, #ffcd46 35%, #e8961e 70%, #8a4a0c 100%)',
            boxShadow: '0 0 18px rgba(255,190,60,0.7), inset 0 0 0 4px rgba(120,60,10,0.8)'}} />
        );
      })}
    </>
  );
};

const Impacts: React.FC<{t: number; front?: boolean}> = ({t, front}) => {
  const rings = [
    {t0: T.titleLand, c: '200,150,255', y: 800, sq: 0.35},
    {t0: T.land, c: ORANGE, y: 600, sq: 0.55},
    {t0: T.land + 0.07, c: PURPLE, y: 600, sq: 0.55},
  ];
  const burst = t >= T.land && t < T.land + 0.35;
  const bp = (t - T.land) / 0.35;
  return (
    <svg width="1920" height="1080" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {!front && rings.map((rg, i) => {
        const p = (t - rg.t0) / 0.6;
        if (p < 0 || p > 1) return null;
        const r = 140 + 1250 * (1 - Math.pow(1 - p, 3));
        return <ellipse key={i} cx={960} cy={rg.y} rx={r} ry={r * rg.sq} fill="none" stroke={`rgba(${rg.c},${0.9 * (1 - p)})`}
          strokeWidth={Math.max(1, 28 * (1 - p))} filter="url(#glow)" />;
      })}
      {!front && burst && new Array(28).fill(0).map((_, i) => {
        const a = (i / 28) * Math.PI * 2 + random(`b${i}`) * 0.2;
        const r0 = 320 + 900 * bp, r1 = r0 + 260 * (1 - bp);
        return <line key={i} x1={960 + r0 * Math.cos(a)} y1={560 + r0 * Math.sin(a)} x2={960 + r1 * Math.cos(a)} y2={560 + r1 * Math.sin(a)}
          stroke={`rgba(255,230,190,${1 - bp})`} strokeWidth={5} strokeLinecap="round" filter="url(#glow)" />;
      })}
      {!front && t < T.titleLand && new Array(36).fill(0).map((_, i) => {
        const a = random(`s${i}`) * Math.PI * 2;
        const pk = clamp((t - random(`d${i}`) * 0.12) / T.titleLand);
        if (pk <= 0) return null;
        const rh = 1300 - 1150 * eIn(pk);
        return <line key={i} x1={960 + rh * Math.cos(a)} y1={540 + rh * Math.sin(a)} x2={960 + (rh + 320) * Math.cos(a)} y2={540 + (rh + 320) * Math.sin(a)}
          stroke={`rgba(255,200,150,${0.8 * (1 - pk)})`} strokeWidth={3 + (i % 3)} strokeLinecap="round" />;
      })}
      {front && BEATS.map((b, i) => {
        const p = (t - b) / 0.45;
        if (p < 0 || p > 1 || t > T.out) return null;
        const x = 960 + (random(`gx${i}`) - 0.5) * 700, y = 540 + (random(`gy${i}`) - 0.5) * 600, r = 55 * Math.sin(Math.PI * p);
        const w = r * 0.12;
        return <path key={i} filter="url(#glow)" fill="white" transform={`rotate(${p * 90} ${x} ${y})`}
          d={`M${x},${y - r} L${x + w},${y - w} L${x + r},${y} L${x + w},${y + w} L${x},${y + r} L${x - w},${y + w} L${x - r},${y} L${x - w},${y - w} Z`} />;
      })}
    </svg>
  );
};

export const SnatchPro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const amp = 14 * decay(t, T.titleLand, 10) + 30 * decay(t, T.land, 8);
  const dx = amp * Math.sin(t * 97), dy = amp * Math.cos(t * 83);
  const push = 1 + 0.05 * clamp((t - 1.2) / 3.5);
  const flash = 0.12 * decay(t, T.titleLand, 24) + 0.22 * decay(t, T.land, 24);
  const endFlash = t >= T.flash ? 1 - clamp((t - T.flash) / 0.07) : 0;
  const black = Math.max(1 - clamp(t / 0.15), clamp((t - T.flash - 0.07) / 0.02));
  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      <Audio src={staticFile('sfx.wav')} />
      <AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px) scale(${push})`}}>
        <Background t={t} frame={frame} />
        <Coins t={t} />
        <Impacts t={t} />
        <AbsoluteFill style={{perspective: 1800, perspectiveOrigin: '50% 45%'}}>
          <AbsoluteFill style={{transformStyle: 'preserve-3d',
            transform: `rotateX(${2.5 * Math.sin(t * 0.9)}deg) rotateY(${3.5 * Math.sin(t * 0.7)}deg)`}}>
            <CameraMotionBlur shutterAngle={200} samples={6}>
              <LogoGroup />
            </CameraMotionBlur>
          </AbsoluteFill>
        </AbsoluteFill>
        <Impacts t={t} front />
      </AbsoluteFill>
      <AbsoluteFill style={{backgroundColor: 'rgb(255,235,255)', opacity: flash}} />
      <AbsoluteFill style={{backgroundColor: 'white', opacity: endFlash}} />
      <AbsoluteFill style={{backgroundColor: 'black', opacity: black}} />
    </AbsoluteFill>
  );
};
