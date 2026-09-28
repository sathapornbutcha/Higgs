import React from 'react';
import {AbsoluteFill, Audio, Img, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ASPECT, Coin, Grain, Layer, PURPLE, Shine, Vignette, clamp, eInOut, el} from './lib';

// Cinematic trailer: darkness, fog and dust, the character revealed by rim light, the title scanned in by a light sweep.
export const CI = {frame: 0.3, flare: 1.15, char: 1.5, title: 3.0, glint: 3.9, fade: 5.2, end: 6.0};

const Fog: React.FC<{t: number}> = ({t}) => (
  <>
    {[0, 1, 2, 3].map((i) => (
      <div key={i} style={{position: 'absolute', left: `${-20 + 30 * i + 6 * Math.sin(t * 0.3 + i)}%`, top: `${40 + 12 * Math.sin(t * 0.2 + i * 2)}%`,
        width: 1300, height: 700, borderRadius: '50%', background: `radial-gradient(ellipse, rgba(${i % 2 ? PURPLE : '90,40,140'},0.22), rgba(0,0,0,0) 70%)`,
        filter: 'blur(50px)', transform: `translateX(${t * (i % 2 ? 30 : -25)}px)`}} />
    ))}
  </>
);

const Dust: React.FC<{t: number}> = ({t}) => (
  <>
    {new Array(70).fill(0).map((_, i) => {
      const x = random(`dx${i}`) * 1920 + 30 * Math.sin(t * 0.5 + i);
      const y = ((random(`dy${i}`) * 1080 - t * (8 + 20 * random(`dv${i}`))) % 1080 + 1080) % 1080;
      const r = 1 + 3 * random(`dr${i}`), a = (0.25 + 0.5 * random(`da${i}`)) * (0.6 + 0.4 * Math.sin(t * 2 + i));
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: r * 2, height: r * 2, borderRadius: '50%', background: `rgba(255,220,180,${a})`}} />;
    })}
  </>
);

const Flare: React.FC<{t: number; t0: number; y: number; dur?: number}> = ({t, t0, y, dur = 0.9}) => {
  const p = (t - t0) / dur;
  if (p < 0 || p > 1) return null;
  const x = -400 + 2700 * eInOut(p), a = Math.sin(Math.PI * p);
  return (
    <>
      <div style={{position: 'absolute', left: 0, top: y - 3, width: 1920, height: 6, opacity: a * 0.9,
        background: `radial-gradient(ellipse at ${(x / 1920) * 100}% 50%, rgba(255,230,200,1), rgba(255,140,60,0.5) 20%, rgba(0,0,0,0) 60%)`, filter: 'blur(2px)'}} />
      <div style={{position: 'absolute', left: x - 160, top: y - 160, width: 320, height: 320, borderRadius: '50%', opacity: a,
        background: 'radial-gradient(circle, rgba(255,240,220,0.9), rgba(255,150,60,0.25) 35%, rgba(0,0,0,0) 70%)'}} />
    </>
  );
};

export const Cinematic: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const reveal = eInOut(clamp((t - CI.char) / 1.3));
  const cam = 1.12 - 0.12 * eInOut(clamp(t / CI.fade));
  const frameA = clamp((t - CI.frame) / 1.5) * (1 - clamp((t - CI.fade) / 0.6));
  const scan = clamp((t - CI.title) / 0.9);
  const mask = `linear-gradient(90deg, black ${scan * 120 - 20}%, transparent ${scan * 120}%)`;
  const glintP = (t - CI.glint) / 0.5;
  const out = clamp((t - CI.fade) / 0.7);
  return (
    <AbsoluteFill style={{backgroundColor: '#020005', overflow: 'hidden'}}>
      <Audio src={staticFile('sfx_cinematic.wav')} />
      <AbsoluteFill style={{transform: `scale(${cam})`}}>
        <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, rgba(60,20,100,0.55), rgba(0,0,0,0) 60%)', opacity: 0.3 + 0.7 * reveal}} />
        <Fog t={t} />
        <div style={{position: 'absolute', left: 960 - 600, top: 430 - 480, width: 1200, height: 960, opacity: frameA * 0.55,
          transform: `rotate(${t * 6}deg)`, filter: `blur(${3 - 2 * frameA}px) drop-shadow(0 0 40px rgba(${PURPLE},0.9))`}}>
          <Img src={el('back_frame')} style={{width: '100%', height: '100%'}} />
        </div>
        <div style={{position: 'absolute', left: 560, top: -200, width: 800, height: 1500, opacity: 0.25 * reveal, transform: 'rotate(12deg)',
          background: 'linear-gradient(90deg, rgba(0,0,0,0), rgba(255,210,170,0.35), rgba(0,0,0,0))', filter: 'blur(30px)'}} />
        <Layer src="character" x={960} y={420} w={690} aspect={ASPECT.character}
          transform={`scale(${1.04 - 0.04 * reveal}) translateY(${6 * Math.sin(t * 1.1)}px)`}
          filter={`brightness(${0.04 + 0.96 * reveal}) contrast(${1.25 - 0.25 * reveal}) drop-shadow(0 0 ${10 + 40 * reveal}px rgba(${PURPLE},${0.3 + 0.6 * reveal})) drop-shadow(0 30px 40px rgba(0,0,0,0.8))`}>
          <Shine src="character" t={t} at={[CI.char + 0.4]} dur={1.1} />
        </Layer>
        {t >= CI.title && (
          <div style={{WebkitMaskImage: mask, maskImage: mask, position: 'absolute', inset: 0}}>
            <Layer src="logo_text" x={960} y={865} w={820} aspect={ASPECT.logo_text}
              filter={`drop-shadow(0 0 ${18 + 30 * (1 - scan)}px rgba(255,190,120,0.7)) drop-shadow(0 16px 20px rgba(0,0,0,0.8))`}>
              <Shine src="logo_text" t={t} at={[CI.glint - 0.3]} dur={0.8} />
            </Layer>
          </div>
        )}
        {t >= CI.title && scan < 1 && (
          <div style={{position: 'absolute', left: 960 - 410 + 820 * scan * 1.2 - 60, top: 740, width: 120, height: 250, opacity: 1 - scan,
            background: 'radial-gradient(ellipse, rgba(255,235,210,0.9), rgba(0,0,0,0) 70%)', filter: 'blur(6px)'}} />
        )}
        {glintP > 0 && glintP < 1 && (
          <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
            {(() => { const r = 90 * Math.sin(Math.PI * glintP), w = r * 0.08, x = 1330, y = 790;
              return <path fill="white" style={{filter: 'drop-shadow(0 0 14px white)'}} transform={`rotate(${glintP * 60} ${x} ${y})`}
                d={`M${x},${y - r} L${x + w},${y - w} L${x + r},${y} L${x + w},${y + w} L${x},${y + r} L${x - w},${y + w} L${x - r},${y} L${x - w},${y - w} Z`} />; })()}
          </svg>
        )}
        <Dust t={t} />
        <Flare t={t} t0={CI.flare} y={430} />
        <Flare t={t} t0={CI.fade - 0.3} y={600} dur={1.0} />
      </AbsoluteFill>
      {[0, 1, 2].map((i) => {
        const x = [220, 1700, 1500][i], y = [860, 240, 980][i], w = [260, 200, 300][i];
        const a = clamp((t - 2.2 - i * 0.3) / 1) * (1 - out);
        return <div key={i} style={{position: 'absolute', filter: `blur(${10 + i * 4}px)`, opacity: a * 0.75,
          transform: `translate(${Math.sin(t * 0.4 + i) * 40}px, ${-t * 12}px)`}}>
          <Coin x={x} y={y} w={w} phase={t * 3 + i * 2} />
        </div>;
      })}
      <AbsoluteFill style={{background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0 11%, rgba(0,0,0,0) 11% 89%, rgba(0,0,0,0.9) 89%)'}} />
      <Vignette strength={0.85} />
      <Grain frame={frame} opacity={0.09} />
      <AbsoluteFill style={{backgroundColor: 'black', opacity: Math.max(1 - clamp(t / 0.6), out)}} />
    </AbsoluteFill>
  );
};
