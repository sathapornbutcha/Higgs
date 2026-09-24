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

## Motion-graphic intros (0 credits)

Rendered procedurally (Pillow + numpy + ffmpeg, no AI) by [`mograph/make_intro.py`](mograph/make_intro.py);
self-serve instructions (Thai): [HOW_TO.md](HOW_TO.md). 1920×1080, 30 fps, 5 s, AAC audio.

| Style | Module | Video |
|---|---|---|
| Energy Slam | `energy.py` | https://d2ol7oe51mr4n9.cloudfront.net/user_3JUM3dHzNuPuytSmn31lrQk8N8H/cc63d1e3-b1d6-427a-8636-c7f31649199b.mp4 |
| Glitch / Cyber | `glitch.py` | https://d2ol7oe51mr4n9.cloudfront.net/user_3JUM3dHzNuPuytSmn31lrQk8N8H/523217e3-e86d-40bf-a201-09dcee3b82f9.mp4 |
| Claw Snatch | `claw.py` | https://d2ol7oe51mr4n9.cloudfront.net/user_3JUM3dHzNuPuytSmn31lrQk8N8H/229b241c-2835-46bf-a561-cb85177b8f99.mp4 |
| Comic Pop | `comic.py` | https://d2ol7oe51mr4n9.cloudfront.net/user_3JUM3dHzNuPuytSmn31lrQk8N8H/77d20c1a-42e5-4fcd-b526-d9c68dcb5ddc.mp4 |
| Magic Portal | `portal.py` | https://d2ol7oe51mr4n9.cloudfront.net/user_3JUM3dHzNuPuytSmn31lrQk8N8H/60cd2b06-6f69-4fb4-8a38-8b952122df11.mp4 |

Preview sheets: [energy](https://d2ol7oe51mr4n9.cloudfront.net/user_3JUM3dHzNuPuytSmn31lrQk8N8H/464868e5-ac9d-45e2-ac5a-169347005dd0.jpg),
[other four](https://d2ol7oe51mr4n9.cloudfront.net/user_3JUM3dHzNuPuytSmn31lrQk8N8H/30de63af-3ae6-43ae-b20b-702bbd682ba6.jpg).

Re-render: `python3 intro/mograph/make_intro.py --logo logo.png --styles all --out out`, or run the
**Make intro clip** GitHub Actions workflow.
