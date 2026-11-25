---
name: new-episode
description: Make the next episode of "Road to D1" (vertical 3D cartoon series, Remotion + three.js, in road-to-d1/) from a one-paragraph story idea — script, voices, timing, shots, render, QA, delivery. Use when the owner says "make Ep N", "new episode", "next Road to D1", or gives a story idea for Tre and Gus.
---

# New Road to D1 episode

Everything lives in `road-to-d1/`. Read `road-to-d1/CLAUDE.md` first (series bible, look, gotchas, what we
learned) and `road-to-d1/DECISIONS.md`. Work autonomously: make calls, log them in DECISIONS.md, keep going.
Characters, sets and voices are LOCKED — reuse them, never redesign them.

Below, `epNN` is the new episode id (e.g. `ep02`) and `EpNN` its composition id.

## 1. Script (`src/episodes/epNN/script.json`)
Copy `src/episodes/ep01/script.json` as the format. Rules:
- 62–75 s total. ~3.3 words/s. About 160–180 words.
- Gus narrates, deadpan. Tre is loud. The running joke: Tre tries to get noticed, Gus gets noticed by accident.
- Cold-open hook in line 1, escalate, a silent beat before the big punchline, end on a cliffhanger line.
- Never narrate what the picture already shows. Clean language, fictional names only, no real schools,
  coaches, players, brands or app UIs.
- One sentence per `sentences[]` entry (that is what makes caption timing exact). Use `pre` for beats before a
  sentence/line and `post` for silent visual beats after a line. `tts` overrides pronunciation (e.g. caps).
- `highlights` = the 1–4 words per line that get the yellow caption highlight.
- Voices: Gus `am_michael` 1.12, Tre `am_fenrir` 1.14 (yelling 1.22, slow/stunned 0.86). Don't change them.

## 2. Voices, timing, captions, lip sync
```bash
cd road-to-d1
# models are gitignored; fetch once per fresh VM (GitHub is allowed):
ls models/kokoro-v1.0.onnx || (mkdir -p models && curl -sSL -o models/kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx && curl -sSL -o models/voices-v1.0.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin)
ls .venv || (python3 -m venv .venv && .venv/bin/pip install -q kokoro-onnx soundfile numpy scipy pillow)
npm ci   # node_modules is gitignored
.venv/bin/python scripts/make_voices.py epNN
.venv/bin/python scripts/build_timeline.py epNN     # prints every line's frames; writes timeline/captions/mouth
python3 -c "import json;t=json.load(open('src/episodes/epNN/timeline.json'));[print(L['id'],' '.join(f\"{w['text']}@{w['frame']}\" for s in L['sentences'] for w in s['words'])) for L in t['lines']]"
```
Check the printed duration is 62–75 s; adjust `pre`/`post`/speeds and rerun if not.

### Real voices (preferred since 2026-11-25)
The owner records the lines instead of Kokoro. Run `python3 scripts/line_sheet.py epNN`, send him
`recording/epNN_line_sheet.md`, and when each memo arrives run
`.venv/bin/python scripts/import_recording.py epNN <speaker> <memo path>` (uploads land under
`/root/.claude/uploads/...`). Then build_timeline → make_audio → render. Keep Kokoro only for drafts.

## 3. Shots (`src/episodes/epNN/shots.tsx`) + composition
- Copy `src/episodes/ep01/shots.tsx` and `Ep01.tsx` → `epNN/`. In `EpNN.tsx` change imports and `episodeNumber`.
- Register `<Composition id="EpNN" …>` in `src/Root.tsx` next to Ep01 (duration from its timeline.json).
- Frames are GLOBAL. Use the word frames printed above: cut 0–3 frames BEFORE the word a visual reacts to.
- Cut every 1.5–3 s (45–90 frames). Mostly medium close-ups / close-ups via `fr(head, width, {yaw, elev})`
  (width ≥ 1.1 for Gus CUs, ≥ 1.15 for Tre, so hair isn't cropped and captions sit on the chest).
- Every shot pushes in (default 3 %); add `shake` on punchlines, `fx: flash` on hard cuts.
- Available: sets `Hallway Classroom Cafeteria Bedroom Bathroom Field` (+ `setMode: "bleachers"`);
  poses in `src/characters/types.ts`; expressions neutral/annoyed/shocked/smug/sad/hyped/eyeTwitch;
  hand props phone(screens lock/post/dm/feed/glow)/football/sandwich/books; extras FRESHMAN, LUNCH_LADY, COACH,
  PUNTER, KID, KID2; `insertPhone()` for phone close-ups; `spill()` for dropped books.
- Sound cues: copy `src/episodes/ep01/sfx.json`, retime every cue to the new frames, set `musicOff` ranges for
  silent beats and the cliffhanger.

## 4. Look check BEFORE any long render
```bash
node scripts/stills.mjs $(python3 scripts/shot_frames.py epNN) --scale=0.5     # ~2 s per still
.venv/bin/python scripts/contact_sheet.py tmp/shots_sheet.jpg $(ls tmp/shots/*.jpg | sort -t_ -k2 -n)
```
Open the sheet with Read. Fix: cropped heads, captions over eyes, characters out of frame, blank/black 3D,
skin tone shifts (coloured lights on Tre wash his skin out — keep fills dim). Repeat until clean.

## 5. Audio, render, QA, deliver
```bash
.venv/bin/python scripts/make_audio.py epNN
nohup scripts/render.sh epNN draft > logs/draft.log 2>&1 &     # half scale, check contact sheet
nohup scripts/render.sh epNN final > logs/render.log 2>&1 &    # poll: tail logs/render.log
.venv/bin/python scripts/qa.py out/epNN/final/epNN_final.mp4 epNN --sync-sheet review/epNN_sync.jpg
.venv/bin/python scripts/qa.py out/epNN/final/epNN_no_music.mp4 epNN
.venv/bin/python scripts/contact_sheet.py review/epNN_contact_sheet.jpg --video out/epNN/final/epNN_final.mp4 --every 1.5
```
All checks must pass and the contact sheet + sync sheet must be reviewed by eye. Then copy both MP4s to
`renders/epNN/`, write `renders/epNN/NOTES.md` (post caption, 5 hashtags, run time, voices), update
`road-to-d1/CLAUDE.md` "What we learned", commit and push to the session branch.

## Adding a new set
1. Add a component to `src/sets/Sets.tsx` using `B` (box), `Cyl`, `TileFloor`, `Poster`, `WallClock`, `SkyDome`
   from `src/sets/parts.tsx`. Keep the convention: characters near the origin on y = 0 facing +z, back wall at
   z ≈ -1.6 .. -2, camera on +z. No randomness except `remotion`'s seeded `random()`.
2. Add it to `SETS` and to the `SetName` type in `src/episodes/types.ts`; add a light preset in `src/lib/Stage.tsx`
   if needed; add it to `src/dev/SetPreview.tsx` and render `Set-<Name>` to check it.

## Adding an extra
Add a `CharSpec` in `src/characters/extras.ts` (spread an existing one, change colours/hair/accessories).
Render the `Turnaround` composition and look at it. Never edit `GUS` / `TRE` in `cast.ts`.
