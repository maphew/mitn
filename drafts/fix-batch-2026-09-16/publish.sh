#!/usr/bin/env bash
# Publish one reviewed fix branch: push to the fork, open the upstream PR, create a tracking bead.
# Usage: publish.sh <key> "<pr title>"
set -euo pipefail
key="$1"; title="$2"
mitn="$(cd "$(dirname "$0")/../.." && pwd)"
wt="$mitn/.worktrees/trilium/fix-$key"
body="$mitn/drafts/fix-batch-2026-09-16/pr-$key.md"
branch="$(git -C "$wt" rev-parse --abbrev-ref HEAD)"

[ -z "$(git -C "$wt" status --porcelain)" ] || { echo "dirty worktree: $wt" >&2; exit 1; }
"$mitn/scripts/gh-body-lint" "$body"
git -C "$wt" push -u origin "$branch" 2>&1 | tail -1
url="$(gh pr create --repo TriliumNext/Trilium --base main --head "maphew:$branch" --title "$title" --body-file "$body" | tail -1)"
echo "$key $url" | tee -a "$mitn/drafts/fix-batch-2026-09-16/opened-prs.txt"
num="${url##*/}"
cd "$mitn"
bd create --title="Track Trilium PR $num through resolution" --type=task --priority=2 --parent=mitn-wjd \
  --description="$title. PR $url. Branch $branch on maphew/Trilium, worktree .worktrees/trilium/fix-$key (remove with git worktree remove after merge or close). Opened 2026-09-16 in the last-window batch; respond to Greptile and maintainer review, keep rebased and green, close the bead when merged or closed." 2>&1 | grep -o 'mitn-[a-z0-9.]*' | head -1
