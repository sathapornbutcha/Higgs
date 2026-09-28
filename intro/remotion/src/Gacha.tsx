import React from 'react';
import {AbsoluteFill, Audio, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {ASPECT, Coin, Grain, Layer, Shine, Sprite, Vignette, beatPulse, clamp, decay, eIn, eInOut, eOut, springT} from './lib';

// 10 s gacha pull: a capsule drops and bounces in, rolls to centre, wobbles while five rarity stars pop in,
// a rainbow "SSR" flash, the capsule bursts open, the bunny springs out in confetti, title slam, star-shaped iris out.
export const GC = {drop: 0.2, stars: 1.8, ssr: 2.8, open: 3.0, text: 4.4, out: 9.0, end: 10.0};
export const GC_BEATS = Array.from({length: 9}, (_, i) => 4.8 + 0.5 * i);
const R = 170, FLOOR = 800;
const STAR_T = [0, 1, 2, 3, 4].map((i) => GC.stars + 0.25 * i);
const CONF = ['#8b3dff', '#ff8c1a', '#ffd046', '#ffffff', '#c9a7ff', '#ff5fa2'];

/** Capsule centre y above the floor: dropped from off-screen, three decaying bounces. */
const bounceY = (tau: number) => {
  const g = 7440, rest = FLOOR - R, fall = 0.5;
  if (tau < fall) return rest - 930 + 0.5 * g * tau * tau;
  let t0 = fall, v = g * fall * 0.5;
  for (let i = 0; i < 4; i++) {
    const air = (2 * v) / g;
    if (tau < t0 + air) { const s = tau - t0; return rest - (v * s - 0.5 * g * s * s); }
    t0 += air; v *= 0.5;
  }
  return rest;
};
const impacts = (() => { const out = [GC.drop + 0.5]; let t0 = 0.5, v = 1860; for (let i = 0; i < 3; i++) { t0 += (2 * v) / 7440; out.push(GC.drop + t0); v *= 0.5; } return out; })();

const starPath = (r: number, ri: number) => new Array(10).fill(0).map((_, i) => {
  const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? ri : r;
  return `${(rr * Math.cos(a)).toFixed(1)},${(rr * Math.sin(a)).toFixed(1)}`;
}).join(' ');

const Star: React.FC<{x: number; y: number; s: number; rot: number; glow: number}> = ({x, y, s, rot, glow}) => (
  <svg width="200" height="200" viewBox="-100 -100 200 200" style={{position: 'absolute', left: x - 100, top: y - 100, overflow: 'visible',
    transform: `rotate(${rot}deg) scale(${s})`, filter: `drop-shadow(0 0 ${10 + 30 * glow}px rgba(255,210,80,0.9))`}}>
    <defs><linearGradient id="stargold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff3b0" /><stop offset="0.5" stopColor="#ffc93a" /><stop offset="1" stopColor="#ff8c1a" /></linearGradient></defs>
    <polygon points={starPath(56, 24)} fill="url(#stargold)" stroke="#ffffff" strokeWidth={6} strokeLinejoin="round" />
  </svg>
);

const Capsule: React.FC<{t: number}> = ({t}) => {
  if (t >= GC.open + 0.75) return null;
  const tau = t - GC.drop;
  const y = tau < 0 ? -400 : bounceY(tau);
  const roll = eOut(clamp((t - GC.drop - 0.5) / 1.1));
  const x = 560 + 400 * roll;
  let rot = ((x - 960) / R) * 57.3;
  const shake = clamp((t - GC.stars) / (GC.open - GC.stars));
  rot += 10 * shake * Math.sin(t * 34) * (t < GC.open ? 1 : 0);
  const hop = t < GC.open ? 22 * shake * Math.max(0, Math.sin(t * 17)) ** 8 : 0;
  const squash = impacts.reduce((s, i) => s + 0.22 * decay(t, i, 14) * Math.cos((t - i) * 25), 0);
  const o = eOut(clamp((t - GC.open) / 0.7)) ** 1.3;
  const glow = shake + 2 * decay(t, GC.ssr, 6);
  return (
    <div style={{position: 'absolute', left: x - R, top: y - R - hop, width: 2 * R, height: 2 * R, transformOrigin: '50% 100%',
      transform: `scale(${1 + squash}, ${1 - squash})`, filter: `drop-shadow(0 0 ${20 + 50 * glow}px rgba(255,210,120,${0.3 + 0.4 * clamp(glow)}))`}}>
      <svg width={2 * R} height={2 * R} viewBox={`${-R} ${-R} ${2 * R} ${2 * R}`} style={{overflow: 'visible'}}>
        <defs>
          <radialGradient id="captop" cx="0.35" cy="0.3" r="0.9"><stop offset="0" stopColor="#c9a7ff" /><stop offset="0.45" stopColor="#8b3dff" /><stop offset="1" stopColor="#3b1370" /></radialGradient>
          <radialGradient id="capbot" cx="0.35" cy="0.2" r="1"><stop offset="0" stopColor="#ffe2b0" stopOpacity="0.95" /><stop offset="0.5" stopColor="#ffa640" stopOpacity="0.9" /><stop offset="1" stopColor="#c45a00" stopOpacity="0.95" /></radialGradient>
        </defs>
        <g transform={`rotate(${rot})`}>
          <g transform={`translate(${-300 * o} ${900 * o}) rotate(${-120 * o})`}>
            <path d={`M ${-R} 0 A ${R} ${R} 0 0 0 ${R} 0 Z`} fill="url(#capbot)" stroke="#7a3d0c" strokeWidth={5} />
            <circle cx={-40} cy={70} r={16} fill="rgba(255,255,255,0.35)" />
            <circle cx={50} cy={95} r={10} fill="rgba(255,255,255,0.3)" />
          </g>
          <g transform={`translate(${420 * o} ${-1300 * o}) rotate(${600 * o})`}>
            <path d={`M ${-R} 0 A ${R} ${R} 0 0 1 ${R} 0 Z`} fill="url(#captop)" stroke="#2a0c54" strokeWidth={5} />
            <rect x={-R - 4} y={-12} width={2 * R + 8} height={24} rx={12} fill="#fff4e6" stroke="#2a0c54" strokeWidth={4} />
            <ellipse cx={-60} cy={-95} rx={55} ry={28} fill="rgba(255,255,255,0.55)" transform="rotate(-30 -60 -95)" />
            <circle cx={0} cy={-12} r={20} fill="#ff8c1a" stroke="#2a0c54" strokeWidth={4} />
          </g>
        </g>
      </svg>
    </div>
  );
};

export const Gacha: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const beat = beatPulse(t, GC_BEATS, 0.02);
  const opened = t >= GC.open;
  const rainbow = clamp((t - GC.ssr) / 0.3);
  const amp = impacts.reduce((s, i, k) => s + (14 - 3 * k) * decay(t, i, 12), 0) + 28 * decay(t, GC.open, 8) + 16 * decay(t, GC.text, 10);
  const flash = 0.45 * decay(t, GC.ssr, 10) + 0.8 * decay(t, GC.open, 8) + 0.25 * decay(t, GC.text, 18);
  const pop = springT(t - GC.open - 0.05, 7, 14);
  const bunnyY = 630 - 200 * eOut(clamp((t - GC.open) / 0.5)) + 10 * Math.sin(t * 2.4) * clamp((t - GC.text) / 0.5);
  const ts = springT(t - GC.text, 10, 24);
  // star-shaped iris out
  const iris = t < GC.out ? 0 : eIn(clamp((t - GC.out) / 0.7));
  const irisR = 2600 * (1 - iris);
  const irisPts = new Array(10).fill(0).map((_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5 + iris * 2, rr = i % 2 ? irisR * 0.45 : irisR;
    return `${(960 + rr * Math.cos(a)).toFixed(1)}px ${(470 + rr * Math.sin(a)).toFixed(1)}px`;
  }).join(', ');
  return (
    <AbsoluteFill style={{backgroundColor: 'black', overflow: 'hidden'}}>
      <Audio src={staticFile('sfx_gacha.wav')} />
      <AbsoluteFill style={{clipPath: t < GC.out ? undefined : `polygon(${irisPts})`}}>
        <AbsoluteFill style={{transform: `translate(${amp * Math.sin(t * 97)}px, ${amp * Math.cos(t * 83)}px)`}}>
          <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, #6a2bd0 0%, #2a0c54 55%, #0c0320 100%)'}} />
          {/* sunburst turns rainbow at the SSR moment */}
          <div style={{position: 'absolute', left: 960 - 1600, top: 470 - 1600, width: 3200, height: 3200, transform: `rotate(${t * (opened ? 14 : 6)}deg)`,
            background: 'repeating-conic-gradient(from 0deg, rgba(255,255,255,0.10) 0deg 10deg, rgba(0,0,0,0) 10deg 20deg)', opacity: 0.8,
            WebkitMaskImage: 'radial-gradient(circle, black 5%, transparent 55%)', maskImage: 'radial-gradient(circle, black 5%, transparent 55%)'}} />
          {rainbow > 0 && <div style={{position: 'absolute', left: 960 - 1600, top: 470 - 1600, width: 3200, height: 3200, opacity: 0.35 * rainbow * (1 + 4 * beat),
            transform: `rotate(${-t * 20}deg)`, mixBlendMode: 'screen',
            background: 'conic-gradient(#ff5fa2, #ffd046, #6bff9a, #4dd2ff, #8b3dff, #ff5fa2)',
            WebkitMaskImage: 'radial-gradient(circle, black 2%, transparent 45%)', maskImage: 'radial-gradient(circle, black 2%, transparent 45%)'}} />}
          {new Array(30).fill(0).map((_, i) => {
            const x = random(`gx${i}`) * 1920, y = random(`gy${i}`) * 1080, tw = Math.max(0, Math.sin(t * 3 + i * 2.1));
            return <Sprite key={i} src="effect_08" x={x} y={y} w={30 + 30 * random(`gw${i}`)} rot={t * 40 + i * 20} opacity={0.6 * tw} blend="screen" />;
          })}
          {/* floor + shadow */}
          <div style={{position: 'absolute', left: 960 - 700, top: FLOOR - 40, width: 1400, height: 120, borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(255,200,120,0.18), rgba(0,0,0,0) 70%)'}} />
          {!opened && t >= GC.drop && (() => {
            const cy = t - GC.drop < 0 ? -400 : bounceY(t - GC.drop);
            const k = clamp(1 - (FLOOR - R - cy) / 900);
            return <div style={{position: 'absolute', left: 560 + 400 * eOut(clamp((t - GC.drop - 0.5) / 1.1)) - 160 * k, top: FLOOR - 18, width: 320 * k, height: 36,
              borderRadius: '50%', background: 'rgba(0,0,0,0.5)', filter: 'blur(8px)'}} />;
          })()}
          <CameraMotionBlur shutterAngle={180} samples={4}><CapsuleWrap /></CameraMotionBlur>
          {/* burst: rings + element streaks */}
          {opened && t < GC.open + 0.8 && [0, 1].map((i) => {
            const p = clamp((t - GC.open - 0.08 * i) / 0.7);
            return <div key={i} style={{position: 'absolute', left: 960 - 900 * eOut(p), top: 630 - 900 * eOut(p), width: 1800 * eOut(p), height: 1800 * eOut(p),
              borderRadius: '50%', border: `${24 * (1 - p)}px solid ${i ? '#ff8c1a' : '#ffffff'}`, opacity: 1 - p}} />;
          })}
          {opened && t < GC.open + 0.7 && new Array(16).fill(0).map((_, i) => {
            const p = (t - GC.open) / 0.7, a = (i / 16) * Math.PI * 2, r = 120 + 800 * eOut(p);
            return <Sprite key={i} src={['effect_03', 'effect_12', 'effect_05', 'effect_02'][i % 4]} x={960 + r * Math.cos(a)} y={600 + r * Math.sin(a) * 0.8} w={150}
              rot={a * 57.3 + 30} opacity={1 - p} blend="screen" />;
          })}
          {/* bunny springs out */}
          {opened && (
            <Layer src="character" x={960} y={bunnyY} w={700} aspect={ASPECT.character}
              transform={`scale(${(0.15 + 0.85 * pop) * (1 + beat)}) rotate(${-8 * (1 - clamp(pop)) + 2 * Math.sin(t * 1.3)}deg)`}
              filter={`drop-shadow(0 0 ${24 + 60 * beat}px rgba(255,220,140,0.85)) drop-shadow(0 24px 26px rgba(0,0,0,0.5))`}>
              <Shine src="character" t={t} at={[5.4, 7.3]} />
            </Layer>
          )}
          {/* rarity stars: pop in above the capsule, then fly up to a row over the bunny */}
          {STAR_T.map((st, i) => {
            if (t < st) return null;
            const s = springT(t - st, 8, 20);
            const up = eInOut(clamp((t - GC.open) / 0.6));
            const x0 = 960 + (i - 2) * 130, y0 = 330 - 30 * Math.cos(((i - 2) / 2) * 1.2);
            const x1 = 960 + (i - 2) * 86, y1 = 70;
            const out = clamp((t - GC.out + 0.2) / 0.3);
            return <Star key={i} x={x0 + (x1 - x0) * up} y={y0 + (y1 - y0) * up} s={s * (1 - 0.45 * up) * (1 + 3 * beat) * (1 - out)}
              rot={-20 * (1 - clamp(s)) + (opened ? 6 * Math.sin(t * 3 + i) : 0)} glow={decay(t, st, 6) + 0.6 * rainbow} />;
          })}
          {/* confetti: a burst at the open, then a steady fall */}
          {opened && new Array(90).fill(0).map((_, i) => {
            const burst = i < 40;
            const tau = burst ? t - GC.open : ((t - GC.open - 0.4 + random(`cf${i}`) * 4) % 4);
            if (tau < 0) return null;
            const a = random(`ca${i}`) * Math.PI * 2, sp = 700 + 700 * random(`cs${i}`);
            const x = burst ? 960 + Math.cos(a) * sp * tau : random(`cx${i}`) * 1920 + 40 * Math.sin(tau * 3 + i);
            const y = burst ? 600 + Math.sin(a) * sp * tau + 900 * tau * tau : -40 + 300 * tau;
            const sz = 12 + 10 * random(`cz${i}`);
            return <div key={i} style={{position: 'absolute', left: x, top: y, width: sz, height: sz * 0.6, background: CONF[i % CONF.length],
              transform: `rotate(${t * 300 + i * 40}deg) scaleY(${Math.cos(t * 9 + i)})`, opacity: burst ? clamp(1.6 - tau) : 0.9}} />;
          })}
          {opened && [0, 1, 2, 3].map((i) => {
            const side = i % 2 ? 1 : -1, ph = t * 1.8 + i * 1.3;
            return <Coin key={`k${i}`} x={960 + side * (560 + 60 * Math.floor(i / 2))} y={430 + 180 * Math.sin(ph) - 60 * Math.floor(i / 2)} w={80}
              phase={t * 10 + i * 2} opacity={clamp((t - GC.open - 0.3) / 0.4)} />;
          })}
          {t >= GC.text && (
            <Layer src="logo_text" x={960} y={872} w={720} aspect={ASPECT.logo_text} transform={`scale(${(2.3 - 1.3 * ts) * (1 + beat)}) rotate(${-3 * (1 - clamp(ts))}deg)`}
              opacity={clamp(ts * 5)} filter="drop-shadow(0 0 20px rgba(255,205,70,0.6)) drop-shadow(0 14px 18px rgba(0,0,0,0.7))">
              <Shine src="logo_text" t={t} at={[5.2, 6.8, 8.3]} />
            </Layer>
          )}
          <Vignette strength={0.55} />
        </AbsoluteFill>
        <Grain frame={frame} opacity={0.05} />
        <AbsoluteFill style={{backgroundColor: 'rgb(255,248,235)', opacity: flash}} />
      </AbsoluteFill>
      <AbsoluteFill style={{backgroundColor: 'black', opacity: 1 - clamp(t / 0.3)}} />
    </AbsoluteFill>
  );
};

const CapsuleWrap: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill><Capsule t={frame / fps} /></AbsoluteFill>;
};
