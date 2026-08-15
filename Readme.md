# mitn - personal coordination repo for Trilium Notes work

`mitn` ("mitten", "my TN") holds issue tracking, notes, reports, and agent
configuration for [maphew's](https://github.com/maphew) work on
[Trilium Notes](https://github.com/TriliumNext/Trilium). It is not the
Trilium source tree and is not an official TriliumNext project.

## Layout

| Path | Purpose |
|---|---|
| `.beads/` | Dolt-backed Beads task and memory store |
| `.worktrees/trilium/` | ignored Trilium source worktrees |
| `.worktrees/mitn/` | ignored coordination-repo worktrees |
| `docs/` | durable decisions and workflow notes |
| `retro/` | portable agent-session retrospective method and local adaptation |
| `scripts/` | small, project-neutral collaboration helpers |

The normal Trilium source checkout is the sibling repository `../trilium`,
with `origin` pointing to `maphew/Trilium` and `upstream` pointing to
`TriliumNext/Trilium`. Source code changes, builds, and upstream pull requests
belong there or in one of its linked worktrees, never in this coordination
repository.

## Working here

```bash
bd bootstrap --yes        # first run after cloning; restores Dolt state
bd prime
bd ready
bd list --status=in_progress
```

All durable tasks, blockers, dependencies, and cross-session knowledge use
Beads. Use `bd remember` for project memory. Do not create Markdown task lists
or `MEMORY.md` files as parallel sources of truth.

Create source worktrees with an absolute destination path:

```bash
mitn_root="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
trilium_root="$(git -C "$mitn_root/../trilium" rev-parse --show-toplevel)"
git -C "$trilium_root" worktree add "$mitn_root/.worktrees/trilium/<purpose>" -b <branch> upstream/main
```

See [AGENTS.md](AGENTS.md) for the complete workflow and
[docs/mybd-portability.md](docs/mybd-portability.md) for what was imported
from `maphew/mybd` and what was intentionally left behind.

## License

This coordination repository is licensed under the GNU Affero General Public
License, version 3 only (`AGPL-3.0-only`), matching Trilium's machine-readable
root package metadata. See [LICENSE](LICENSE). Trilium's README separately says
"version 3 or later"; this repository follows the root SPDX declaration to
resolve that upstream inconsistency. Trilium Notes retains its own copyright
and contributor history.
