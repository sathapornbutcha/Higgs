"""Synthesize public/sfx_el.wav for ElementsIntro (times match E in src/ElementsIntro.tsx)."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "mograph"))
import core
core.DUR = 6.0
from core import Mix

E = dict(portal=0.15, burst=0.7, text=1.25, hold=1.7, paw=4.75, black=5.55)
BEATS = [2.0, 2.5, 3.0, 3.5, 4.0, 4.5]
m = Mix(11)
tt = m.ts(E["burst"])
m.at(0, m.lp(m.noise(E["burst"]), 14) * (tt / E["burst"]) ** 2 * 0.6)
m.at(E["portal"], m.sweep(70 + 200 * (m.ts(0.55) / 0.55) ** 2) * 0.18)
m.swish(0.1, 0.35, 0.5)
m.swish(0.25, 0.35, 0.4)
m.boom(E["burst"], 1.0, 1.5)
m.whoosh(E["text"] - 0.25, 0.3, 0.5)
m.kick(E["text"] + 0.16, 1.0)
m.boom(E["text"] + 0.16, 0.6, 0.6)
for k in range(8):
    m.clink(E["text"] + 0.3 + k * 0.09 + m.rng.uniform(0, 0.04), m.rng.uniform(0.4, 0.8), m.rng.uniform(2800, 4300))
bass = (55.0, 65.41, 49.0, 55.0, 65.41, 73.42)
for k, b in enumerate(BEATS):
    m.kick(b, 0.85)
    m.hat(b + 0.25, 0.18)
    m.note(b, bass[k], 0.45, 0.3, 5)
for s in (2.2, 3.7):
    m.chime(s)
m.drone(55, 0.06, start=E["burst"], end=E["black"])
tt = m.ts(E["black"] - E["paw"])
nz = m.noise(E["black"] - E["paw"])
m.at(E["paw"], (nz - m.lp(nz, 5)) * (tt / tt[-1]) ** 2 * 0.55)
m.boom(E["black"], 1.0, 0.45)
m.write(os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "sfx_el.wav"))
print("ok")
