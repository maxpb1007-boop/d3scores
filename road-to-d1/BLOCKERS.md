# Blockers

None open.

## Resolved 2026-11-23: git push → HTTP 403
The Claude GitHub App had read but not write access to `maxpb1007-boop/d3scores`, so every push failed with
"Claude doesn't have GitHub access…". The owner reconnected GitHub with write access and the branch
`claude/road-to-d1-ep01-aoxozi` pushed on the first try. If this recurs: reconnect at
https://claude.ai/connect-github and make sure the Claude GitHub App has write access to the repo.
