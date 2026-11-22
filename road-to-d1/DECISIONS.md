# Decisions log — Road to D1

Each entry: what was ambiguous, what was chosen, why.

1. **Pipeline lives in `road-to-d1/`, not the repo root.** The repo root is the live d3scores
   website. Its `CLAUDE.md` warns that adding a root `package.json` changes how Vercel treats
   `api/*.js` (CommonJS → ESM) and would crash the scores API. A subfolder keeps both projects
   working. `.vercelignore` excludes the folder from site deploys so MP4s never ship with the site.
2. **The skill goes in the repo-root `.claude/skills/new-episode/`** (that's where Claude Code
   discovers skills). Root `.gitignore` changed from `.claude/` to `.claude/*` + `!.claude/skills/`
   so the skill is committed but machine-local config still isn't.
3. **Hugging Face is blocked** (`curl -sI https://huggingface.co` → proxy 403), so whisper.cpp
   models can't be downloaded. Used the specified fallback: per-sentence TTS, exact sentence
   boundaries from WAV lengths, syllable-weighted word timing within each sentence.
   `@remotion/install-whisper-cpp` is still installed so a future session with HF access can switch.
4. **Reference repo `mromidev/claude-animated-shorts` is MIT.** Studied only for pipeline ideas
   (stills before renders, contact sheets, frame-level QA). No code or art style copied.
5. **Versions pinned:** remotion 4.0.545, three 0.187.0, @react-three/fiber 9.8.2, react 19.3.1,
   TypeScript 5.9.3 (not 7.x — the new native compiler is too new to trust with Remotion types).
6. **Voices (picked without ears, by measurement).** Kokoro's own quality grades rank `am_michael`,
   `am_fenrir` and `am_puck` as the best American male voices (the rest are graded D or lower).
   Pitch analysis of the same test line: michael 120 Hz / 3.0 semitone spread (flattest of the
   three → **Gus**, deadpan); fenrir 139 Hz / 4.65 st (most animated, and higher than michael so
   the two are easy to tell apart → **Tre**); puck 112 Hz / 4.1 st was too close to michael's pitch.
   Gus speed 1.12, Tre 1.14, Tre yelling 1.22, Tre "WHO'S Coach Briggs" 0.86 (slow), Tre whisper
   1.0 + high-pass + breath noise at 0.7 gain. Samples of all 9 voices are in `voice_samples/`.
7. **Episode runs 74.4 s** (target 62–75). Kept the long beats after "Nobody claps" (1.4 s for the
   cricket) and "If I mess up once…" (1.1 s for the imagination cut) because the jokes need them.
8. **Chrome download host (remotion.media) is blocked.** Remotion uses the VM's preinstalled
   Playwright headless shell via `Config.setBrowserExecutable` in remotion.config.ts.
9. **Captions are stored with script casing and uppercased by CSS**, so the caption data diffs
   exactly against the script while the screen shows bold all-caps.
10. **No helmets or pads at practice.** Faces are the whole show; helmets would hide them. Practice-field
    scenes use the punter extra in a plain practice top.
11. **Bedroom: Tre sits up in bed** (instead of lying down) so his face stays readable under the phone glow.
    The phone fill light is kept dim — a brighter one washed out his skin tone, which is a design violation.
12. **Montage spots:** bed → bathroom mirror → lunch line (the three spots in the script), 15–18 frames each,
    with a 3-frame white flash + click on each cut.
13. **Caption paging:** a page never crosses a sentence; it breaks at punctuation, then each segment is split
    evenly into ≤4-word pages (≤3 when the words are long) so there are no orphan single words. Every page
    gets exactly one yellow word: the line's listed highlight if present, else its longest non-filler word.
14. **Final encode:** Remotion renders JPEG frames, which come out full-range `yuvj420p`. Chunks render at
    CRF 14, then one ffmpeg pass converts to TV-range `yuv420p` at CRF 20 (QA requires yuv420p).
15. **Loudnorm runs in dynamic mode** (the synthesized SFX peaks are too hot for linear mode). The result
    measures −14.2 LUFS and −1.4 dBTP after AAC.
16. **Fictional on-screen text only:** "coach_gradasst", "Coach Briggs", a generic "T" letter patch,
    "GO TEAM!", "SPIRIT WEEK". No real schools, apps or logos.
