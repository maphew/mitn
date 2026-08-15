# Triage report: Trilium issue 10668 - image resize/whitespace after collapse

Bead: mitn-5kv.5. Status: completed (no-artifact branch). Checked 2026-08-15
against issue state updatedAt 2026-08-15T09:36:41Z. Produced by a sonnet
subagent in workflow wf_bea57cbe-8a8; persisted by the orchestrator because
the subagent harness blocks report-file writes.

## Finding

No exported note or ZIP is attached anywhere in the thread. The body contains
exactly two `github.com/user-attachments/assets` screenshot links
(before/after collapse); the three comments are plain prose (raw captures in
`issue-raw.txt` and `issue-full.json` alongside this report). Per the task's
no-artifact branch, no HTML/markup forensic comparison was attempted and no
speculative fix code was written.

**Key timing fact:** maintainer eliandoran asked the reporter for exactly this
ZIP export at 2026-08-15T09:36:41Z, 14 minutes before this check ran, and the
reporter (datawizard93) has not yet replied. Thread timeline:

- 2026-07-25 15:48Z - reporter opens issue
- 2026-08-13 19:02Z - eliandoran: unable to reproduce
- 2026-08-15 09:22Z - datawizard93: cannot reproduce on clean VM or default
  theme, only on personal instance; asks how to enable debug logging
- 2026-08-15 09:36Z - eliandoran: asks whether it reproduces only on a
  particular note and requests a ZIP export (current thread tip)

## Verification done before drafting

- Export dialog mechanics verified in source so instructions cite real UI
  strings: `apps/client/src/widgets/dialogs/export.tsx:21,34-58` (exportType
  subtree|single; singleFormats html/markdown at line 124);
  `apps/client/src/translations/en/translation.json:141,144-145,156,160`.
  Single-note HTML export is one HTML file with images embedded, NOT a zip;
  the subtree export is the ZIP Elian asked for. (An initial draft error
  referencing a nonexistent single-note zip option was caught and corrected.)
- Sanity-checked the described feature exists:
  `packages/ckeditor5/src/plugins/collapsible/collapsible_editing.ts:56-71`
  (trilium-collapsible details block); its data downcast (lines 208-294) is
  structural only and touches no image width/style attributes. Not proof of
  cause, only that the feature is real.
- Image resize internals are stock ckeditor5 npm plugins (Image, ImageResize,
  ImageStyle in `plugins.ts:1`), not Trilium-authored code, so no Trilium
  file:line exists for them.
- `comment-issue10668.md` lints clean (`gh-body-lint` exit 0), signed.
- All gh calls read-only; trilium checkout untouched.

## Remaining for human

1. Decide whether/when to post `comment-issue10668.md`: Elian's own ZIP ask is
   unanswered and 14 minutes older than this check. Posting immediately risks
   reading as a competing ask; the draft has been framed to reinforce his
   request with concrete steps (see reviewer-adjusted wording), but waiting a
   few days for the reporter to respond is a reasonable alternative.
2. Once an export appears in the thread, re-run the forensic branch: diff the
   affected note's HTML/tree structure against a fresh equivalent and find the
   distinguishing property. That work has not been started.
