"""Render small looping GIF previews of each style (for the repo front page).

    python3 previews.py ../logo.png ../previews [style,style,...]
"""
import importlib, os, sys
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_intro import STYLES

logo, outdir = sys.argv[1], sys.argv[2]
styles = sys.argv[3].split(",") if len(sys.argv) > 3 else STYLES
os.makedirs(outdir, exist_ok=True)
for name in styles:
    frame, _, _ = importlib.import_module(name).build(logo)
    frames = [frame(i).resize((384, 216), Image.LANCZOS).quantize(colors=96, dither=Image.Dither.FLOYDSTEINBERG) for i in range(0, 150, 3)]
    path = os.path.join(outdir, f"{name}.gif")
    frames[0].save(path, save_all=True, append_images=frames[1:], duration=100, loop=0, optimize=True)
    print(f"{path}: {os.path.getsize(path) / 1e6:.1f} MB", flush=True)
