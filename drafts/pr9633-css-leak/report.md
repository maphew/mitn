# PR 9633 triage: CSS leak from note previews (bead mitn-5kv.9)

Slug: pr9633-css-leak. Date: 2026-08-15. Trilium checkout: $trilium_root at upstream/main 372a749ff2 (read-only, shared).

## Verdict

**restructured-needs-rework** (primary scenario fixed-by-b8b535c0f2; a narrower markdown-path gap remains; the PR as written is conflicting and its tests now pass on main without its code change).

No salvage worktree was created. Rationale at the end.

## What the PR does

PR 9633 "Fix embedded preview styles leaking into the note tree" by AllanZyne (Yang Zhao), created 2026-05-02, last updated 2026-07-13, state OPEN, `mergeable: CONFLICTING`, `mergeStateStatus: DIRTY`.

```
gh pr view 9633 --repo TriliumNext/Trilium --json state,mergeable,mergeStateStatus,createdAt,updatedAt
# "createdAt":"2026-05-02T18:36:01Z","updatedAt":"2026-07-13T16:25:52Z",
# "mergeable":"CONFLICTING","mergeStateStatus":"DIRTY","state":"OPEN"
```

Two files, +43:

- `apps/client/src/services/content_renderer_text.ts`: at the end of `postProcessRichContent`, adds
  ```ts
  if (options.trim) { $renderedContent.find("style").remove(); }
  ```
- `apps/client/src/services/content_renderer_text.spec.ts`: two regression tests, both with a **leading** `<style>li { margin-bottom: 8pt; }</style>` block:
  1. HTML text note rendered with `renderText(note, $el, { trim: true })`, expects no `<style>` in output.
  2. Code note with `mime = "text/x-markdown"` rendered via `contentRenderer.getRenderedContent(note, { trim: true })`, same expectation.

Root cause per the PR thread: imported notes can contain embedded `<style>` tags; when a preview (note tree / grid view, `trim: true`) injects that HTML into the main document, the `<style>` element applies document-wide (author screenshots show sidebar padding changing when a "Meeting" note preview renders). eliandoran noted styles should normally be stripped at import unless the user opts in; the author demonstrated the leak persisting regardless.

## State of current main

### Primary scenario (HTML text notes): FIXED

`renderText` on main sanitizes all note HTML before DOM insertion:

- `apps/client/src/services/content_renderer_text.ts:11` imports `sanitizeNoteContentHtml`.
- `apps/client/src/services/content_renderer_text.ts:21`:
  ```ts
  $renderedContent.append($('<div class="ck-content">').html(sanitizeNoteContentHtml(blob.content)));
  ```
- `apps/client/src/services/sanitize_content.ts:53`: DOMPurify config with `FORBID_TAGS: ["script", "style", "iframe", ...]` so `<style>` is stripped unconditionally (stronger than the PR's trim-gated strip, and not opt-out).

Fixing commit: `f94f91656a` "feat(security): implement a ton of security guardrails..." (authored 2026-02-19), which both created `sanitize_content.ts` and added the call in `renderText`. It became reachable from main via merge `b8b535c0f2` "Stricter security measures (No.9296)" on **2026-05-31**, i.e. after PR 9633 was filed on 2026-05-02, which is why the author could still reproduce the leak in May. Verified with:

```
git log --oneline upstream/main --diff-filter=A -- apps/client/src/services/sanitize_content.ts
# f94f91656a
git log upstream/main --oneline -S sanitizeNoteContentHtml -- apps/client/src/services/content_renderer_text.ts
# f94f91656a  (only commit)
# first-parent walk of upstream/main: first commit NOT containing f94f91656a is
# 23aeeac768 (2026-05-31); the next first-parent commit containing it is
# b8b535c0f2 2026-05-31 "Stricter security measures (9296)"
```

### Residual gap (markdown notes): leak vector still present on main

(Code-read plus DOMPurify behavior verified; end-to-end UI manifestation inferred, not run.)

Main restructured markdown rendering into its own type since the PR:

- `apps/client/src/services/content_renderer.ts:675` (getRenderingType): `type === "code" && entity.isMarkdown()` routes to `type = "markdown"`.
- `renderMarkdown` (`content_renderer.ts:182-200`) sanitizes with **default** DOMPurify config, not the strict one:
  ```ts
  const html = renderToHtml(source, note.title, {
      sanitize: (dirty) => DOMPurify.sanitize(dirty),   // content_renderer.ts:195
      ...
  ```
  and `packages/commons/src/lib/markdown_renderer.ts:608` applies that sanitize to the whole rendered HTML.
- `postProcessRichContent` on main (`content_renderer_text.ts:35-72`) has **no** style stripping; the PR's hunk never landed.

Default DOMPurify keeps `<style>` unless it is the leading element of the fragment (a leading `<style>` gets hoisted into the parsed document head and dropped because `WHOLE_DOCUMENT: false`). Verified empirically against the installed dompurify (3.2.5 in the checkout's node_modules; apps/client/package.json pins 3.4.13 but only 3.2.5 is installed):

```
node -e '...DOMPurify.sanitize(...)...'
leading : "<p>hi</p>"                                       # style dropped (parser hoist)
trailing: "<p>hi</p><style>li{margin:8pt}</style>"          # style KEPT
nested  : "<div><style>li{margin:8pt}</style></div>"        # style KEPT
```

Consequence: a markdown note whose raw-HTML `<style>` block is not the very first element (e.g. after any text, or wrapped in a `<div>`) renders that `<style>` into the preview DOM, where it applies document-wide. Same leak class the PR targeted, surviving on main only for the markdown path. The document-wide effect is inferred from standard DOM semantics; I did not run the app to observe it.

Note the irony: both of the PR's regression tests use a **leading** style block, so on current main they would pass even without the PR's code change (text path: strict sanitizer strips it; markdown path: leading-position parser hoist drops it). The PR's tests no longer distinguish fixed from broken for the residual case.

### Conflict and drift

- GitHub reports `CONFLICTING` / `DIRTY`.
- `content_renderer_text.spec.ts` grew from ~171 lines at PR time to 630 lines / 33 tests on main; `postProcessRichContent` was restructured (include-note handling, KaTeX macros, link embeds).

## Test run attempt

Attempted `pnpm exec vitest run src/services/content_renderer_text.spec.ts` in apps/client. pnpm refused: the checkout's node_modules is stale versus the lockfile and pnpm wanted to purge and reinstall the modules directory (`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`). Reinstalling inside the shared read-only checkout was not acceptable, so no tests were run. Anyone reproducing should run the spec in a dedicated worktree after a fresh `pnpm install`.

## Why no salvage worktree

The task's salvage branch was conditional on "still present". The PR as written is not salvageable by plain cherry-pick into a useful state:

1. Its text-path fix is redundant on main (superseded by the unconditional sanitizer from PR 9296).
2. Its tests pass vacuously on main (leading-style artifacts), so cherry-picking them adds no regression coverage for the real residual.
3. The genuine residual (markdown path, non-leading style) needs a design decision upstream: either gate `$renderedContent.find("style").remove()` on trim in `postProcessRichContent` (the PR's approach, still viable, and it would cover renderMarkdown since that calls postProcessRichContent with options), or make `renderMarkdown` use the strict `sanitizeNoteContentHtml` config instead of default DOMPurify (arguably more correct: it also closes iframe and event-handler vectors in markdown raw HTML). Choosing between those is not a mechanical rebase.

A rework should carry `Co-Authored-By: Yang Zhao <allanzyne@outlook.com>` since the trim-gated strip idea is theirs.

## What was verified vs inferred

Verified (commands run, output captured above): PR metadata, diff, and comments; main's file contents and line numbers; fixing-commit identity and its merge date onto main; default-DOMPurify style retention behavior on the installed package; pnpm test-run infeasibility in the shared checkout.

Inferred (not executed): that a retained `<style>` in a rendered markdown preview visually restyles the whole document (standard DOM behavior, matching the PR author's screenshots for the text path); that dompurify 3.4.13 behaves like the installed 3.2.5 for the style-tag cases; that the PR's tests would pass on main (reasoned from the code paths, not run).

## Remaining for a human

1. Decide the residual fix shape: strict sanitize config in `renderMarkdown` vs trim-gated style strip in `postProcessRichContent`.
2. Review and post `comment-pr9633.md` to the PR thread if the analysis is accepted.
3. If implementing the rework: dedicated worktree, fresh pnpm install, add a regression test with a NON-leading `<style>` block in a markdown note (the discriminating case), credit Yang Zhao.
