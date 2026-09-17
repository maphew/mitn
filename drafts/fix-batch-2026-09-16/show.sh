#!/usr/bin/env bash
# show.sh <task-id> : compact view of a finished pipeline
f="${TASKS_DIR:?set TASKS_DIR to the session tasks directory}/$1.output"
jq -r '.result | if type=="string" then fromjson else . end | "KEY \(.key) STATUS \(.status)\nTITLE: \(.final.prTitle)\nREVIEW: \(.claudeReview.verdict) \([.claudeReview.findings[]? | .severity] | join(","))\nRISK: \(.final.residualRisk)\nFINDINGS: \(.final.findingsDisposition)"' "$f" | cut -c1-1800
key=$(jq -r '.result | if type=="string" then fromjson else . end | .key' "$f")
wt="$(cd "$(dirname "$0")/../.." && pwd)/.worktrees/trilium/fix-$key"
git -C $wt log --oneline upstream/main..HEAD; git -C $wt status --porcelain | head -3
git -C $wt diff upstream/main...HEAD -- . ':(exclude)*.spec.ts' ':(exclude)*.spec.tsx'
