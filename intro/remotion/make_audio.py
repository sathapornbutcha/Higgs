"""Synthesize public/sfx.wav for the ClawReveal composition (times match T in src/ClawReveal.tsx)."""
import os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "mograph"))
from core import Mix

T = dict(slash=0.58, reveal=0.85, out=4.2, zoom=4.35, flash=4.72)
BEATS = [1.5, 2, 2.5, 3, 3.5, 4]
SHINES = [1.9, 3.3]

m = Mix(7)
tt = m.ts(T["reveal"])
m.at(0, m.lp(m.noise(T["reveal"]), 12) * (tt / T["reveal"]) ** 2 * 0.6)
m.at(0, m.sweep(60 + 240 * (tt / T["reveal"]) ** 2) * (tt / T["reveal"]) ** 2 * 0.2)
for k in range(3):
    m.swish(T["slash"] + 0.04 * k - 0.02, 0.16, 0.6)
m.boom(T["reveal"], 1.0, 1.5)
for k in range(10):
    m.clink(T["reveal"] + 0.1 + k * 0.07 + m.rng.uniform(0, 0.04), m.rng.uniform(0.4, 0.9), m.rng.uniform(2800, 4300))
bass = (55.0, 65.41, 49.0, 55.0, 65.41, 73.42)
for k, b in enumerate(BEATS):
    m.kick(b, 0.85)
    m.hat(b + 0.25, 0.18)
    m.note(b, bass[k], 0.45, 0.3, 5)
for s in SHINES:
    m.chime(s)
m.drone(55, 0.06, start=T["reveal"], end=T["flash"])
tt = m.ts(T["flash"] - T["out"])
m.at(T["out"], (m.noise(len(tt) / 44100) - m.lp(m.noise(len(tt) / 44100), 5)) * (tt / tt[-1]) ** 2 * 0.5)
m.boom(T["flash"], 0.9, 0.28)
m.write(os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "sfx.wav"))
print("ok")
