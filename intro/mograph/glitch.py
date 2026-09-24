"""Glitch / Cyber: logo glitches in over static, glitch bursts on beat, CRT switch-off."""
from core import *

BEATS = np.arange(1.1, 4.2, 0.5)
BURSTS = ((1.5, 0.15, 0.6), (2.6, 0.12, 0.5), (3.3, 0.18, 0.7), (3.9, 0.1, 0.5))
PREVIEW = (12, 30, 46, 139)


def build(logo_path):
    LOGO, LW, LH = load_logo(logo_path, 860)
    base = sized(LOGO, LW, LH, 1.0)
    BG = radial(W, H, (34, 10, 60), (4, 3, 8), 0.9).convert("RGB")
    d = ImageDraw.Draw(BG, "RGBA")
    for x in range(0, W, 80):
        d.line((x, 0, x, H), fill=(150, 60, 255, 45))
    for y in range(0, H, 80):
        d.line((0, y, W, y), fill=(150, 60, 255, 45))
    BG = BG.convert("RGBA")
    SCAN = Image.new("L", (W, H), 0)
    sd = ImageDraw.Draw(SCAN)
    for y in range(0, H, 4):
        sd.line((0, y, W, y), fill=60)
    BLACK = Image.new("RGB", (W, H))

    def intensity(t):
        g = 1 - clamp((t - 0.3) / 0.6) if t >= 0.3 else 0
        for st, du, amp in BURSTS:
            if st <= t < st + du:
                g = max(g, amp)
        return max(g, clamp((t - 4.3) / 0.25) if t < 4.55 else 0)

    def frame(i):
        t = i / FPS
        rnd = random.Random(i * 7919)
        im = BG.copy()
        g = intensity(t)
        ov, d = layer()
        yb = (t * 500) % (H + 200) - 100
        d.rectangle((0, yb, W, yb + 60), fill=(200, 130, 255, 18))
        if t < 0.35 or g > 0.3:  # static
            nz = Image.fromarray((np.random.default_rng(i).random((135, 240)) * 255).astype(np.uint8)).resize((W, H), Image.NEAREST)
            im = Image.composite(Image.merge("RGBA", (nz, nz, nz, Image.new("L", (W, H), 255))), im,
                                 Image.new("L", (W, H), int(255 * (0.22 if t < 0.35 else 0.1 * g))))
        visible = 0.3 <= t < 4.55 and (t > 0.9 or rnd.random() < 0.3 + 0.7 * (t - 0.3) / 0.6)
        if visible:
            s = 1.0
            for b in BEATS:
                if t >= b:
                    s *= 1 + 0.02 * math.exp(-(t - b) * 12)
            lg = base if abs(s - 1) < 0.002 else sized(LOGO, LW, LH, s)
            if 2.0 <= t < 2.5:
                lg = shine(lg, -0.2 + 1.4 * (t - 2.0) / 0.5)
            center(im, lg)
        elif 4.55 <= t < 4.7:  # CRT squash
            p = (t - 4.55) / 0.15
            lg = LOGO.resize((int(LW * (1 + 0.3 * p)), max(2, int(LH * (1 - e_in(p) * 0.99)))), Image.BILINEAR)
            center(im, lg)
        if 4.7 <= t < 4.85:
            p = (t - 4.7) / 0.15
            w = 1500 * (1 - e_in(p)) + 6
            im.alpha_composite(glow_layer(lambda gd, k: gd.rectangle(((CX - w / 2) * k, (CY - 6) * k, (CX + w / 2) * k, (CY + 6) * k),
                                                                     fill=(200, 130, 255, 255)), 8))
            d.rectangle((CX - w / 2, CY - 3, CX + w / 2, CY + 3), fill=WHITE + (255,))
        for _ in range(int(28 * g)):  # data blocks
            x, y = rnd.uniform(0, W), rnd.uniform(0, H)
            d.rectangle((x, y, x + rnd.uniform(20, 320), y + rnd.uniform(4, 30)),
                        fill=rnd.choice((ORANGE, LILAC, WHITE, (0, 0, 0))) + (rnd.randint(120, 230),))
        im.alpha_composite(ov)
        out = im.convert("RGB")
        for _ in range(int(14 * g)):  # slice displacement
            y, h = rnd.randint(0, H - 10), rnd.randint(8, 90)
            band = out.crop((0, y, W, min(H, y + h)))
            out.paste(ImageChops.offset(band, int(rnd.uniform(-1, 1) * 240 * g), 0), (0, y))
        dx = 3 + int(36 * g)
        for b in BEATS:
            if t >= b:
                dx += int(10 * math.exp(-(t - b) * 15))
        out = rgb_split(out, dx)
        out = Image.composite(BLACK, out, SCAN)
        if g > 0.5 and rnd.random() < 0.4:
            out = tint(out, (0, 0, 0), 0.35)
        out = camera(out, rnd.uniform(-1, 1) * 20 * g, rnd.uniform(-1, 1) * 8 * g)
        if t >= 4.85:
            out = tint(out, (0, 0, 0), clamp((t - 4.85) / 0.1))
        return tint(out, (0, 0, 0), 1 - clamp(t / 0.15))

    m = Mix(11)
    tt, nz = m.ts(0.9), m.noise(0.9)
    gate = (m.rng.random(len(tt) // 800 + 1) > 0.45).repeat(800)[: len(tt)]
    m.at(0, (nz - m.lp(nz, 2)) * gate * 0.22)
    m.boom(0.9, 1.0)

    def stutter(t0, d, gain):
        seg, tt = int(0.03 * SR), m.ts(d)
        s = np.zeros(len(tt))
        for k in range(0, len(tt), seg):
            if m.rng.random() < 0.7:
                x = np.sign(np.sin(2 * np.pi * m.rng.uniform(200, 2000) * tt[: min(seg, len(tt) - k)]))
                s[k:k + len(x)] = x
        m.at(t0, s * gain)

    stutter(0.3, 0.55, 0.12)
    for st, du, amp in BURSTS:
        stutter(st, max(du, 0.12), 0.1 + 0.12 * amp)
    for b in BEATS:
        m.kick(b, 0.75)
        m.hat(b + 0.25, 0.18)
    m.chime(2.0, ((1800, 0.08), (2700, 0.06)), rise=0.2)
    stutter(4.3, 0.25, 0.2)
    tt = m.ts(0.4)
    m.at(4.55, m.sweep(3000 * np.exp(-10 * tt) + 60) * np.exp(-4 * tt) * 0.25)
    m.A += np.sign(np.sin(2 * np.pi * 50 * m.t)) * 0.012
    m.drone(49, 0.05)
    return frame, m, PREVIEW
