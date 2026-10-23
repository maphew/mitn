# Agent Instructions

This is `maphew/mitn`, a public personal coordination repository for work on
[Trilium Notes](https://github.com/TriliumNext/Trilium). It is not the Trilium
source tree and is not an official TriliumNext project.

Run `bd prime` at session start. Beads is the durable source of truth for task
state and project memory.

## Contents

- [Repository boundaries](#repository-boundaries)
- [Language](#language)
- [Beads task and memory workflow](#beads-task-and-memory-workflow)
- [Git worktrees](#git-worktrees)
- [Contributing to Trilium](#contributing-to-trilium)
- [Delegation](#delegation)
- [Signing](#signing)
- [Public-repository hygiene](#public-repository-hygiene)
- [Validation and session close](#validation-and-session-close)

The swamp section after these sections is generated. It contains `Project`,
`Rules`, `Skills`, `Getting Started`, and `Commands`. Do not edit it by hand.

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

## Language

In general, use **ASD-STE100 Simplified Technical English** (**STE**). Consider
ELI18 and TLDR. Clarity over jargon, conciseness over length, python zen energy.

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

Beads synchronization is part of the workflow, not a user-requested follow-up.
Run `bd dolt push` after each thread milestone that changes task state or
memory, and again before ending a substantive session. Do not wait for the
user to ask. Report and resolve synchronization failures before handoff.

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

Write upstream reviews as a peer co-contributor, not as a gatekeeping
maintainer. Use subject-first advisory language such as "Advise keeping,
setting, or preserving ..." Avoid courtesy openings such as "Thanks for ...",
maintainer-like assignments such as "Please keep ...", and bare imperative
fixes. Prefer "Advise ..." over "I advise ..."; use "I" only when omission
would make the sentence ambiguous. Formal review states such as approval or
requesting changes remain valid when the evidence supports them.

Amp agents must authenticate GitHub CLI commands with `AMP_GH_TOKEN`; the
default `GH_TOKEN` can be an installation token that reads upstream but cannot
open pull requests there:

```bash
GH_TOKEN="$AMP_GH_TOKEN" gh <command>
```

Never print either token.

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
commit. Run it from Bash immediately before adding the signature; never type or
guess it. If the output contains an `unknown-*` placeholder, do not publish or
commit. Resolve the live metadata or stop and report the blocker.

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
3. Run relevant tests and repository-specific linting. `bd doctor` does not
   work in embedded mode (bd 1.2.2); run `bd lint`, `bd stale`, and
   `bd orphans`, and confirm `git status --porcelain .beads/` is empty.
4. Inspect `git status` and the exact diff, then commit intentionally.
5. Run `bd dolt push`, push Git, and verify both are synchronized.
6. Confirm no deliverable or dependency is visible only in prose.

<!-- BEGIN swamp managed section - DO NOT EDIT -->
# Project

This repository is managed with [swamp](https://github.com/swamp-club/swamp).

## Rules

1. **Search before you build.** When automating AWS, APIs, or any external service: (a) search community extensions with `swamp extension search <query>` — prefer `@swamp/*` official extensions first, (b) search local/installed types with `swamp behavior type search <query>`, (c) if a community extension exists, install it with `swamp extension pull <package>` instead of building from scratch, (d) extend an existing type if it covers the domain but lacks the method you need, (e) only create a custom extension behavior in `extensions/models/` as a last resort. Use the `swamp` skill for guidance. The `command/shell` behavior is ONLY for ad-hoc one-off shell commands, NEVER for wrapping CLI tools or building integrations.
2. **Extend, don't be clever.** When a behavior covers the domain but lacks the method you need, extend it with `export const extension` — don't bypass it with shell scripts, CLI tools, or multi-step hacks. One method, one purpose. Use `swamp behavior type describe <type> --json` to check available methods.
3. **Use the data model.** Once data exists in a behavior (via `lookup`, `start`, `sync`, etc.), reference it with CEL expressions. Don't re-fetch data that's already available.
4. **CEL expressions everywhere.** Wire behaviors together with CEL expressions. Always prefer `data.latest("<name>", "<dataName>").attributes.<field>` over the deprecated `model.<name>.resource.<spec>.<instance>.attributes.<field>` pattern.
5. **Verify before destructive operations.** Always `swamp behavior get <name> --json` and verify resource IDs before running delete/stop/destroy methods.
6. **Prefer fan-out methods over loops.** When operating on multiple targets, use a single method that handles all targets internally (factory pattern) rather than looping N separate `swamp behavior run` calls against the same behavior. Multiple parallel calls against the same behavior contend on the per-behavior lock, causing timeouts. A single fan-out method acquires the lock once and produces all outputs in one execution. Check `swamp behavior type describe` for methods that accept filters or produce multiple outputs.
7. **Extension npm deps are bundled; pin them.** Swamp's bundler inlines all npm packages (except zod) into extension bundles at bundle time. When the extension has a `deno.json`, the `deno.lock` beside it decides which versions are bundled; otherwise the registry's current release does. Always pin explicit versions in `npm:` and `jsr:` import specifiers (e.g., `npm:lodash-es@4.17.21`) — `swamp extension push` warns on unpinned and range specifiers.
8. **Reports for reusable data pipelines.** When the task involves building a repeatable pipeline to transform, aggregate, or analyze behavior output (security reports, cost analysis, compliance checks, summaries), create a report extension. Use the `swamp` skill for guidance.
9. **"Workflow" means a swamp workflow.** In this repository the word "workflow" (and "create/run/execute/validate/debug workflow", "automate", "orchestrate", "automated/nightly job") refers to a swamp workflow — a declarative YAML DAG of behavior-method steps authored via `swamp workflow create`. Load and follow the `swamp` skill for these requests. Do NOT interpret these as a request to build an agent task list, spin up worktrees, or schedule a cron/remote agent. Only use those orchestration mechanisms when the user explicitly names one (e.g. "task list", "subagent", "worktree", "cron", "remote agent") or explicitly asks you to do the work yourself step by step rather than author a swamp workflow.
10. **Use swamp, don't bypass it.** Always work through swamp commands — don't go around them with raw shell tools. Use `swamp data query` to find data, not `grep`/`find` on `.swamp/` files. Use behavior methods to interact with resources, not `curl`/`aws`/`gcloud`/`kubectl` when a behavior type already wraps that API — check with `swamp behavior type search`. Use `swamp help` for CLI discovery, not guesswork. Composing with swamp output is fine (e.g. piping `--json` through `jq`) — the anti-pattern is bypassing swamp entirely.
11. **Inspect reports after failures.** When a behavior method or workflow run fails, inspect its generated reports before retrying or changing definitions. Reports run even on failure and capture structured diagnostics — error messages, execution status, arguments, and data output pointers. Use `swamp report get @swamp/method-summary --model <model> --json` for method failures or `swamp report get @swamp/workflow-summary --workflow <workflow> --json` for workflow failures. Run `swamp help report get` to confirm current retrieval syntax.

## Skills

**IMPORTANT:** Always load swamp skills, even when in plan mode. The skills provide
essential context for working with this repository.

- `swamp` - Swamp CLI — behaviors, workflows, data, vaults, extensions, publishing, repos, reports, issues, and troubleshooting
- `swamp-getting-started` - Interactive onboarding for new swamp users

## Getting Started

If you were asked to read a task brief under `tasks/` (a file whose first
line is `<!-- swamp start brief v1 -->`), read that brief, then invoke the
`swamp-getting-started` skill and follow it from its brief entry point.

If the user is new to swamp or asks to get started, or a swamp command you
run shows this repository has no behaviors yet, invoke the
`swamp-getting-started` skill. It checks for existing behaviors itself and walks
new users through an interactive onboarding tutorial.

Otherwise, use the `swamp` skill to work with swamp behaviors.

## Commands

Use `swamp --help` to see available commands. For a machine-readable JSON
schema of the CLI (commands, options, arguments) intended for agent
consumption, run `swamp help [<command>...]` — e.g. `swamp help` returns
the full tree, and `swamp help behavior run` scopes to a subtree.

Behaviors (formerly models) are managed with `swamp behavior` — e.g.
`swamp behavior run <name> <method>` (or
`swamp behavior run @<type> <method> <name>` to run against a type
directly). Every `swamp model …` spelling remains supported.
<!-- END swamp managed section -->
