"""Make The Snatchers-style intro clips from any transparent logo. No AI, no credits.

    python3 make_intro.py --logo logo.png                       # all styles
    python3 make_intro.py --logo "<Google Drive share link>" --styles claw,comic --out out

Needs: pip install pillow numpy imageio-ffmpeg   (or a system ffmpeg on PATH)
"""
import argparse, importlib, os, re, shutil, sys, urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
STYLES = ("energy", "glitch", "claw", "comic", "portal")


def fetch_logo(src, dest):
    if os.path.exists(src):
        return src
    m = re.search(r"drive\.google\.com/(?:file/d/|open\?id=|uc\?.*id=)([\w-]+)", src)
    url = f"https://drive.google.com/uc?export=download&id={m.group(1)}" if m else src
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
        shutil.copyfileobj(r, f)
    return dest


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--logo", required=True, help="PNG path or URL (Google Drive share links work); transparent background works best")
    ap.add_argument("--styles", default="all", help=f"comma list of {', '.join(STYLES)} or 'all'")
    ap.add_argument("--out", default="out")
    ap.add_argument("--name", default="intro", help="output file prefix")
    a = ap.parse_args()
    styles = STYLES if a.styles.strip() in ("", "all") else [s.strip() for s in a.styles.split(",")]
    bad = [s for s in styles if s not in STYLES]
    if bad:
        sys.exit(f"unknown style(s): {bad}; choose from {STYLES}")
    if "FFMPEG" not in os.environ and not shutil.which("ffmpeg"):
        import imageio_ffmpeg
        os.environ["FFMPEG"] = imageio_ffmpeg.get_ffmpeg_exe()
    import core
    from PIL import Image
    core.FFMPEG = os.environ.get("FFMPEG", "ffmpeg")
    os.makedirs(a.out, exist_ok=True)
    logo = fetch_logo(a.logo, os.path.join(a.out, "_logo_src"))
    im = Image.open(logo)
    if im.mode != "RGBA" or im.getchannel("A").getextrema()[0] == 255:
        print("warning: logo has no transparency; it will show as a rectangle", flush=True)
    sheet = Image.new("RGB", (1920, 270 * len(styles)))
    for row, name in enumerate(styles):
        frame, mix, prev = importlib.import_module(name).build(logo)
        thumbs = core.render(frame, mix, os.path.join(a.out, f"{a.name}_{name}.mp4"), prev, log=lambda s: print(s, flush=True))
        for k, th in enumerate(thumbs):
            sheet.paste(th, (k * 480, row * 270))
    sheet.save(os.path.join(a.out, f"{a.name}_preview.jpg"), quality=85)
    if logo.endswith("_logo_src"):
        os.remove(logo)
    print("done ->", os.path.abspath(a.out), flush=True)


if __name__ == "__main__":
    main()
