"""Synthesize the soundtracks for Esports, Anime, Cinematic and Cute (times match the .tsx timelines)."""
import os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "mograph"))
import core

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")
midi = lambda n: 440 * 2 ** ((n - 69) / 12)


def mix(dur, seed):
    core.DUR = dur
    return core.Mix(seed)


def snare(m, t0, g=0.35):
    nz = m.noise(0.18)
    m.at(t0, ((nz - m.lp(nz, 3)) * np.exp(-18 * m.ts(0.18)) + np.sin(2 * np.pi * 190 * m.ts(0.18)) * np.exp(-30 * m.ts(0.18))) * g)


def saw(m, t0, f, d, g, dec=4):
    tt = m.ts(d)
    m.at(t0, (2 * ((f * tt) % 1) - 1) * np.exp(-dec * tt) * np.clip(tt / 0.005, 0, 1) * g)


# Esports: 150 BPM, beat 0.4 s
m = mix(5.0, 1)
for k, b in enumerate(np.arange(0.0, 4.2, 0.4)):
    m.kick(b, 0.9 if b >= 1.6 else 0.6)
    m.hat(b + 0.2, 0.2)
    if k % 2:
        snare(m, b, 0.3)
    saw(m, b, midi((33, 33, 36, 31)[(k // 2) % 4]), 0.38, 0.22, 3)
for c in (0.4, 0.8, 1.2):
    m.swish(c - 0.05, 0.15, 0.7)
tt = m.ts(0.4)
m.at(1.2, m.sweep(200 + 1800 * (tt / 0.4) ** 2) * (tt / 0.4) * 0.15)
m.boom(1.6, 1.0, 1.4)
m.boom(1.68, 0.5, 0.5)
for b in (2.0, 2.4, 2.8, 3.2, 3.6, 4.0):
    m.zap(b, 0.06, 0.2)
m.chime(2.3); m.chime(3.5)
m.whoosh(4.15, 0.5, 0.8)
m.write(os.path.join(OUT, "sfx_esports.wav"))

# Anime: bright, arpeggios, whoosh cuts, hit on the hero pose
m = mix(5.5, 2)
arp = (72, 76, 79, 84, 83, 79, 76, 74)
for k, t0 in enumerate(np.arange(0.0, 4.7, 0.125)):
    m.note(t0, midi(arp[k % 8]), 0.2, 0.06, 12)
for k, b in enumerate(np.arange(1.6, 4.7, 0.5)):
    m.kick(b, 0.7)
    snare(m, b + 0.25, 0.22)
    m.note(b, midi((48, 45, 41, 43)[k % 4]), 0.5, 0.25, 4)
m.swish(0.95, 0.15, 0.6)
m.chime(1.25, ((3136, 0.1), (4186, 0.07)), d=0.6, rise=0.0)
m.swish(1.55, 0.15, 0.7)
m.boom(1.6, 0.8, 1.0)
m.whoosh(2.0, 0.25, 0.5)
m.chime(2.9); m.chime(4.0)
m.whoosh(4.6, 0.5, 0.6)
m.write(os.path.join(OUT, "sfx_anime.wav"))

# Cinematic: drone, heartbeat hits, deep booms, shimmer
m = mix(6.0, 3)
t = m.t
env = np.clip(t / 1.5, 0, 1) * np.clip((5.9 - t) / 0.8, 0, 1)
m.A += (np.sin(2 * np.pi * 36.7 * t) + 0.5 * np.sin(2 * np.pi * 55 * t) + 0.25 * np.sin(2 * np.pi * 73.4 * t)) * 0.09 * env
nz = m.noise(6.0)
m.A += m.lp(nz, 60) * 0.25 * env
for h in (0.6, 1.0):
    m.kick(h, 0.5)
m.whoosh(1.0, 0.5, 0.5)
m.boom(1.5, 1.0, 2.0)
for f, t0 in ((220.0, 1.6), (261.6, 1.6), (329.6, 1.6), (440.0, 3.0), (523.3, 3.0)):
    m.note(t0, f, 2.5, 0.05, 1.2)
m.boom(3.0, 0.7, 1.6)
m.chime(3.9, ((2637, 0.08), (3520, 0.06)), d=1.2, rise=0.0)
m.echo(((0.21, 0.4), (0.43, 0.25), (0.71, 0.12)))
m.write(os.path.join(OUT, "sfx_cinematic.wav"))

# Cute: bouncy bass, pops, boings, coin plinks, slide whistle
m = mix(5.0, 4)
for t0 in (0.15, 0.3, 0.45, 0.55, 0.65, 0.75, 0.85):
    tt = m.ts(0.08)
    m.at(t0, m.sweep(500 + 900 * tt / 0.08) * np.exp(-25 * tt) * 0.2)
tt = m.ts(0.5)
m.at(1.48, m.sweep(160 * (1 + 0.8 * tt) + 60 * np.sin(2 * np.pi * 14 * tt) * np.exp(-3 * tt)) * np.exp(-3 * tt) * 0.35)
m.kick(1.48, 0.8)
m.at(1.65, m.sweep(220 * (1 + tt) + 80 * np.sin(2 * np.pi * 18 * tt) * np.exp(-3 * tt)) * np.exp(-4 * tt) * 0.3)
for k in range(14):
    m.clink(1.9 + m.rng.uniform(0.3, 1.6), m.rng.uniform(0.3, 0.7), m.rng.uniform(3000, 4500))
for k, b in enumerate(np.arange(1.7, 4.3, 0.25)):
    m.note(b, midi((52, 55, 57, 55, 52, 50, 48, 50)[k % 8]) / 2, 0.22, 0.25, 9)
    if k % 2 == 0:
        m.kick(b, 0.45)
for h in (2.2, 2.7, 3.2, 3.7):
    tt = m.ts(0.3)
    m.at(h, m.sweep(300 + 500 * tt / 0.3) * np.exp(-6 * tt) * 0.08)
tt = m.ts(0.6)
m.at(4.3, m.sweep(1700 - 1300 * (tt / 0.6) ** 1.5) * 0.13)
m.kick(4.85, 0.6)
m.write(os.path.join(OUT, "sfx_cute.wav"))
print("ok")
