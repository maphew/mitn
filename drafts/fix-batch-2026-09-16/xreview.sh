#!/usr/bin/env bash
# xreview.sh <key> : cross-vendor review of a fix branch with opencode (non-Claude model); output to xreview-<key>.txt
key="$1"; model="${2:-opencode/nemotron-3-ultra-free}"
here="$(cd "$(dirname "$0")" && pwd)"
wt="$here/../../.worktrees/trilium/fix-$key"
cd "$wt" || exit 1
{ echo "model: $model"; echo "head: $(git rev-parse --short HEAD)"; 
timeout 600 opencode run -m "$model" "You are a strict code reviewer. Review this unified diff, a bug fix for the TriliumNext/Trilium repo checked out in the current directory. You can read surrounding source files but must not modify anything. Report only concrete correctness bugs, regressions for other callers, or missing test coverage, each with file:line and a one-sentence reason. If there are none, say 'No findings'. Be brief.

$(git diff upstream/main...HEAD)" </dev/null 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep -v '^→\|^✱\|^$' | tail -40; } > "$here/xreview-$key.txt"
echo "$key done: $(tail -3 "$here/xreview-$key.txt" | tr '\n' ' ' | cut -c1-200)"
