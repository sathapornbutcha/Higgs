"""Magic Portal: purple fog, a magic circle draws itself, light burst, logo materialises from blur, glint, slow fade."""
from core import *

BURST = 1.4
PREVIEW = (24, 45, 84, 97)
ARP = (880.0, 1046.5, 1174.7, 1318.5, 1568.0, 1760.0, 2093.0)


def build(logo_path):
    LOGO, LW, LH = load_logo(logo_path, 800)
    BG = radial(W, H, (22, 6, 38), (0, 0, 0), 0.7)

    def fogtex(seed, color):
        rg = np.random.default_rng(seed)
        oct_ = lambda h, w: Image.fromarray((rg.random((h, w)) * 255).astype(np.uint8)).resize((W + 400, H + 400), Image.BICUBIC)
        img = Image.blend(oct_(9, 16), oct_(18, 32), 0.4).filter(ImageFilter.GaussianBlur(60))
        layer = Image.new("RGBA", img.size, color + (0,))
        layer.putalpha(img.point(lambda v: int(max(0, v - 100) * 1.6)))
        return layer

    FOG = (fogtex(1, (120, 40, 200)), fogtex(2, (255, 120, 30)))
    rnd = random.Random(13)
    DUST = [(rnd.uniform(0, W), rnd.uniform(0, H), rnd.uniform(15, 50), rnd.uniform(1.5, 4), rnd.uniform(0, 6.3), rnd.uniform(1, 3))
            for _ in range(80)]
    RAYS = [(rnd.uniform(0, 2 * math.pi), rnd.uniform(900, 1500), rnd.randint(2, 6)) for _ in range(26)]

    def circle(d, k, t, a):
        col, c = GOLD + (int(255 * a),), (CX * k, CY * k)
        P = lambda st, du: clamp((t - st) / du)
        box = lambda r: (c[0] - r * k, c[1] - r * k, c[0] + r * k, c[1] + r * k)
        pa, pb, pc, pd, pe = P(0.15, 0.6), P(0.3, 0.6), P(0.45, 0.6), P(0.6, 0.6), P(0.75, 0.5)
        w = lambda px: max(1, int(px * k * 2 if k < 1 else px))
        if pa > 0:
            d.arc(box(500), -90, -90 + 360 * pa, fill=col, width=w(5))
        if pb > 0:
            d.arc(box(560), 90 - 360 * pb, 90, fill=col, width=w(3))
        for j in range(int(72 * pc)):
            ang = math.radians(j * 5 + t * 10)
            d.line((c[0] + 520 * k * math.cos(ang), c[1] + 520 * k * math.sin(ang), c[0] + 545 * k * math.cos(ang),
                    c[1] + 545 * k * math.sin(ang)), fill=col, width=w(2))
        if pe > 0:
            for j in range(36):
                st = j * 10 - t * 14
                d.arc(box(440), st, st + 5 * pe, fill=col, width=w(4))
            d.arc(box(300), 0, 360 * pe, fill=col, width=w(2))
        verts = [(c[0] + 440 * k * math.cos(math.radians(60 * j + t * 6 - 90)), c[1] + 440 * k * math.sin(math.radians(60 * j + t * 6 - 90)))
                 for j in range(6)]
        edges = [(verts[0], verts[2]), (verts[2], verts[4]), (verts[4], verts[0]), (verts[1], verts[3]), (verts[3], verts[5]), (verts[5], verts[1])]
        for j, (p0, p1) in enumerate(edges):
            q = clamp(pd * 6 - j)
            if q > 0:
                d.line((p0, (lerp(p0[0], p1[0], q), lerp(p0[1], p1[1], q))), fill=col, width=w(3))
        if pd >= 1:
            for x, y in verts:
                d.ellipse((x - 18 * k, y - 18 * k, x + 18 * k, y + 18 * k), outline=col, width=w(3))

    def frame(i):
        t = i / FPS
        im = BG.copy()
        for k, (fog, amt, sp) in enumerate(zip(FOG, (0.9, 0.35), (25, -18))):
            ox, oy = int(200 + sp * t) % 400, int(200 + sp * 0.5 * t) % 400
            f = fog.crop((ox, oy, ox + W, oy + H))
            im.alpha_composite(with_alpha(f, amt * (0.6 + 0.4 * clamp(t / 1.4))))
        ov, d = layer()
        for x0, y0, v, sz, ph, w_ in DUST:
            y = (y0 - v * t) % H
            a = int(200 * (0.4 + 0.6 * max(0, math.sin(w_ * t + ph))) * clamp(t / 0.8))
            d.ellipse((x0 - sz, y - sz, x0 + sz, y + sz), fill=GOLD + (a,))
        im.alpha_composite(ov)
        ca = 1.0 if t < BURST else lerp(1.0, 0.5, clamp((t - BURST) / 0.6))
        im.alpha_composite(glow_layer(lambda gd, k: circle(gd, k, t, ca), 5))
        ov, d = layer()
        circle(d, 1, t, ca)
        im.alpha_composite(ov)
        if BURST <= t < BURST + 1.0:
            p = (t - BURST) / 1.0
            ra = 1 - e_out(p)
            im.alpha_composite(glow_layer(lambda gd, k: [gd.line((CX * k, CY * k, (CX + L * math.cos(a) * (0.4 + p)) * k,
                                                                  (CY + L * math.sin(a) * (0.4 + p)) * k), fill=GOLD + (int(220 * ra),), width=wd)
                                                         for a, L, wd in RAYS], 4))
            bw = 40 + 500 * e_out(p)
            im.alpha_composite(glow_layer(lambda gd, k: gd.rectangle(((CX - bw / 2) * k, 0, (CX + bw / 2) * k, H * k),
                                                                     fill=(255, 220, 160, int(160 * ra))), 30))
        if t >= BURST - 0.05:
            p = clamp((t - BURST + 0.05) / 0.75)
            s = 1.12 - 0.12 * e_out(p)
            s *= 1 + 0.01 * math.sin(2 * math.pi * t / 2.2) * clamp((t - 2.2) / 0.4)
            lg = sized(LOGO, LW, LH, s)
            blur = 18 * (1 - e_out(p))
            if blur > 0.5:
                lg = lg.filter(ImageFilter.GaussianBlur(blur))
            if 2.8 <= t < 3.4:
                lg = shine(lg, -0.2 + 1.4 * (t - 2.8) / 0.6, width=0.08, strength=0.6)
            center(im, with_alpha(lg, e_out(p)))
        if 3.1 <= t < 3.6:
            p = (t - 3.1) / 0.5
            r = 110 * math.sin(math.pi * p)
            gx, gy = CX + 250, CY - 300
            im.alpha_composite(glow_layer(lambda gd, k: gd.ellipse(((gx - r * 0.8) * k, (gy - r * 0.8) * k, (gx + r * 0.8) * k, (gy + r * 0.8) * k),
                                                                   fill=(255, 230, 180, 200)), 10))
            gd = ImageDraw.Draw(im, "RGBA")
            star4(gd, gx, gy, r, WHITE + (255,), 0.08)
        out = im.convert("RGB")
        if t >= BURST:
            out = tint(out, WHITE, 0.6 * math.exp(-(t - BURST) * 7))
        out = camera(out, z=1 + 0.12 * e_inout(clamp((t - 3.9) / 1.1)))
        return tint(out, (0, 0, 0), max(1 - clamp(t / 0.5), clamp((t - 4.4) / 0.6)))

    m = Mix(41)
    tt = m.ts(BURST)
    m.at(0, (np.sin(2 * np.pi * 41 * tt) + 0.5 * np.sin(2 * np.pi * 82 * tt)) * (tt / BURST) ** 1.5 * 0.3)
    nz = m.noise(BURST)
    m.at(0, m.lp(nz, 20) * (tt / BURST) ** 2 * 0.8)
    for k, f in enumerate(ARP):
        m.note(0.2 + k * 0.16, f, 1.2, 0.1, 4)
    m.boom(BURST, 1.0, 1.6)
    t_ = m.t
    env = np.clip((t_ - BURST) / 0.8, 0, 1) * np.clip((4.9 - t_) / 0.8, 0, 1) * (0.8 + 0.2 * np.sin(2 * np.pi * 3 * t_))
    for f in (220.0, 261.6, 329.6, 440.0):
        m.A += np.sin(2 * np.pi * f * t_) * 0.035 * env
    m.chime(2.8, ((1760, 0.1), (2637, 0.07), (3520, 0.05)), d=1.0, rise=0.05)
    m.chime(3.1, ((3520, 0.08), (4699, 0.06)), d=0.8, rise=0.0)
    m.whoosh(4.2, 0.7, 0.35)
    m.echo(((0.13, 0.4), (0.29, 0.25), (0.47, 0.15), (0.71, 0.08)))
    return frame, m, PREVIEW
