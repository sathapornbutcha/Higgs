import React from 'react';
import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ASPECT, Coin, Grain, Layer, ORANGE, PURPLE, Sprite, beatPulse, clamp, decay, eIn, eInOut, eOut, el, springT} from './lib';

// "Speed-art" intro modelled on the reference short: the logo is sketched and coloured on a tablet,
// backgrounds flip orange/blue with star patterns, effects are tapped on, then the camera dives into the screen. 125 BPM.
export const DR = {sketch: 0.4, color: 2.2, orange: 3.2, blue: 4.8, dive: 6.4, flash: 9.3, end: 10.0};
const BEAT = 0.48;
export const DR_BEATS = Array.from({length: 21}, (_, i) => +(0.48 * i).toFixed(2));
const SCR = {x: 210, y: 90, w: 1500, h: 900};
const LOGO_H = 760, LOGO_W = (LOGO_H * 472) / 514; // logo_full is 472x514

const Stars: React.FC<{t: number; color: string; bg: string; id: string}> = ({t, color, bg, id}) => (
  <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
    <svg width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
      <defs>
        <pattern id={`stars-${id}`} width="140" height="140" patternUnits="userSpaceOnUse" patternTransform={`translate(${t * 40} ${t * 25}) rotate(15)`}>
          <polygon fill={color} points="70,38 78,62 104,62 83,77 91,101 70,86 49,101 57,77 36,62 62,62" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#stars-${id})`} />
    </svg>
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.35), rgba(255,255,255,0) 60%)'}} />
  </AbsoluteFill>
);

const Stylus: React.FC<{x: number; y: number; press: number}> = ({x, y, press}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0}}>
    <div style={{position: 'absolute', left: -14 + 30 * (1 - press), top: 18 + 30 * (1 - press), width: 700, height: 34, borderRadius: 17,
      background: 'linear-gradient(180deg, #f4f4f7, #c9c9d2)', boxShadow: '0 20px 40px rgba(0,0,0,0.35)', transformOrigin: '0 50%',
      transform: 'rotate(38deg)'}}>
      <div style={{position: 'absolute', left: 0, top: 9, width: 30, height: 16, borderRadius: '8px 0 0 8px', background: '#3b3b44'}} />
      <div style={{position: 'absolute', left: 120, top: 0, width: 14, height: 34, background: `rgb(${PURPLE})`}} />
    </div>
    <div style={{position: 'absolute', left: -9, top: -9, width: 18, height: 18, borderRadius: '50%', border: `3px solid rgba(${PURPLE},0.8)`, opacity: press}} />
  </div>
);

// Screen content in screen-local coordinates (origin = top-left of the tablet screen).
const Screen: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const cx = SCR.w / 2, cy = SCR.h / 2;
  const logoBox = {left: cx - LOGO_W / 2, top: cy - LOGO_H / 2, width: LOGO_W, height: LOGO_H};
  let pen = {x: cx + 500, y: cy + 380, press: 0};
  const beat = beatPulse(t, DR_BEATS.filter((b) => b >= DR.orange), 0.025);
  const content: React.ReactNode[] = [];

  if (t < DR.orange) {
    const sk = clamp((t - DR.sketch) / (DR.color - DR.sketch));
    const co = eInOut(clamp((t - DR.color) / (DR.orange - DR.color - 0.1)));
    content.push(<AbsoluteFill key="paper" style={{background: '#fbfaff'}}>
      <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(139,61,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(139,61,255,0.08) 1px, transparent 1px)', backgroundSize: '50px 50px'}} />
    </AbsoluteFill>);
    const skMask = `linear-gradient(180deg, black ${sk * 110 - 8}%, transparent ${sk * 110}%)`;
    content.push(<div key="sk" style={{position: 'absolute', ...logoBox, WebkitMaskImage: skMask, maskImage: skMask, opacity: 1 - co * 0.7}}>
      <Img src={el('logo_lineart')} style={{width: '100%', height: '100%'}} /></div>);
    const coMask = `linear-gradient(0deg, black ${co * 115 - 12}%, transparent ${co * 115}%)`;
    if (co > 0) content.push(<div key="co" style={{position: 'absolute', ...logoBox, WebkitMaskImage: coMask, maskImage: coMask}}>
      <Img src={el('logo_full')} style={{width: '100%', height: '100%'}} /></div>);
    if (t >= DR.sketch && t < DR.color) {
      const zig = Math.sin(t * 38);
      pen = {x: logoBox.left + LOGO_W * (0.5 + 0.42 * zig), y: logoBox.top + LOGO_H * clamp(sk * 1.1 - 0.05), press: 1};
    } else if (t >= DR.color) {
      const zig = Math.sin(t * 30);
      pen = {x: logoBox.left + LOGO_W * (0.5 + 0.45 * zig), y: logoBox.top + LOGO_H * (1 - co), press: co < 1 ? 1 : 0};
    }
  } else if (t < DR.blue) {
    content.push(<Stars key="o" id="o" t={t} color="rgba(255,255,255,0.25)" bg={`linear-gradient(160deg, #ffb13b, rgb(${ORANGE}) 50%, #e2560f)`} />);
    const taps = [DR.orange + 0.6, DR.orange + 1.1];
    const react = taps.reduce((s, a) => s + (t >= a ? Math.exp(-(t - a) * 9) * Math.cos((t - a) * 30) : 0), 0);
    const cs = springT(t - DR.orange, 9, 22);
    content.push(<Layer key="c" src="character" x={cx} y={cy + 10} w={820} aspect={ASPECT.character} origin="50% 90%"
      transform={`scale(${(0.6 + 0.4 * cs) * (1 + 0.06 * react) * (1 + beat)}, ${(0.6 + 0.4 * cs) * (1 - 0.08 * react) * (1 + beat)})`}
      filter="drop-shadow(0 20px 26px rgba(120,40,0,0.45))" />);
    taps.forEach((a, i) => {
      const p = (t - a) / 0.4;
      if (p > 0 && p < 1) content.push(<Sprite key={`g${i}`} src="effect_08" x={cx - 90 + 150 * i} y={cy - 170} w={200} sx={Math.sin(Math.PI * p)} sy={Math.sin(Math.PI * p)} rot={p * 90} />);
    });
    const tgt = t < taps[0] ? 0 : t < taps[1] ? 1 : 2;
    const pts = [{x: cx - 90, y: cy - 170}, {x: cx + 60, y: cy - 170}, {x: cx + 520, y: cy + 380}];
    const from = pts[Math.max(0, tgt - 1)], to = pts[tgt];
    const seg = tgt === 0 ? clamp((t - DR.orange) / (taps[0] - DR.orange)) : tgt === 1 ? clamp((t - taps[0]) / 0.3) : clamp((t - taps[1]) / 0.3);
    pen = {x: from.x + (to.x - from.x) * eInOut(seg), y: from.y + (to.y - from.y) * eInOut(seg), press: taps.some((a) => t >= a - 0.05 && t < a + 0.08) ? 1 : 0};
  } else {
    content.push(<Stars key="b" id="b" t={t} color="rgba(255,255,255,0.2)" bg="linear-gradient(160deg, #3fa0ff, #1f5fe0 50%, #1b2f9e)" />);
    const fx = [{t0: DR.blue + 0.3, n: 'effect_09', x: cx - 470, y: cy - 150, w: 420, r: -20}, {t0: DR.blue + 0.65, n: 'effect_06', x: cx + 470, y: cy - 130, w: 420, r: 20},
      {t0: DR.blue + 1.0, n: 'effect_12', x: cx - 440, y: cy + 230, w: 380, r: 190}, {t0: DR.blue + 1.3, n: 'effect_10', x: cx + 460, y: cy + 240, w: 320, r: 0}];
    fx.forEach((f, i) => {
      const s = springT(t - f.t0, 10, 24);
      if (s > 0) content.push(<Sprite key={`f${i}`} src={f.n} x={f.x} y={f.y} w={f.w} rot={f.r + 6 * Math.sin(t * 8 + i)} sx={s} sy={s}
        filter="drop-shadow(0 0 16px rgba(160,100,255,0.9))" />);
    });
    content.push(<Layer key="c" src="character" x={cx} y={cy + 10} w={820} aspect={ASPECT.character}
      transform={`scale(${1 + beat}) translateY(${6 * Math.sin(t * 4)}px)`} filter="drop-shadow(0 0 30px rgba(120,190,255,0.8)) drop-shadow(0 20px 26px rgba(0,20,80,0.5))" />);
    const i = fx.findIndex((f) => t < f.t0);
    const tgt = i === -1 ? fx[fx.length - 1] : fx[i];
    const prev = i <= 0 ? {x: cx + 520, y: cy + 380, t0: DR.blue} : fx[i - 1];
    const seg = eInOut(clamp((t - prev.t0) / Math.max(0.05, tgt.t0 - prev.t0)));
    pen = {x: prev.x + (tgt.x - prev.x) * seg, y: prev.y + (tgt.y - prev.y) * seg, press: fx.some((f) => t >= f.t0 - 0.05 && t < f.t0 + 0.08) ? 1 : 0};
  }
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {content}
      <Grain frame={frame} opacity={0.03} />
      {t < DR.dive && <Stylus x={pen.x} y={pen.y} press={pen.press} />}
    </AbsoluteFill>
  );
};

// Full-screen finale after diving into the tablet.
const Finale: React.FC<{t: number}> = ({t}) => {
  const k = Math.floor((t - DR.dive) / BEAT);
  const orange = k % 2 === 0;
  const beat = beatPulse(t, DR_BEATS.map((b) => b + DR.dive - (DR.dive % BEAT)), 0.035, 10);
  const s = springT(t - DR.dive, 8, 18);
  const flames = [
    {n: 'effect_03', x: 470, y: 760, w: 520, r: -35}, {n: 'effect_05', x: 1450, y: 760, w: 460, r: 35}, {n: 'effect_01', x: 520, y: 330, w: 520, r: -20},
    {n: 'effect_03', x: 1400, y: 330, w: 520, r: 200}, {n: 'effect_05', x: 960, y: 1010, w: 600, r: -90},
  ];
  return (
    <AbsoluteFill>
      {orange ? <Stars id="fo" t={t} color="rgba(255,255,255,0.25)" bg={`linear-gradient(160deg, #ffb13b, rgb(${ORANGE}) 50%, #e2560f)`} />
        : <Stars id="fb" t={t} color="rgba(255,255,255,0.2)" bg="linear-gradient(160deg, #3fa0ff, #1f5fe0 50%, #1b2f9e)" />}
      {new Array(8).fill(0).map((_, i) => {
        const th = (i / 8) * Math.PI * 2 + t * 1.3;
        return <Coin key={i} x={960 + 780 * Math.cos(th)} y={540 + 300 * Math.sin(th)} w={100 + 40 * (Math.sin(th) + 1) / 2} phase={t * 12 + i} />;
      })}
      {flames.map((f, i) => (
        <Sprite key={i} src={f.n} x={f.x} y={f.y} w={f.w * (1 + 0.12 * Math.sin(t * 22 + i * 2)) * clamp(s)} rot={f.r + 5 * Math.sin(t * 17 + i)}
          opacity={0.85} blend="screen" filter="drop-shadow(0 0 20px rgba(255,140,40,0.9))" />
      ))}
      <Layer src="logo_full" x={960} y={540} w={LOGO_W * 1.2} aspect={514 / 472} transform={`scale(${(0.7 + 0.3 * s) * (1 + beat)}) rotate(${2 * Math.sin(t * 2)}deg)`}
        filter={`drop-shadow(0 0 ${30 + 90 * beat}px ${orange ? 'rgba(255,230,120,0.9)' : 'rgba(140,200,255,0.9)'}) drop-shadow(0 26px 30px rgba(0,0,0,0.45))`} />
    </AbsoluteFill>
  );
};

export const Draw: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const intro = eOut(clamp(t / 0.35));
  const dive = eIn(clamp((t - DR.dive + 0.3) / 0.3));
  const scale = (0.9 + 0.1 * intro) * (1 + 0.9 * dive);
  const swayX = 6 * Math.sin(t * 1.7), swayY = 4 * Math.sin(t * 2.3), swayR = 0.5 * Math.sin(t * 1.1);
  const flash = Math.max(0.5 * decay(t, DR.dive, 14), [DR.orange, DR.blue].some((c) => t >= c && t < c + 1 / 30) ? 0.6 : 0);
  const white = clamp((t - DR.flash) / 0.2);
  const black = clamp((t - DR.flash - 0.3) / 0.15);
  return (
    <AbsoluteFill style={{backgroundColor: '#0b0612', overflow: 'hidden'}}>
      <Audio src={staticFile('sfx_draw.wav')} />
      {t < DR.dive ? (
        <AbsoluteFill style={{transform: `translate(${swayX}px, ${swayY}px) rotate(${swayR}deg) scale(${scale})`}}>
          <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 40%, #2b1a44, #0b0612 70%)'}} />
          <div style={{position: 'absolute', left: SCR.x - 36, top: SCR.y - 36, width: SCR.w + 72, height: SCR.h + 72, borderRadius: 48,
            background: 'linear-gradient(145deg, #2a2a30, #0e0e12)', boxShadow: '0 40px 80px rgba(0,0,0,0.6), inset 0 0 0 2px rgba(255,255,255,0.06)'}} />
          <div style={{position: 'absolute', left: SCR.x, top: SCR.y, width: SCR.w, height: SCR.h, borderRadius: 14, overflow: 'hidden'}}>
            <Screen t={t} frame={frame} />
          </div>
          <AbsoluteFill style={{background: 'linear-gradient(115deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 60%)'}} />
        </AbsoluteFill>
      ) : (
        <Finale t={t} />
      )}
      <AbsoluteFill style={{backgroundColor: 'white', opacity: Math.max(flash, white)}} />
      <AbsoluteFill style={{backgroundColor: 'black', opacity: black}} />
    </AbsoluteFill>
  );
};
