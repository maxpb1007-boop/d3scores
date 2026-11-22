# Blockers

## git push → HTTP 403 (unresolved, outside the repo)
Every push to `claude/road-to-d1-ep01-aoxozi` failed with:
"Claude doesn't have GitHub access to maxpb1007-boop/d3scores for your organization."
Tried: plain `git push -u`, `push.negotiate=true`, re-attaching the repo with push access (`add_repo`), and
pushes at five milestones over the session. The GitHub API connector can READ the repo (it lists `main`)
but has no write access, and it can't carry 25 MB MP4s anyway.

**Fix (owner, ~1 minute):** reconnect GitHub at https://claude.ai/connect-github and make sure the Claude
GitHub App is installed on `maxpb1007-boop/d3scores` with write access. Then in a session run
`git push -u origin claude/road-to-d1-ep01-aoxozi` from the repo root. All work is committed locally.
The two finished MP4s were also sent directly in the session chat so nothing waits on this.
