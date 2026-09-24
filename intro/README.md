# The Snatchers — YouTube intro

## v1 (2026-09-24)

- Video: https://d8j0ntlcm91z4.cloudfront.net/user_3JUM3dHzNuPuytSmn31lrQk8N8H/hf_20260924_085410_4b38473b-1ba1-4045-8e50-3b5acf8fa8b0.mp4
- Higgsfield job: `4b38473b-1ba1-4045-8e50-3b5acf8fa8b0`
- Model: `seedance1_5` (Seedance 1.5 Pro), 16:9, 720p (1280×720, 24 fps), 4 s, audio on
- Cost: 4.8 credits (free plan)
- Input: transparent logo centred on a 1920×1080 dark-purple glow background,
  used as both `start_image` and `end_image` (media `422410a2-132e-4726-bc02-fc9374f70f77`)
  so the clip starts and ends on the clean logo.

Prompt:

> Energetic anime-style YouTube channel intro. The white plush bunny mascot with button eyes lunges forward and swipes its paw toward the camera in a quick snatching motion, its long orange-tipped ears whipping back. Golden cat-shaped coins spin and orbit around it, purple and orange lightning crackles and flashes across the dark purple background, the golden bell on its collar jingles. Fast camera punch-in, then everything snaps back into the final logo pose as the text "THE SNATCHERS" glows and pulses with electric sparks. Keep the logo artwork and lettering sharp and unchanged. Sound: whoosh, electric zaps, coin clinks, bell jingle, punchy bass hit at the end.

## Free-plan model costs (checked 2026-09-24)

| Model | Setting | Credits | Free plan |
|---|---|---|---|
| `seedance1_5` | 720p, 4 s | 4.8 | ✅ |
| `minimax_hailuo` (2.3-fast) | 768, 6 s | 4 | not tried |
| `veo3_1_lite` | 4 s + audio | 6 | not tried |
| `seedance_2_0_mini` | 720p, 5 s | 5 | ❌ needs Basic |
| `grok_video` | 5 s | 7.5 | ❌ needs Basic |

## Motion-graphic v1 (0 credits)

- Video: https://d2ol7oe51mr4n9.cloudfront.net/user_3JUM3dHzNuPuytSmn31lrQk8N8H/cc63d1e3-b1d6-427a-8636-c7f31649199b.mp4
- Preview sheet: https://d2ol7oe51mr4n9.cloudfront.net/user_3JUM3dHzNuPuytSmn31lrQk8N8H/464868e5-ac9d-45e2-ac5a-169347005dd0.jpg
- 1920×1080, 30 fps, 5 s, AAC audio — rendered procedurally by [`mograph/render.py`](mograph/render.py)
  (Pillow + numpy + ffmpeg), no AI generation.
- Timeline: speed lines + converging ring (0–0.6 s) → elastic logo slam with flash, shockwaves,
  sparks and camera shake (0.6 s) → rotating rays, orbiting coins, embers, beat pulses, shine sweeps
  (1.6 s, 3.4 s) and lightning (1.15/2.45/3.05/3.85 s) → zoom-through and fade to black (4.35–5 s).
- Re-render: `python3 render.py logo.png out.mp4 preview.jpg` (timings are constants at the top of the file).
