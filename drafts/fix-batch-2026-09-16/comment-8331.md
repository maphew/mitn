Observed: this looks like the same defect as issue 5740 (closed as outdated on 2026-01-08, but the code path was unchanged in 0.101.3).

Cause, from reading the code: in 0.101.3 `SplitNoteContainer.noteContextRemovedEvent` filtered `children` on `c.ntxId`, but the split widgets carry no `ntxId`, so a closed tab left its whole widget subtree in the component tree with detached DOM. "Reopen last closed tab" reuses the same note context (same ntxId) and builds a second subtree. `executeWithTextEditor` / `executeWithContentElement` are matched by ntxId only, so the stale editable-text widget answered first and the table of contents, highlights list and in-note search acted on a detached editor. A frontend reload removed the stale subtree, which matches the report.

This appears fixed by commit 43017a0ebe ("fix(splits): detach a closed split from the widget tree") together with 5db8eb84c4 (unmount the Preact tree on cleanup), both included in v0.105.0. `split_note_container.spec.tsx` covers both.

Uncertainty: this is from code reading only, not a runtime test. Advise retesting on v0.105.0 or later; if the symptom no longer reproduces, the issue can be closed.
