"""Energy Slam: speed lines, elastic logo slam with flash/shockwave/sparks, rays, orbiting coins, lightning, zoom-through."""
import math, random, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from core import load_logo

W, H, FPS, DUR, SR = 1920, 1080, 30, 5.0, 44100
N = int(FPS * DUR)
M = 40                                   # shake margin
CW, CH = W + 2 * M, H + 2 * M
CX, CY = CW / 2, CH / 2
IMPACT = 0.6
LIGHT = (1.15, 2.45, 3.05, 3.85)         # lightning / zap times
BEATS = np.arange(1.1, 4.2, 0.5)         # kick drum + logo pulse
SHINES = (1.6, 3.4)
ORANGE, GOLD, PURPLE, LILAC = (255, 140, 26), (255, 205, 70), (150, 60, 255), (200, 130, 255)
rng = np.random.default_rng(7)
random.seed(7)

clamp = lambda x, a=0.0, b=1.0: max(a, min(b, x))
e_out = lambda p: 1 - (1 - p) ** 3
e_in = lambda p: p ** 3

LOGO, LW, LH = None, 0, 880

yy, xx = np.mgrid[0:CH, 0:CW]
r = np.clip(np.hypot(xx - CX, yy - CY) / (CW / 2), 0, 1) ** 0.8
BG = (np.array((60, 16, 105)) * (1 - r)[..., None] + np.array((6, 2, 12)) * r[..., None])
BG = Image.fromarray(BG.astype(np.uint8)).convert("RGBA")

RS = int(math.hypot(CW, CH)) + 4
yy, xx = np.mgrid[0:RS, 0:RS] - RS / 2
rays = np.zeros((RS, RS, 4), np.uint8)
rays[..., :3] = (150, 60, 255)
wedge = (np.floor(np.arctan2(yy, xx) / (2 * np.pi / 28)) % 2) == 0
rays[..., 3] = (wedge * np.clip(1 - np.hypot(xx, yy) / (RS / 2), 0, 1) ** 1.2 * 90).astype(np.uint8)
RAYS = Image.fromarray(rays).filter(ImageFilter.GaussianBlur(3))
del yy, xx, r, rays, wedge

SPEED = [(random.uniform(0, 2 * math.pi), random.uniform(0, 0.15), random.choice((ORANGE, PURPLE, (255, 255, 255))),
          random.randint(3, 6)) for _ in range(48)]
SPARKS = []
for _ in range(110):
    a = random.uniform(0, 2 * math.pi)
    v = random.uniform(900, 2600)
    SPARKS.append((a, v, random.uniform(0.5, 1.1), random.choice((GOLD, ORANGE, LILAC, (255, 255, 255))), random.randint(3, 5)))
EMBERS = [(random.uniform(0, CW), random.uniform(0, CH), random.uniform(30, 90), random.uniform(1, 3), random.uniform(0, 6.3),
           random.uniform(2, 5), random.choice((ORANGE, GOLD, LILAC))) for _ in range(70)]


def comp(dst, src, x, y):
    x, y = int(round(x)), int(round(y))
    sx, sy = max(0, -x), max(0, -y)
    if sx or sy:
        src = src.crop((sx, sy, src.width, src.height))
        x, y = x + sx, y + sy
    if src.width > 0 and src.height > 0 and x < dst.width and y < dst.height:
        dst.alpha_composite(src, (x, y))


def bolt(p0, p1, disp, depth):
    if depth == 0:
        return [p0, p1]
    m = ((p0[0] + p1[0]) / 2 + random.uniform(-disp, disp), (p0[1] + p1[1]) / 2 + random.uniform(-disp, disp))
    return bolt(p0, m, disp / 2, depth - 1)[:-1] + bolt(m, p1, disp / 2, depth - 1)


def shine(img, c):
    a = np.asarray(img)[..., 3].astype(np.float32) / 255
    h, w = a.shape
    y, x = np.mgrid[0:h, 0:w]
    d = x / w * 0.7 + y / h * 0.3
    k = np.exp(-(((d - c) / 0.05) ** 2)) * 0.75 * a
    white = np.zeros((h, w, 4), np.uint8)
    white[..., :3] = 255
    white[..., 3] = (k * 255).astype(np.uint8)
    out = img.copy()
    out.alpha_composite(Image.fromarray(white))
    return out


def logo_scale(t):
    tau = t - (IMPACT - 0.071)           # spring hits 1.0 exactly at IMPACT
    if tau <= 0:
        return 0.0, 0.0
    s = 1 - math.exp(-12 * tau) * math.cos(22 * tau)
    rot = -12 * math.exp(-10 * tau) * math.cos(18 * tau)
    s *= 1 + 0.015 * math.sin(2 * math.pi * t / 1.6) * clamp((t - 1.0) / 0.3)
    for b in BEATS:
        if t >= b:
            s *= 1 + 0.02 * math.exp(-(t - b) * 12)
    return s, rot


def frame(i):
    t = i / FPS
    im = BG.copy()
    ra = clamp((t - 0.55) / 0.4) * (1 - clamp((t - 4.3) / 0.5))
    if ra > 0:
        rr = RAYS.rotate(t * 12, resample=Image.BILINEAR)
        o = ((RS - CW) // 2, (RS - CH) // 2)
        rr = rr.crop((o[0], o[1], o[0] + CW, o[1] + CH))
        rr.putalpha(rr.getchannel("A").point(lambda v: int(v * ra)))
        im.alpha_composite(rr)
    d = ImageDraw.Draw(im, "RGBA")
    # embers
    ea = clamp((t - 0.6) / 0.4)
    if ea > 0:
        for x0, y0, v, w_, ph, sz, col in EMBERS:
            x = x0 + 20 * math.sin(w_ * t + ph)
            y = (y0 - v * t) % CH
            a = int(255 * ea * (0.5 + 0.5 * math.sin(3 * w_ * t + ph)))
            d.ellipse((x - sz, y - sz, x + sz, y + sz), fill=col + (a,))
    # coins orbiting behind the logo
    for k in range(6):
        cs = clamp((t - 0.65 - 0.05 * k) / 0.25)
        if cs <= 0:
            continue
        th = 2 * math.pi * k / 6 + t * 1.2
        depth = (math.sin(th) + 1) / 2
        x, y = CX + 880 * math.cos(th), CY + 60 + 380 * math.sin(th)
        R = 48 * (0.75 + 0.35 * depth) * e_out(cs)
        f = max(0.15, abs(math.cos(t * 6 + k)))
        d.ellipse((x - R * f, y - R, x + R * f, y + R), fill=(230, 150, 30, 255), outline=(120, 60, 10, 255), width=4)
        d.ellipse((x - R * f * 0.7, y - R * 0.7, x + R * f * 0.7, y + R * 0.7), fill=(255, 205, 70, 255))
    # glow + core FX behind the logo
    g = Image.new("RGBA", (CW // 2, CH // 2), (0, 0, 0, 0))
    gd = ImageDraw.Draw(g, "RGBA")
    any_glow = False
    if t < IMPACT + 0.02:
        p = clamp(t / IMPACT)
        for a, dl, col, wd in SPEED:
            pk = clamp((t - dl) / (IMPACT - dl))
            if pk <= 0:
                continue
            rh = 1500 - 1440 * e_in(pk)
            L = 250 + 250 * pk
            p0 = (CX + rh * math.cos(a), CY + rh * math.sin(a))
            p1 = (CX + (rh + L) * math.cos(a), CY + (rh + L) * math.sin(a))
            d.line((p0, p1), fill=col + (220,), width=wd)
            gd.line(((p0[0] / 2, p0[1] / 2), (p1[0] / 2, p1[1] / 2)), fill=col + (200,), width=wd * 2)
        rad = 1100 * (1 - e_in(p)) + 20
        d.ellipse((CX - rad, CY - rad, CX + rad, CY + rad), outline=ORANGE + (200,), width=5)
        gd.ellipse(((CX - rad) / 2, (CY - rad) / 2, (CX + rad) / 2, (CY + rad) / 2), outline=ORANGE + (200,), width=6)
        any_glow = True
    for st, col in ((IMPACT, ORANGE), (IMPACT + 0.08, PURPLE)):
        if st <= t < st + 0.7:
            p = (t - st) / 0.7
            rad = 150 + 1300 * e_out(p)
            wd = max(1, int(30 * (1 - p)))
            a = int(255 * (1 - p))
            d.ellipse((CX - rad, CY - rad, CX + rad, CY + rad), outline=col + (a,), width=wd)
            gd.ellipse(((CX - rad) / 2, (CY - rad) / 2, (CX + rad) / 2, (CY + rad) / 2), outline=col + (a,), width=wd)
            any_glow = True
    lflash = 0.0
    for ev, te in enumerate(LIGHT):
        if te <= t < te + 0.14 and int((t - te) * FPS) % 3 != 2:
            random.seed(ev * 100 + i // 2)
            for _ in range(2):
                a = random.uniform(0, 2 * math.pi)
                p0 = (CX + 420 * math.cos(a), CY + 420 * math.sin(a))
                p1 = (CX + 1150 * math.cos(a + random.uniform(-0.3, 0.3)), CY + 700 * math.sin(a + random.uniform(-0.3, 0.3)))
                pts = bolt(p0, p1, 120, 6)
                gd.line([(x / 2, y / 2) for x, y in pts], fill=(180, 90, 255, 255), width=16)
                d.line(pts, fill=(200, 140, 255, 255), width=10)
                d.line(pts, fill=(255, 255, 255, 255), width=4)
            lflash = 0.1
            any_glow = True
    if any_glow:
        g = g.filter(ImageFilter.GaussianBlur(6)).resize((CW, CH), Image.BILINEAR)
        im.alpha_composite(g)
    # logo
    s, rot = logo_scale(t)
    if s > 0.01:
        lg = LOGO.resize((max(1, int(LW * s)), max(1, int(LH * s))), Image.BICUBIC)
        for s0 in SHINES:
            if s0 <= t < s0 + 0.5:
                lg = shine(lg, -0.2 + 1.4 * (t - s0) / 0.5)
        if abs(rot) > 0.05:
            lg = lg.rotate(rot, resample=Image.BICUBIC, expand=True)
        comp(im, lg, CX - lg.width / 2, CY - lg.height / 2)
    # sparks in front
    if t >= IMPACT:
        tau = t - IMPACT
        for a, v, life, col, wd in SPARKS:
            if tau > life:
                continue
            pos = lambda tt: 330 + v * (1 - math.exp(-2 * tt)) / 2
            r0, r1 = pos(tau), pos(max(0, tau - 0.03))
            al = int(255 * (1 - tau / life))
            d.line(((CX + r0 * math.cos(a), CY + r0 * math.sin(a) + 80 * tau * tau),
                    (CX + r1 * math.cos(a), CY + r1 * math.sin(a) + 80 * tau * tau)), fill=col + (al,), width=wd)
    out = im.convert("RGB")
    # flash
    fl = 0.75 * math.exp(-(t - IMPACT) * 18) if t >= IMPACT else 0
    if fl > 0.01:
        out = Image.blend(out, Image.new("RGB", out.size, (255, 255, 255)), fl)
    if lflash:
        out = Image.blend(out, Image.new("RGB", out.size, (190, 120, 255)), lflash)
    # camera: shake + end zoom
    amp = 28 * math.exp(-9 * (t - IMPACT)) if t >= IMPACT else 0
    amp += 6 * (lflash > 0)
    dx, dy = amp * math.sin(t * 97), amp * math.cos(t * 83)
    z = 1 + 3 * e_in(clamp((t - 4.35) / 0.65))
    bw, bh = W / z, H / z
    box = (CX + dx - bw / 2, CY + dy - bh / 2, CX + dx + bw / 2, CY + dy + bh / 2)
    out = out.resize((W, H), Image.BILINEAR, box=box)
    fade = max(1 - clamp(t / 0.2), clamp((t - 4.7) / 0.3))
    if fade > 0:
        out = Image.blend(out, Image.new("RGB", out.size, (0, 0, 0)), fade)
    return out


def audio(path):
    n = int(SR * DUR)
    tt_all = np.arange(n) / SR
    A = np.zeros(n)

    def at(t0, sig):
        i = int(t0 * SR)
        j = min(n, i + len(sig))
        A[i:j] += sig[: j - i]

    ts = lambda d: np.arange(int(d * SR)) / SR
    noise = lambda d: rng.standard_normal(int(d * SR))
    lp = lambda x, k: np.convolve(x, np.ones(k) / k, "same")
    # whoosh in
    tt = ts(0.6); nz = noise(0.6)
    at(0.0, (lp(nz, 40) * (1 - tt / 0.6) + (nz - lp(nz, 6)) * 0.5 * (tt / 0.6)) * (tt / 0.6) ** 2 * 0.9)
    # impact boom
    tt = ts(1.2); f = 40 + 80 * np.exp(-12 * tt)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-4 * tt) + lp(noise(1.2), 8) * np.exp(-25 * tt) * 0.8
    at(IMPACT, np.tanh(boom * 1.5))
    # coin clinks
    for c0 in (0.75, 0.9, 1.02):
        tt = ts(0.4)
        at(c0, (np.sin(2 * np.pi * 3300 * tt) * 0.12 + np.sin(2 * np.pi * 4950 * tt) * 0.07) * np.exp(-14 * tt))
    # kick on beats, hat off-beat
    for b in BEATS:
        tt = ts(0.3); f = 50 + 90 * np.exp(-30 * tt)
        at(b, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-14 * tt) * 0.7)
        h = noise(0.06)
        at(b + 0.25, (h - lp(h, 3)) * np.exp(-70 * ts(0.06)) * 0.15)
    # shine sparkle
    for s0 in SHINES:
        tt = ts(0.7)
        sig = sum(np.sin(2 * np.pi * (f0 + f0 * 0.5 * tt) * tt) * a for f0, a in ((2100, 0.12), (3150, 0.08), (4400, 0.06)))
        at(s0, sig * np.exp(-5 * tt) * np.clip(tt / 0.05, 0, 1))
    # electric zaps
    for z0 in LIGHT:
        tt = ts(0.16); nz = noise(0.16)
        at(z0, (nz - lp(nz, 4)) * (np.sin(2 * np.pi * 70 * tt) > 0) * np.exp(-12 * tt) * 0.35)
    # outro riser
    tt = ts(0.7); nz = noise(0.7)
    at(4.3, (nz - lp(nz, 5)) * (tt / 0.7) ** 2 * 0.5)
    # sub drone
    A += np.sin(2 * np.pi * 55 * tt_all) * 0.06 * np.clip((tt_all - 0.6) / 0.3, 0, 1) * np.clip((4.9 - tt_all) / 0.4, 0, 1)
    A *= np.clip((DUR - tt_all) / 0.15, 0, 1)
    A = A / np.max(np.abs(A)) * 0.89
    pcm = (A * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(np.repeat(pcm, 2).tobytes())



PREVIEW = (19, 26, 54, 138)


class _Audio:
    write = staticmethod(audio)


def build(logo_path):
    global LOGO, LW
    LOGO, LW, _ = load_logo(logo_path, LH)
    return frame, _Audio, PREVIEW
