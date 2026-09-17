# Shepherding open upstream pull requests

Written 2026-09-17, when the Claude subscription ended with 16 pull requests
open on TriliumNext/Trilium. This page tells a person, or an agent on a
different runtime, how to take those pull requests to merge or closure. It
needs only `gh`, `jq`, `git`, and `bd`.

## TLDR

```bash
scripts/pr-status        # 1 screen: which PRs need attention, which are done
```

- `ok` lines need no action.
- `ATTN` lines have a failed check, a conflict, or a comment newer than our
  last action. Use the recipes below.
- The last section lists merged or closed PRs. Do the cleanup recipe for each.

Look 1 time each day while the maintainer is active. Elian merges in bursts,
frequently in the European morning and afternoon.

## Recipes

Resolve the roots first (see AGENTS.md):

```bash
mitn_root="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
trilium_root="$(git -C "$mitn_root/../trilium" rev-parse --show-toplevel)"
```

### Failed check "Standalone E2E tests on linux-arm64"

If the failed test is `duplicate.spec.ts` "Can duplicate note with broken
links", the cause is a defect in the test, not in our change. PR 11556
corrects it (bead `mitn-d22`). Until 11556 merges, do nothing: the maintainer
sees the same failure on `main`. After 11556 merges, get a new run for each PR
that is still red:

```bash
cd "$mitn_root/.worktrees/trilium/<worktree>"
git fetch upstream && git merge --no-edit upstream/main && git push
```

Use a merge, not a rebase. The maintainer merges `main` into PR branches
himself (for example 91d0b3a3b7 on PR 11440), and a merge needs no force-push.

For a different failed test, read the log before you change code:

```bash
gh run view <run-id> --repo TriliumNext/Trilium --log-failed > /tmp/run.log
grep -nE "^\s+[0-9]+\) \[|Error:" /tmp/run.log | head
```

Then look at `gh run list --repo TriliumNext/Trilium --workflow playwright.yml`.
If the same test fails on `main` or on branches of other people, it is not ours.

### Conflict (`CONFLICTING`)

On 2026-09-17 all 16 branches merged together onto `upstream/main` with no
conflict, `pnpm typecheck` was clean, and 23 of the 26 touched spec files
passed (3 were not run; see `reports/2026-09-17-daily.md`). A conflict
after that date comes from new upstream work. Merge `upstream/main` in the
worktree, resolve, run the spec files that the PR touches with
`pnpm --filter <pkg> test <pattern>`, then push.

### Greptile finding

Greptile reviews each push. Its summary comment is not a finding; its review
with inline comments is. For each inline comment decide:

1. Correct and in scope: fix, add or adjust the test, push. Reply on the thread
   with the commit hash.
2. Correct but older than the PR: reply with the evidence (the same code on
   `main`). Do not widen the PR.
3. Wrong: reply with the reason in 1 to 3 sentences.

A Greptile reply that accepts our answer ("That's fair", "That context
addresses") still shows as `ATTN`. It needs no action. On 2026-09-17 this is
the state of 11536 and 11550.

Style findings come from the upstream `CLAUDE.md`: comments of 1 or 2 lines,
no comment about an absent thing, no voice for code, lines of 100 characters
or less.

### Maintainer comment or change request

Answer it on the same day if possible. Keep the answer short and literal:
observed, cause, smallest fix, how verified, what is not known (memory
`upstream-comms-style`). If Elian prefers a different design, do it his way
or close the PR. Do not argue for ours.

### Merged or closed: cleanup

```bash
git -C "$trilium_root" worktree remove "$mitn_root/.worktrees/trilium/<worktree>"
git -C "$trilium_root" branch -d <branch>
bd close <bead> --reason="PR <n> merged by <login> <date>"
bd dolt push
```

Never delete a worktree directory by hand.

## Pull requests, branches, worktrees, beads (2026-09-17)

| PR | Branch on maphew/Trilium | Worktree | Bead |
|---|---|---|---|
| 11285 | `fix/start-hidden-maximized-10808` | none | mitn-8fz |
| 11311 | `fix/quick-search-slash-11204` | none | mitn-0ax |
| 11536 | `fix/6853-attr-def-alias-comma` | `.worktrees/trilium/fix-6853` | mitn-wjd.2 |
| 11537 | `fix/8942-share-alias-links` | `.worktrees/trilium/fix-8942` | mitn-wjd.3 |
| 11538 | `fix/11458-bookmark-new-tab-position` | `.worktrees/trilium/fix-11458` | mitn-wjd.4 |
| 11539 | `fix/8448-share-external-link` | `.worktrees/trilium/fix-8448` | mitn-wjd.5 |
| 11540 | `fix/10705-popup-glitches` | `.worktrees/trilium/fix-10705` | mitn-wjd.6 |
| 11545 | `fix/navguard-nav-url-guard` | `.worktrees/trilium/fix-navguard` | mitn-wjd.8 |
| 11547 | `fix/11447-promoted-relations-tab-order` | `.worktrees/trilium/fix-11447` | mitn-wjd.10 |
| 11548 | `fix/11322-mermaid-error` | `.worktrees/trilium/fix-11322` | mitn-wjd.11 |
| 11549 | `fix/11472-note-menu-overflow` | `.worktrees/trilium/fix-11472` | mitn-wjd.12 |
| 11550 | `fix/8169-validate-forced-note-id` | `.worktrees/trilium/fix-8169` | mitn-wjd.13 |
| 11551 | `fix/1qa-dropdown-disabled-while-open` | `.worktrees/trilium/fix-1qa` | mitn-wjd.14 |
| 11552 | `fix/7996-jump-to-fast-typing` | `.worktrees/trilium/fix-7996` | mitn-wjd.15 |
| 11553 | `fix/6474-table-view-tab-focus` | `.worktrees/trilium/fix-6474` | mitn-wjd.16 |
| 11556 | `test/e2e-standalone-duplicate-flake` | `.worktrees/trilium/e2e-duplicate-flake` | mitn-d22 |

The PR bodies are in `drafts/fix-batch-2026-09-16/pr-<key>.md` and
`drafts/e2e-flake-2026-09-17/`. Each body has a Scope section with the known
limits of the change. Read it before you answer a review question.

11285 and 11311 have no worktree. To work on one:

```bash
git -C "$trilium_root" fetch origin
git -C "$trilium_root" worktree add "$mitn_root/.worktrees/trilium/<purpose>" <branch>
```

## Agents without Claude

- `AGENTS.md` is runtime-neutral. opencode, Codex, and Amp read it.
- Free second-model review: memory `opencode-cross-vendor-review`. Put the diff
  in the prompt and run 1 review at a time.
- Codex: `gpt-5.6-terra` quota resets 2026-10-14 (memory `codex-sol-unavailable`).
- A small free model can run `scripts/pr-status` and the cleanup recipe
  safely. Give a code fix on a PR to a stronger model, or do it by hand: the
  changes are small and each has a focused spec.
- Signatures come from `scripts/agent-sig.sh`. Do not publish an `unknown-*`
  placeholder. For text that you write yourself, no agent signature is needed.
- Do not open more upstream PRs until this batch is resolved. 16 open PRs from
  1 contributor is already a large review load.
