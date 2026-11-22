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
