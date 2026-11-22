# Road to D1 — animated series pipeline

Vertical (1080x1920, 30 fps) low-poly 3D cartoon comedy for TikTok / Reels / Shorts.
Everything is procedural: characters, sets, props, SFX and music are all generated in code.
No downloaded models, no paid APIs, no AI video.

This folder is self-contained. It lives inside the d3scores repo but is **not** part of the
website (`.vercelignore` excludes it). Work from `road-to-d1/` for every command below.

To make a new episode, use the skill at `../.claude/skills/new-episode/SKILL.md`.

---

## Series bible (LOCKED — keep identical across episodes)

**Series:** Road to D1. Two best friends in high school chasing college football.
Tre is the flashy 3-star wide receiver obsessed with rankings and coach DMs. Gus is his
best friend, the long snapper nobody notices, and he narrates everything with deadpan
honesty. **Running joke:** Tre does everything to get noticed; Gus keeps getting the
attention by accident.

**Tone:** relatable high-school comedy, deadpan narration, fast cuts. Clean language — no
swearing, no slurs. Brand- and family-safe. No real schools, coaches, players, brand logos
or real app UIs (generic chat/DM screens only). All names fictional. Never put the owner's
real name, school, team or location in a video or a committed file.

### Characters (code in `src/characters/` — never change between episodes)

| | Gus (narrator, long snapper, junior) | Tre (wide receiver, junior) |
|---|---|---|
| Build | shorter, stocky (`height` 1.0, `width` 1.12) | tall, lean (`height` 1.14, `width` 0.92) |
| Skin | light `#F1C7A1` | medium-brown `#9A6440` |
| Hair | messy medium-brown `#6B4426` block + tufts | short black twists on top + fade, white headband |
| Top | maroon hoodie `#7A1F2B` | teal letterman `#1E8C8C`, white sleeves |
| Bottom | gray sweatpants `#8A8F96` | black joggers `#1C1C22` |
| Shoes | white-and-gray sneakers | bright white sneakers |
| Default face | `neutral` = unimpressed, half-lidded | `hyped` = raised brows |
| Voice | Kokoro `am_michael` (calm, dry) — see DECISIONS.md | Kokoro `am_fenrir` (energetic, higher) — see DECISIONS.md |

**Extras** (same rig, `src/characters/extras.ts`): `freshman` (big backpack), `lunchLady`
(hairnet, apron), `coach` (cap + whistle), `punter`, `kid` (generic student).

### Rig contract (`src/characters/Rig.tsx`)

Props: `expression` (neutral, annoyed, shocked, smug, sad, hyped, eyeTwitch),
`pose` (idle, talk, phoneHold, run, celebrate, facepalm, armsCrossed, lookOver, juke,
snap, sit, chew), `mouthOpen` 0..1, `blink` 0..1 (auto if omitted), `lookAt` [yaw, pitch],
`position`, `rotation`, `t` (local frame for idle motion), `seed`.
Joints: neck, shoulders, elbows, hips, knees. Idle breathing (1.5 % chest scale) and seeded
auto-blinks every 0.6–2.4 s are built in, so characters never freeze.

---

## The look

- Low-poly flat-shaded: `MeshLambertMaterial({ flatShading: true })`, low-segment geometry so
  facets show. Head ≈ 1/3 of body height, rounded-box head (beveled low-poly).
- Face is the show: two solid black oval eyes, thick block eyebrows that rotate/shift per
  expression, nose wedge, dark mouth box that opens into a rounded shape.
- Light: warm key from the window side, cool hemisphere fill, soft shadows.
- Sets (`src/sets/`): Classroom, Hallway (blue lockers), Cafeteria (white tables, orange trays),
  Bedroom (night, phone glow), Field (golden hour, yard lines, goalposts, bleachers).
- Camera: medium close-ups and close-ups, cut every 1.5–3 s, every hold pushes in 2–4 %,
  shake on punchlines, never a static frame for 12+ frames.
- Captions (`src/components/Captions.tsx`): Montserrat Black, white, 11 px black stroke with
  `paintOrder: stroke`, 1–4 words per page, one yellow `#FFD21F` keyword, 1.0→1.08→1.0 pop over
  4 frames, centred at ~58 % height.
- TikTok safe zone: keep out of top 10 %, bottom 22 %, right 14 %. Debug overlay lives only in the
  `SafeZoneDebug` composition.

---

## Pipeline (what runs where)

```
scripts/voice_samples.py      every am_* voice says one test line   -> voice_samples/*.wav (committed)
scripts/make_voices.py <ep>   one WAV per sentence, trimmed           -> voice/<ep>/*.wav
scripts/build_timeline.py     beats + sentence timing + word timing   -> src/episodes/<ep>/timeline.json, captions.json
                              RMS lip-sync envelopes                  -> src/episodes/<ep>/mouth/*.json
                              voice-only track                        -> public/<ep>/voice.wav
scripts/make_audio.py <ep>    synth SFX + music, mix, loudnorm 2-pass -> out/<ep>/mix_music.wav, mix_nomusic.wav
scripts/render.sh <ep>        chunked Remotion render + mux           -> out/<ep>/*.mp4
scripts/stills.sh             quick still checks                      -> review/*.png
scripts/contact_sheet.py      tiled frame grid                        -> review/*.jpg
scripts/qa.py <mp4>           ffprobe/black/freeze/loudness/caption diff/size gate
```

Episode data lives in `src/episodes/<ep>/` — `script.ts` (lines + highlight words),
`shots.ts` (shot list as data), `timeline.json`, `captions.json`, `mouth/`.

---

## Environment gotchas (learned the hard way — read before rendering)

- Foreground tool calls time out. Run installs/renders with `nohup … > logs/x.log 2>&1 &` and poll.
- Hugging Face is **blocked** by the network allowlist, so whisper.cpp models can't download.
  Captions use the fallback: TTS one sentence at a time → exact sentence start/end from WAV
  lengths → words spread inside a sentence by syllable count. We wrote the script, so the
  caption words are exact by construction.
- Kokoro model files come from GitHub releases (allowed) into `models/` (gitignored, ~340 MB).
- `REMOTION_TMP`/`TMPDIR` → `./tmp`; delete `./tmp/remotion*` between renders. Keep `public/` tiny.
- WebGL with no GPU: see "Render settings" below for the GL flag that works.
- Remotion versions are pinned exactly in package.json (no `^`). Don't bump mid-series.
- This folder has its own package.json; the d3scores site (repo root) has none on purpose —
  never add one at the root, it changes how Vercel runs `api/*.js`.

## Render settings (filled in from real runs)

See "What we learned" below.

---

## What we learned
