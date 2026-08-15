# mitn retrospective adaptation

Use [PLAYBOOK.md](PLAYBOOK.md) for the portable method. This file records only
the local wiring for `maphew/mitn`.

## Scope and privacy

The campaign scope is agent sessions whose working directory is this
coordination repository, the normal sibling `../trilium` checkout, or a Trilium
source worktree under `.worktrees/trilium/`. The repository is public. Never
track raw transcripts or per-session digests. Keep digests under ignored
`retro/digests/`, redact private paths, and quote no more than 25 words from one
transcript.

## Inventory and strip recipes

Create the ignored work area first:

```bash
mkdir -p retro/digests/work
mitn_root="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
trilium_root="$(git -C "$mitn_root/../trilium" rev-parse --show-toplevel)"
```

Claude Code stores one JSONL transcript per top-level session. Inventory the
mitn and normal Trilium checkout stores, then adapt the same slug rule for
linked worktrees:

```bash
for scope in mitn trilium; do
  if [ "$scope" = mitn ]; then project_root=$mitn_root; else project_root=$trilium_root; fi
  project_slug=$(printf '%s' "$project_root" | sed 's#/#-#g')
  store="$HOME/.claude/projects/$project_slug"
  for transcript in "$store"/*.jsonl; do
    [ -f "$transcript" ] || continue
    session_id=$(basename "$transcript" .jsonl)
    started=$(jq -r 'select(.timestamp != null) | .timestamp' "$transcript" 2>/dev/null | head -1)
    size_kb=$(( $(stat -c%s "$transcript") / 1024 ))
    printf '%s\tclaude-code\t%s\t%s\t%s\tpending\t\t\n' \
      "$scope" "$session_id" "${started:0:10}" "$size_kb"
  done
done >> retro/ledger.tsv
```

Strip a Claude transcript to user and assistant text, errors, compact tool
calls, model, usage, and timestamps:

```bash
jq -c '
  select(.type=="user" or .type=="assistant" or .type=="system") |
  if .type=="user" then
    {t:"u", ts:.timestamp,
     txt:(if (.message.content|type)=="string" then .message.content
          else ([.message.content[]? | select(.type=="text") | .text] | join("\n")) end | .[0:2500]),
     err:[.message.content | if type=="string" then empty else .[]? |
          select(.type=="tool_result" and (.is_error==true)) |
          ((.content|tostring)[0:300]) end]}
  elif .type=="assistant" then
    {t:"a", ts:.timestamp, m:.message.model, out:.message.usage.output_tokens,
     txt:([.message.content[]? | select(.type=="text") | .text] | join("\n") | .[0:1500]),
     tools:[.message.content[]? | select(.type=="tool_use") |
            (.name + ":" + ((.input|tostring)[0:120]))]}
  else {t:"s", ts:.timestamp, s:((.content // (.message|tostring) // "")[0:250])}
  end' "$transcript" > "retro/digests/work/$session_id.stripped.jsonl"
```

For Codex, inventory only interactive CLI sessions whose `session_meta` cwd is
in scope. Delegate and subagent rollouts remain evidence inside their parent:

```bash
find "$HOME/.codex/sessions" -name '*.jsonl' -print0 |
while IFS= read -r -d '' transcript; do
  head -1 "$transcript" | jq -r --arg path "$transcript" '
    select(.type=="session_meta") | .payload |
    select(.originator=="codex-tui" and .source=="cli") |
    select((.cwd|endswith("/mitn")) or (.cwd|endswith("/trilium")) or
           (.cwd|contains("/mitn/.worktrees/trilium/"))) |
    [$path, .id, .timestamp, .cwd] | @tsv'
done > retro/digests/work/codex-inventory.tsv
```

Strip a Codex rollout to messages, compact function calls, and error events:

```bash
jq -c '
  if .type=="response_item" and .payload.type=="message" then
    {t:"message", ts:.timestamp, role:.payload.role,
     text:([.payload.content[]? | .text // empty] | join("\n") | .[0:2500])}
  elif .type=="response_item" and .payload.type=="function_call" then
    {t:"tool", ts:.timestamp, name:.payload.name, args:(.payload.arguments[0:300])}
  elif .type=="event_msg" and
       (.payload.type=="task_complete" or .payload.type=="turn_aborted") then
    {t:.payload.type, ts:.timestamp, detail:(.payload|tostring|.[0:500])}
  else empty end' "$transcript" > "retro/digests/work/$session_id.stripped.jsonl"
```

Amp is server-resident. Cache only the inventory and exact exported threads in
the ignored work directory:

```bash
amp threads list --include-archived --limit 1000 --json \
  > retro/digests/work/amp-inventory.json
jq -r '.[] | select(.messageCount >= 8) | .id' \
  retro/digests/work/amp-inventory.json |
while IFS= read -r session_id; do
  amp threads export "$session_id" > "retro/digests/work/$session_id.json"
  working_dir=$(jq -r '.env.initial.workingDirectory // empty' \
    "retro/digests/work/$session_id.json")
  case "$working_dir" in
    "$mitn_root"|"$mitn_root"/*|"$trilium_root"|"$trilium_root"/*) ;;
    *) continue ;;
  esac
  jq '{id, agentMode,
       messages:[.messages[]? |
         {role, agentMode, model:.usage.model,
          text:((.content // "")|tostring|.[0:2500])}]}' \
    "retro/digests/work/$session_id.json" \
    > "retro/digests/work/$session_id.stripped.json"
done
```

## Durable state

Use `retro/ledger.tsv`, `retro/findings.md`, and `retro/batches/*.md` for
redacted campaign state. Each promotion or follow-up is a Beads issue. Use
`bd remember` when a finding changes how future agents should work.

## Close protocol

Run the session-close protocol in `AGENTS.md`: update Beads, record durable
memory, validate, commit intentionally, push the Dolt state, push Git, and
confirm that reports and dependency edges are discoverable from open work.

## Round entry point

> Run one retrospective round per `retro/PLAYBOOK.md` and `retro/LOCAL.md`.
> Claim the open retro bead, take the next five pending ledger rows, strip and
> digest them on the cheapest adequate tier, synthesize findings in-session,
> promote actionable findings to Beads, update the public-safe state files,
> and close per `AGENTS.md`.
