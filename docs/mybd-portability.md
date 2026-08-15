# Portability audit from mybd to mitn

This audit records the bootstrap selection made on 2026-08-15 from
[`maphew/mybd`](https://github.com/maphew/mybd) at commit
`89c838244f9a9f5d5504cfa8b5529fbad05ff4bb`. The goal was to preserve the
general coordination method without importing Beads project history,
maintainer authority, generated state, or private session material.

## Imported unchanged

| Source | Destination | Why it is portable |
|---|---|---|
| `scripts/agent-sig.sh` | same path | Reads live agent metadata and emits the shared signing convention |
| `scripts/gh-body-lint` and smoke test | same paths | Prevents malformed public GitHub bodies and keeps long analysis local |
| `retro/PLAYBOOK.md` | same path | Declares and implements a project-neutral retrospective method |
| `.agents/skills/beads/` | same path | Compact, project-neutral Beads task and memory workflow |
| `.agents/skills/quota-watch/` | same path | Project-neutral Amp quota guard used only when explicitly triggered |

The copied `gh-body-lint` header was then reduced to remove a stale mybd bead
reference. The retrospective playbook's Amp discovery note was updated for the
current server-resident thread store. Other imported behavior remains intact.

## Imported and adapted

| mybd pattern | mitn form | Adaptation |
|---|---|---|
| Coordination repository separate from source | `mitn` plus sibling `../trilium` | Keeps Trilium code and builds out of the coordination repo without duplicating the existing source checkout |
| `AGENTS.md` and short `CLAUDE.md` bridge | same files | Replaced Beads upstream, paths, issue prefix, and maintainer history with Trilium contributor policy |
| Codex lifecycle hooks | `.codex/hooks.json` | Retained supported `bd codex-hook` events and omitted mybd's extra session-stamp script |
| Scout, builder, and reviewer tiers | `.codex/agents/*.toml` | Kept role boundaries and isolation; removed `bd-main`, Beads source, and mybd assumptions |
| Worktree isolation | `.worktrees/trilium/` and `.worktrees/mitn/` | Source worktrees come from the existing sibling Trilium fork and always use absolute destinations |
| Cold-start handoff | `AGENTS.md` | Kept durable memories, reachable deliverables, and real dependency edges without importing the large mybd backstop script |
| Retrospective local state | `retro/LOCAL.md` plus empty register | Kept the public-repo privacy boundary and started fresh state |
| Beads storage | fresh `bd init --prefix mitn` | Never copied mybd's database, IDs, hooks, prefix, config, or Dolt history |
| General ignore rules | `.gitignore` | Retained worktree, environment, cache, transcript-digest, and Beads runtime exclusions |

## Identified as reusable but not imported now

| Portion | Decision |
|---|---|
| `.claude/agents/{scout,builder,reviewer}.md` | The roles are portable, but the canonical user-level profiles already provide them. A second project copy would create drift. |
| `.githooks/` root-worktree guard | The isolation rule is retained in `AGENTS.md`. Fresh `bd init` installed current Beads hook wrappers, while mybd's composed pre-commit guard contains incident IDs and `MYBD_*` switches. |
| `scripts/session-close-check` and source-command skill | The three cold-start checks are portable and were imported as policy. The script implementation is tightly coupled to mybd report and Beads history conventions. |
| `scripts/codex-agent` | The tiering idea is retained. This environment has native project agent profiles and subagent support, so another runtime wrapper is not needed yet. |
| `scripts/pr-open` and `scripts/pr-review-gate` | Cross-model review and duplicate-work preflight are retained as policy. The implementations hard-code `gastownhall/beads`, `bd-main`, and mybd review-log paths. |
| `docs/setup-beads-sync.md` | Its general sync goal applies, but it scaffolds separate private `beads-planning-*` repos. mitn intentionally syncs its Beads data through this public coordination repository. |
| `.devcontainer/` | The mybd image is tuned for Beads and Go. A Trilium environment should be derived from Trilium's current toolchain when needed. |

These are capability candidates, not a parallel task list. If actual use shows
that one is needed, create a Beads issue with a concrete acceptance criterion
before porting it.

### Same-origin Beads sync note

mitn publishes Beads history under `refs/dolt/data` on its GitHub origin. With
bd 1.2.1, tracking that GitHub URL as `sync.remote` prevents a fresh
`bd bootstrap`: the safety guard treats the explicit value as a code-repository
URL before probing Git origin. Therefore the tracked config intentionally omits
`sync.remote`. The initial machine has an explicit local Dolt remote, while a
fresh clone runs `scripts/bootstrap-beads`. The wrapper discovers the ref and
then restores the clean tracked config after bd adds the same-origin URL. This
keeps Git clean without losing the local Dolt remote.

## Intentionally omitted

The following are project-specific history or unsafe bootstrap material:

- all reports, proposals, archived maintainer policy, PR sweeps, and historical
  Trilium-unrelated issue references
- `mybd` retrospective ledgers, findings, batches, and transcript-derived state
- live or generated `.beads` and Dolt databases, locks, credentials, caches,
  `.bare`, `bd-main`, and other source-object state
- Beads maintainer automation, queue processors, release tooling, Dolt repair
  scripts, and systemd units
- the Beads-source Copilot instructions, Kilo runtime state, and dependency
  configuration for ecosystems not present in this coordination repo

## License source

mybd had no root license to reuse. `mitn/LICENSE` is copied from canonical
[TriliumNext/Trilium](https://github.com/TriliumNext/Trilium/blob/main/LICENSE)
at local upstream commit `372a749ff2025fdd9b76de5e297cd0af964f8ca3`.
Trilium's root `package.json` declares `AGPL-3.0-only`, while its README says
GNU AGPL version 3 or any later version. To make "same license" deterministic,
mitn follows the machine-readable root SPDX declaration and states
`AGPL-3.0-only` in its README. The full license text is the same under either
signal. No Trilium application source was imported.
