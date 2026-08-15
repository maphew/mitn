# Agent Instructions

This is `maphew/mitn`, a public personal coordination repository for work on
[Trilium Notes](https://github.com/TriliumNext/Trilium). It is not the Trilium
source tree and is not an official TriliumNext project.

Run `bd prime` at session start. Beads is the durable source of truth for task
state and project memory.

## Repository boundaries

| Path | Repository | Purpose |
|---|---|---|
| this repository | `maphew/mitn` | tasks, memory, reports, agent config |
| `../trilium` | fork `maphew/Trilium` | normal Trilium source checkout |
| `../trilium` upstream | `TriliumNext/Trilium` | canonical project |
| `.worktrees/trilium/*` | linked worktrees of `../trilium` | isolated source changes and reviews |
| `.worktrees/mitn/*` | linked worktrees of this repo | isolated coordination changes |

Do not add Trilium source files to this repository. Do not add `mitn` as a
remote in the source repository.

Resolve stable roots before commands that cross the repository boundary. This
works from the main mitn checkout, a mitn subdirectory, or a linked mitn
worktree:

```bash
mitn_root="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
trilium_root="$(git -C "$mitn_root/../trilium" rev-parse --show-toplevel)"
```

## Beads task and memory workflow

Use `bd` for all durable work tracking. Do not use Markdown TODO lists or
`MEMORY.md` files as a second tracker.

```bash
bd ready
bd show <id>
bd update <id> --claim
bd create --title="Short title" --description="Why and what" --type=task --priority=2
bd dep add <issue> <depends-on>
bd remember --key <stable-key> "Durable fact and why it matters"
bd close <id> --reason="Completed and verified"
```

Use `--json` when parsing output. Do not use `bd edit`, which opens an
interactive editor. Run Beads and Dolt commands serially.

Cold-start handoff must remain visible to an agent that reads only `bd prime`
and `bd ready`:

1. Put workflow-changing knowledge in `bd remember`.
2. Keep every unlanded branch or report reachable from an open bead or memory.
3. Encode ordering with `bd dep add`, not only prose such as "after X".

## Git worktrees

Assume other agents or sessions may share both repositories. Use linked
worktrees for parallel or committing work and never switch branches in a
shared main checkout.

Pass absolute destinations to `git worktree add`:

```bash
git -C "$trilium_root" worktree add "$mitn_root/.worktrees/trilium/<purpose>" -b <branch> upstream/main
git -C "$mitn_root" worktree add "$mitn_root/.worktrees/mitn/<purpose>" -b <branch>
```

A worktree path returned by `git worktree list` must be removed with
`git worktree remove`. Never delete it recursively. Worktrees share the stash
stack, so name any unavoidable stash and apply it by exact reference.

## Contributing to Trilium

We are contributors, not maintainers. We open issues and pull requests
upstream, but do not merge, close, label, or triage other contributors' work
without explicit authority.

Before starting an upstream change, check both remote and local duplicate work:

```bash
gh pr list --repo TriliumNext/Trilium --search "<issue or keywords>"
git -C "$trilium_root" log --all --oneline --since=3.days -- <path>
```

Create branches from the actual upstream base. Push topic branches to the fork
and target `TriliumNext/Trilium` in pull requests. Run a second model family
over the exact diff before `gh pr create`, then reconcile whether each finding
is a regression or pre-existing behavior.

Write GitHub bodies to a file, lint with
`"$mitn_root/scripts/gh-body-lint" <body-file>`, and pass them with
`--body-file`. Answer why the change is needed. Preserve contributor credit
and `Co-Authored-By` trailers.

## Delegation

Tier work deliberately:

- scout: low-cost, read-only inventories, searches, and evidence gathering
- builder: bounded implementation with exact ownership and acceptance criteria
- reviewer: high-judgment, read-only correctness and design review

Keep design decisions and ambiguous debugging in the orchestrator. Give
workers disjoint file ownership, remind them they are not alone, and require
actual validation output. A worker that will commit must use a dedicated
worktree.

Project Codex role profiles live under `.codex/agents/`. The current prompt or
runtime policy always overrides those defaults.

## Signing

Sign GitHub comments as:

```text
_{agent_runtime}-{model}-{reasoning} on behalf of {user}_
```

Sign commits with:

```text
Agent-Signature: {agent_runtime}-{model}-{reasoning} on behalf of {user}
```

Generate the exact form with `scripts/agent-sig.sh`, adding `--trailer` for a
commit. Run it from Bash. Never guess the model or reasoning level; leave the
script's `unknown-*` placeholders when live metadata is unavailable.

## Public-repository hygiene

This repository is public. Never commit tokens, credentials, private session
transcripts, unredacted transcript digests, personal environment dumps, or
generated Beads/Dolt database state. Retrospective digests stay ignored.
Redact private paths and limit any quoted transcript excerpt to 25 words.

## Validation and session close

Run checks proportionate to the change and report actual output. Before ending
a substantive session:

1. Close completed beads and create beads for remaining work.
2. Record workflow-changing knowledge with `bd remember`.
3. Run relevant tests and repository-specific linting. In embedded mode, run
   the supported checks separately: `bd doctor --check=artifacts`,
   `bd doctor --check=conventions`, and `bd doctor --check=pollution`.
4. Inspect `git status` and the exact diff, then commit intentionally.
5. Run `bd dolt push`, push Git, and verify both are synchronized.
6. Confirm no deliverable or dependency is visible only in prose.
