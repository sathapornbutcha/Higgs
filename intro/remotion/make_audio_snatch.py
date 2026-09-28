"""Synthesize the 10-second soundtrack for Snatch (cue sheet matches SN in src/Snatch.tsx; music sting 150 BPM from 5.0 s)."""
import os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "mograph"))
import core

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")
midi = lambda n: 440 * 2 ** ((n - 69) / 12)
core.DUR = 10.0
m = core.Mix(41)
t = m.t
BEAT = 0.4


def snare(t0, g=0.3):
    tt, nz = m.ts(0.2), m.noise(0.2)
    m.at(t0, ((nz - m.lp(nz, 3)) * np.exp(-16 * tt) + np.sin(2 * np.pi * 185 * tt) * np.exp(-28 * tt)) * g)


def saw(t0, f, d, g, dec=3.0):
    tt = m.ts(d)
    m.at(t0, (2 * ((f * tt) % 1) - 1) * np.exp(-dec * tt) * np.clip(tt / 0.004, 0, 1) * g)


def stab(t0, notes, d=0.35, g=0.05):
    for n in notes:
        for det in (-0.12, 0.12):
            saw(t0, midi(n + det), d, g, 5)


def tick(t0, g=0.3, f=900):
    tt, nz = m.ts(0.08), m.noise(0.08)
    m.at(t0, (np.sin(2 * np.pi * f * tt) * np.exp(-60 * tt) + (nz - m.lp(nz, 2)) * np.exp(-90 * tt) * 0.5) * g)


def bell(t0, f=880, g=0.2, d=2.5):
    tt = m.ts(d)
    s = sum(a * np.sin(2 * np.pi * f * k * tt) * np.exp(-dk * tt) for k, a, dk in ((1, 1, 1.6), (2.76, 0.5, 2.8), (5.4, 0.3, 4.5), (8.9, 0.15, 7)))
    m.at(t0, s * np.clip(tt / 0.002, 0, 1) * g)


def rev_swell(t0, d, g=0.4):          # reverse-cymbal style swell ending at t0 + d
    tt = m.ts(d)
    nz = m.noise(d)
    m.at(t0, (nz - m.lp(nz, 4)) * (tt / d) ** 3 * g)


# 0.0 low rumble, building until the ignition
m.A += (np.sin(2 * np.pi * 38 * t) * 0.10 + m.lp(np.random.default_rng(1).standard_normal(len(t)), 60) * 0.5) * np.clip(t / 0.8, 0, 1) * (t < 1.2) \
    * np.clip((1.2 - t) / 0.4, 0, 1)
for t0 in (0.5, 0.533, 0.667, 0.7):   # lightning cracks
    m.zap(t0, 0.1, 0.4)
# 0.8 energy ignition
rev_swell(0.4, 0.4, 0.35)
m.boom(0.8, 0.7, 1.0)
stab(0.8, (50, 57, 62, 65), 0.6, 0.04)
m.chime(0.8, ((1175, 0.05), (1760, 0.04)), d=0.8, rise=0.2)
# 1.0-1.8 coin rush: metallic spins, whoosh-bys for the near coins
for k in range(16):
    m.clink(1.0 + k * 0.05 + m.rng.uniform(0, 0.02), m.rng.uniform(0.3, 0.7), m.rng.uniform(2600, 4600))
for t0 in (1.05, 1.2, 1.25, 1.4, 1.5):
    m.swish(t0, 0.15, 0.25)
m.whoosh(1.2, 0.14, 0.9); m.whoosh(1.52, 0.13, 0.9)
m.chime(1.8, ((3520, 0.12), (5274, 0.06)), d=0.5, rise=0.0)     # TING
# 2.0 SNATCH
m.swish(1.96, 0.16, 1.0)
m.zap(1.97, 0.06, 0.5)
tick(2.0, 0.6, 500)
m.clink(2.02, 0.8, 2400)
m.whoosh(2.03, 0.25, 0.6)
# 2.55-3.6 assembly locks
for k, t0 in enumerate((2.55, 2.62, 2.8, 2.86, 3.05, 3.3, 3.36, 3.42, 3.48, 3.6)):
    m.swish(t0 - 0.2, 0.2, 0.15)
    tick(t0, 0.35 + 0.02 * k, 700 + 60 * k)
bell(3.05, 1320, 0.08, 0.8)
m.A += np.sin(2 * np.pi * 55 * t) * 0.05 * np.clip((t - 2.5) / 1.2, 0, 1) * (t < 4.3)       # tension drone
# 3.75 silhouette, 4.0 anticipation, 4.2/4.3 aggressive whoosh, 5.0 heavy impact
m.boom(3.75, 0.5, 0.6)
rev_swell(3.9, 0.4, 0.5)
m.whoosh(4.25, 0.75, 1.0)
tt = m.ts(0.7)
m.at(4.3, m.sweep(200 + 1600 * (tt / 0.7) ** 2) * (tt / 0.7) * 0.08)
m.boom(5.0, 1.2, 1.6)
m.kick(5.0, 1.0)
tt, nz = m.ts(1.2), m.noise(1.2)
m.at(5.0, (nz - m.lp(nz, 3)) * np.exp(-4 * tt) * 0.35)              # crash
m.swish(5.02, 0.3, 0.8)                                              # slash wipe
# 5.0-9.0 music sting, 150 BPM, D minor
bass = (38, 38, 41, 36)                                              # D, D, F, C (per bar)
for k in range(10):
    b = 5.0 + k * BEAT
    m.kick(b, 0.85)
    m.hat(b + BEAT / 2, 0.16)
    m.hat(b + BEAT / 4, 0.07); m.hat(b + 3 * BEAT / 4, 0.07)
    if k % 2:
        snare(b, 0.32)
    saw(b, midi(bass[(k // 4) % 4]), BEAT * 0.9, 0.16, 3)
    saw(b + BEAT / 2, midi(bass[(k // 4) % 4] + 12), BEAT * 0.4, 0.07, 6)
for b, ch in ((5.0, (62, 65, 69)), (6.6, (60, 65, 69)), (8.2, (62, 65, 70))):
    stab(b, ch, 0.5, 0.035)
m.whoosh(5.9, 0.4, 0.5)                                              # energy spiral
bell(6.5, 988, 0.25, 2.8)                                            # BELL HIT
m.chime(6.5, ((1976, 0.04), (2960, 0.03)), d=1.0, rise=0.0)
rev_swell(7.2, 0.5, 0.45)
# 7.7 logo impact, 8.0 bass hit
m.boom(7.7, 1.1, 1.2)
stab(7.7, (50, 57, 62, 65, 69), 0.7, 0.05)
tt, nz = m.ts(0.6), m.noise(0.6)
m.at(7.7, (nz - m.lp(nz, 3)) * np.exp(-6 * tt) * 0.3)
tt = m.ts(1.4)
m.at(8.0, np.tanh(2 * np.sin(2 * np.pi * np.cumsum(55 * (1 + 0.8 * np.exp(-20 * tt))) / core.SR) * np.exp(-2 * tt)) * 0.5)
m.swish(8.0, 0.25, 0.6)
# 8.2-8.9 coin falls past the lens and lands
m.whoosh(8.2, 0.3, 0.5)
for t0, g in ((8.52, 1.0), (8.74, 0.6), (8.86, 0.35)):
    m.clink(t0, g, 3100)
# 9.0 energy ambience + final sub drop
pad = np.clip((t - 8.9) / 0.3, 0, 1) * np.clip((10 - t) / 0.35, 0, 1)
for f in (146.8, 174.6, 220.0, 293.7, 440.0):
    m.A += np.sin(2 * np.pi * f * t + np.sin(2 * np.pi * 0.3 * t)) * 0.018 * pad
for k in range(8):
    m.chime(9.0 + k * 0.09, ((midi(86 + (0, 3, 7, 10)[k % 4]), 0.025),), d=0.5, rise=0.0)
tt = m.ts(0.25)
m.at(9.7, np.sin(2 * np.pi * np.cumsum(50 - 20 * tt / 0.25) / core.SR) * 0.4)
m.write(os.path.join(OUT, "sfx_snatch.wav"))
print("ok")
