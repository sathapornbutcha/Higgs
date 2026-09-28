"""Neon Sign: brick wall, the logo's neon outline flickers on, the sign lights up, hums, flickers, powers down."""
from core import *

TUBE_ON = ((0.45, 0.5), (0.58, 0.62), (0.7, 0.95), (1.0, 3.2), (3.27, 4.45), (4.5, 4.55))
FILL_ON = ((1.3, 1.35), (1.45, 1.5), (1.6, 3.2), (3.27, 4.45))
BEATS = np.arange(1.6, 4.3, 0.5)
BASS = (55.0, 43.65, 65.41, 49.0)
PREVIEW = (22, 40, 75, 136)


def on(t, spans):
    return any(a <= t < b for a, b in spans)


def build(logo_path):
    LOGO, LW, LH = load_logo(logo_path, 820)
    rnd = random.Random(3)
    wall = Image.new("RGB", (W, H), (14, 9, 16))
    d = ImageDraw.Draw(wall)
    bw, bh = 120, 50
    for row in range(H // bh + 1):
        off = (bw // 2) * (row % 2)
        for col in range(-1, W // bw + 1):
            v = rnd.randint(-8, 8)
            x, y = col * bw + off, row * bh
            d.rectangle((x + 3, y + 3, x + bw - 3, y + bh - 3), fill=(40 + v, 24 + v // 2, 38 + v))
    vign = radial(W, H, (255, 255, 255), (60, 60, 60), 0.9).convert("RGB")
    WALL = ImageChops.multiply(wall, vign)
    glow_tint = radial(W, H, (255, 150, 230), (30, 20, 40), 0.7).convert("RGB")
    WALL_LIT = ImageChops.screen(WALL, ImageChops.multiply(wall, glow_tint))
    logo = sized(LOGO, LW, LH, 1.0)
    pad = 40
    padded = Image.new("RGBA", (logo.width + 2 * pad, logo.height + 2 * pad), (0, 0, 0, 0))
    padded.alpha_composite(logo, (pad, pad))
    a = padded.getchannel("A").point(lambda v: 255 if v > 100 else 0)
    outline = ImageChops.subtract(a.filter(ImageFilter.MaxFilter(13)), a.filter(ImageFilter.MaxFilter(5)))

    def colored(mask, col):
        img = Image.new("RGBA", mask.size, col + (0,))
        img.putalpha(mask)
        return img

    TUBE = colored(outline, (255, 225, 245))
    GLOW = colored(outline.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(22)).point(lambda v: min(255, v * 3)), (255, 60, 200))
    HALO = colored(outline.filter(ImageFilter.GaussianBlur(60)).point(lambda v: min(255, v * 4)), (150, 60, 255))
    DIM = padded.copy()
    DIM = Image.merge("RGBA", [*Image.eval(DIM.convert("RGB"), lambda v: v // 5).split(), padded.getchannel("A")])

    def frame(i):
        t = i / FPS
        L = (0.93 + 0.07 * math.sin(2 * math.pi * 7 * t)) if on(t, TUBE_ON) else 0.0
        F = 1.0 if on(t, FILL_ON) else 0.0
        im = Image.blend(WALL, WALL_LIT, 0.55 * L + 0.2 * F).convert("RGBA")
        cx, cy = CX - padded.width / 2, CY - padded.height / 2
        comp(im, DIM, cx, cy)
        if L > 0:
            comp(im, with_alpha(HALO, L), cx, cy)
            comp(im, with_alpha(GLOW, L), cx, cy)
        if F > 0:
            lg = padded
            if 2.4 <= t < 2.9:
                lg = shine(lg, -0.2 + 1.4 * (t - 2.4) / 0.5, strength=0.5)
            comp(im, lg, cx, cy)
        if L > 0:
            comp(im, with_alpha(TUBE, L), cx, cy)
        out = camera(im.convert("RGB"), z=1 + 0.05 * t / DUR)
        return tint(out, (0, 0, 0), max(1 - clamp(t / 0.3), clamp((t - 4.75) / 0.25)))

    m = Mix(51)
    tt = m.t
    tube = np.zeros(m.n)
    for a_, b_ in TUBE_ON:
        tube[int(a_ * SR):int(b_ * SR)] = 1
        m.at(a_, m.lp(m.noise(0.015), 3) * 0.5)
        m.kick(a_, 0.25)
    m.A += (2 * ((120 * tt) % 1) - 1) * 0.025 * tube + np.sin(2 * np.pi * 60 * tt) * 0.03 * tube
    for a_, _ in FILL_ON:
        m.at(a_, m.lp(m.noise(0.02), 2) * 0.4)
    t0 = m.ts(0.5)
    m.at(0.45, m.sweep(80 + 320 * t0 / 0.5) * np.exp(-3 * t0) * 0.15)
    for k, b in enumerate(BEATS):
        m.kick(b, 0.75)
        nz = m.noise(0.12)
        m.at(b + 0.25, (nz - m.lp(nz, 4)) * np.exp(-25 * m.ts(0.12)) * 0.3)
        f = BASS[(k // 2) % 4]
        t1 = m.ts(0.48)
        m.at(b, (2 * ((f * t1) % 1) - 1) * np.exp(-3 * t1) * 0.18)
    env = np.clip((tt - 1.6) / 0.5, 0, 1) * np.clip((4.5 - tt) / 0.3, 0, 1)
    for f in (220.0, 261.6, 329.6):
        m.A += np.sin(2 * np.pi * f * tt) * 0.03 * env
    t2 = m.ts(0.5)
    m.at(4.45, m.sweep(400 * np.exp(-6 * t2) + 40) * np.exp(-4 * t2) * 0.2)
    m.at(4.55, m.lp(m.noise(0.02), 3) * 0.5)
    return frame, m, PREVIEW
