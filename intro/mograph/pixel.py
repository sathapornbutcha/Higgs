"""Arcade 8-bit: INSERT COIN, a pixel coin drops in, the logo de-pixelates, chiptune, pixel dissolve out."""
from PIL import ImageOps
from core import *

COIN_T = 0.6
DEPIX = (0.9, 1.6)
REPIX = 4.3
STEPS = (96, 64, 48, 32, 24, 16, 12, 8, 6, 4, 2, 1)
PREVIEW = (12, 33, 70, 141)
FONT = {
    "A": (".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"),
    "C": (".####", "#....", "#....", "#....", "#....", "#....", ".####"),
    "D": ("####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."),
    "E": ("#####", "#....", "#....", "####.", "#....", "#....", "#####"),
    "I": ("#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"),
    "L": ("#....", "#....", "#....", "#....", "#....", "#....", "#####"),
    "N": ("#...#", "##..#", "#.#.#", "#.#.#", "#..##", "#...#", "#...#"),
    "O": (".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."),
    "P": ("####.", "#...#", "#...#", "####.", "#....", "#....", "#...."),
    "R": ("####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"),
    "S": (".####", "#....", "#....", ".###.", "....#", "....#", "####."),
    "T": ("#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."),
    "Y": ("#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."),
    "1": ("..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."),
    "!": ("..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."),
    " ": (".....",) * 7,
}
midi = lambda n: 440 * 2 ** ((n - 69) / 12)


def pixel_text(d, text, cx, y, px, color):
    x0 = cx - (len(text) * 6 - 1) * px / 2
    for k, ch in enumerate(text):
        for r, row in enumerate(FONT[ch]):
            for c, v in enumerate(row):
                if v == "#":
                    x = x0 + (k * 6 + c) * px
                    d.rectangle((x, y + r * px, x + px - 1, y + (r + 1) * px - 1), fill=color)


def pixelate(img, k):
    if k <= 1:
        return img
    small = img.resize((max(1, img.width // k), max(1, img.height // k)), Image.BOX)
    rgb = ImageOps.posterize(small.convert("RGB"), 3)
    a = small.getchannel("A").point(lambda v: 255 if v > 110 else 0)
    small = Image.merge("RGBA", (*rgb.split(), a))
    return small.resize((small.width * k, small.height * k), Image.NEAREST)


def build(logo_path):
    LOGO, LW, LH = load_logo(logo_path, 780)
    logo = sized(LOGO, LW, LH, 1.0)
    rnd = random.Random(4)
    STARS = [(rnd.uniform(0, W), rnd.randrange(0, H, 8), rnd.choice((4, 8, 8, 12)), rnd.choice((WHITE, LILAC, GOLD))) for _ in range(140)]
    BLOCKS = [(x, y, rnd.random()) for x in range(0, W, 48) for y in range(0, H, 48)]
    SPARK = [(rnd.uniform(200, W - 200), rnd.uniform(150, H - 200), rnd.uniform(0, 6.3)) for _ in range(10)]

    def sprite_coin(d, cx, cy, px, spin):
        for gy in range(12):
            for gx in range(12):
                dx, dy = (gx - 5.5) / max(0.2, abs(spin)), gy - 5.5
                r = math.hypot(dx, dy)
                if r < 5.8:
                    col = (120, 60, 10) if r > 4.9 else ((255, 235, 140) if dx < -1.5 and dy < -1.5 else (255, 190, 40))
                    d.rectangle((cx + (gx - 6) * px, cy + (gy - 6) * px, cx + (gx - 5) * px - 1, cy + (gy - 5) * px - 1), fill=col)

    def frame(i):
        t = i / FPS
        im = Image.new("RGB", (W, H), (8, 4, 18))
        d = ImageDraw.Draw(im)
        for x0, y, sz, col in STARS:
            x = int((x0 - t * sz * 40) % W) // 4 * 4
            d.rectangle((x, y, x + sz - 1, y + sz - 1), fill=col if sz > 4 else (90, 70, 120))
        if t < DEPIX[0] and int(t * 4) % 2 == 0:
            pixel_text(d, "INSERT COIN", CX, H - 200, 12, GOLD)
        if 0.15 <= t < COIN_T + 0.1:
            p = clamp((t - 0.15) / (COIN_T - 0.15))
            y = lerp(-100, CY, p * p)
            sprite_coin(d, CX, y, 12, math.cos(t * 14))
        im = im.convert("RGBA")
        if t >= DEPIX[0]:
            if t < DEPIX[1]:
                k = STEPS[min(len(STEPS) - 1, int((t - DEPIX[0]) / (DEPIX[1] - DEPIX[0]) * len(STEPS)))]
            elif t >= REPIX:
                k = STEPS[::-1][min(len(STEPS) - 1, int((t - REPIX) / 0.45 * len(STEPS)))]
            else:
                k = 1
            lg = pixelate(logo, k)
            if 2.6 <= t < 3.1:
                lg = shine(lg, -0.2 + 1.4 * (t - 2.6) / 0.5)
            bob = 8 * round(math.sin(2 * math.pi * (i // 3) * 3 / FPS / 1.2) * 2) if t > DEPIX[1] else 0
            center(im, lg, CX, CY - 40 + bob)
        d = ImageDraw.Draw(im)
        if DEPIX[1] <= t < REPIX:
            for x, y, ph in SPARK:
                k = math.sin(t * 5 + ph)
                if k > 0.3:
                    s = 8 if k > 0.75 else 4
                    d.rectangle((x - s, y - 3 * s, x + s - 1, y + 3 * s - 1), fill=WHITE + (255,))
                    d.rectangle((x - 3 * s, y - s, x + 3 * s - 1, y + s - 1), fill=WHITE + (255,))
            if 2.2 <= t and int(t * 3) % 2 == 0:
                pixel_text(d, "PLAYER 1 READY!", CX, H - 110, 10, ORANGE + (255,))
        out = im.convert("RGB")
        if t >= REPIX + 0.2:
            p = clamp((t - REPIX - 0.2) / 0.45)
            d = ImageDraw.Draw(out)
            for x, y, r in BLOCKS:
                if r < p:
                    d.rectangle((x, y, x + 47, y + 47), fill=(0, 0, 0))
        if COIN_T <= t < COIN_T + 0.15:
            out = tint(out, WHITE, 0.4 * (1 - (t - COIN_T) / 0.15))
        return out

    m = Mix(61)
    sq = lambda f, d, g, dec=6: np.sign(np.sin(2 * np.pi * f * m.ts(d))) * np.exp(-dec * m.ts(d)) * g
    m.at(COIN_T, sq(988, 0.08, 0.2, 0))
    m.at(COIN_T + 0.08, sq(1319, 0.4, 0.2, 5))
    for k, n in enumerate(range(60, 86, 2)):
        m.at(DEPIX[0] + k * 0.055, sq(midi(n), 0.06, 0.14, 10))
    mel = (69, 72, 76, 81, 79, 76, 74, 72)
    for k, t0 in enumerate(np.arange(1.6, REPIX, 0.2)):
        m.at(t0, sq(midi(mel[k % 8]), 0.18, 0.1, 8))
        h = m.noise(0.03)
        m.at(t0 + 0.1, (h - m.lp(h, 2)) * 0.06)
    for k, t0 in enumerate(np.arange(1.6, REPIX, 0.8)):
        m.at(t0, sq(midi((45, 41, 43, 40)[k % 4]), 0.78, 0.12, 1.5))
        m.kick(t0, 0.5)
        m.kick(t0 + 0.4, 0.5)
    for k, n in enumerate(range(84, 58, -3)):
        m.at(REPIX + k * 0.045, sq(midi(n), 0.05, 0.14, 10))
    nz = m.noise(0.4)
    m.at(REPIX + 0.2, m.lp(nz, 6) * np.exp(-6 * m.ts(0.4)) * 0.4)
    return frame, m, PREVIEW
