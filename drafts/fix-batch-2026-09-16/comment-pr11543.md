I root-caused #7288 independently last night and had a branch ready when this PR appeared, so I am not opening a second PR. The analysis might help the review here.

Observed from the code and from the two log dumps in the issue: each ghost branch is the one moved just before a `GET /api/tree?subTreeNoteId=<target>`. The subtree load runs ahead of the websocket stream. `froca.addResp()` then deletes the old branch from `froca.branches` without a `LoadResults` entry. When the websocket deletion for that branch arrives, `processBranchChange()` in `froca_updater.ts` calls `loadResults.addBranch()` only inside `if (branch)`, so the deletion is dropped. `NoteTreeWidget` removes nodes by `branchId` from `getBranchRows()` and never sees the row, which leaves the ghost node and later logs "Not existing branch".

Smallest fix I found: move the `loadResults.addBranch()` call out of the `if (branch)` block, guarded by `ec.componentId && ec.entity`. The non-deleted path already registers rows for branches that froca does not know. This is 5 changed lines plus one regression test in `froca_updater.spec.ts` that fails before and passes after: https://github.com/maphew/Trilium/compare/main...fix/7288-ghost-note-after-multi-move

This PR contains the same `froca_updater.ts` idea plus more (the `waitForMaxKnownEntityChangeId()` calls, `LoadResults` identity fields, tree reconciliation). Advise checking whether the `froca_updater.ts` change alone clears the reproduction. If it does, the remaining about 450 lines might not be needed, and a smaller diff is easier to review. The `waitForMaxKnownEntityChangeId()` calls narrow the race but also put a websocket round trip between every move of a multi-note operation.

Uncertainty: I did not reproduce the defect in a running app. The conclusion comes from the code and the issue logs.

_claude-fable-5-1-high on behalf of matt wilkie_
