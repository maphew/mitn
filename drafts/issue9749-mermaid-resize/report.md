# Triage: Trilium issue 9749 - Mermaid Gantt/Bar charts vanish on pane resize

Bead: mitn-5kv.6. Date: 2026-08-15. Trilium main at `372a749ff2` (upstream
TriliumNext/Trilium, read-only shared checkout at `$trilium_root`).

## Verdict

**likely-still-present** at `372a749ff2`, with the mechanism reproduced
outside the app using the exact library versions the app ships. Two minimal
fix variants were verified against the same repro. Runtime verification in the
real app remains for a human (steps at the end).

## 1. Collision / overlap check

```
gh pr list --repo TriliumNext/Trilium --state open --search "mermaid"
```
Result: empty. No open PR mentions mermaid.

```
gh api "search/issues?q=repo:TriliumNext/Trilium+9749+in:body+type:pr"
```
Result: exactly one PR ever referenced 9749: **PR 9960 "fix: improve mermaid
rendering" by wsjwu58-cmd, CLOSED unmerged 2026-08-04**. It bundled four
unrelated fixes; maintainer eliandoran asked for them to be split into
separate PRs and the author never followed up. Its resize fix ("remove width
dependency from svgPanZoom instance creation effect ... add 100ms debounce")
matches the diagnosis below but never landed. So: no active collision, but
any upstream comment should credit PR 9960 as a prior attempt.

Recent mermaid-path commits (`git log --all --oneline --since=2.months --
'*mermaid*'`): all hits are either the ckeditor5 inline-mermaid plugin
(`2575ed6a7a`, `037741ff63`, `bcb57a87b5` - text-note rendering, not the
mermaid note type), sample additions (`4eb3f5bf06`), or dependency bumps.
None touch the split-view resize path.

Last change to the buggy function itself: `dce9f50911` (2026-03-14,
"fix(mermaid): not recentering when using the sample switcher") - predates
the issue report (2026-05-14, v0.103.0, released 2026-05-13). Nothing after.

## 2. The code path (main @ 372a749ff2)

- `apps/client/src/widgets/type_widgets/mermaid/Mermaid.tsx:40` - the mermaid
  note type delegates to `SvgSplitEditor`.
- `apps/client/src/widgets/type_widgets/helpers/SplitEditor.tsx:105` - the
  two panes are a Split.js split; dragging the gutter resizes the preview
  pane continuously.
- `apps/client/src/widgets/type_widgets/helpers/SvgSplitEditor.tsx:158-211`
  (`useResizer`) - the bug:
  - `useElementSize` (`apps/client/src/widgets/react/hooks.tsx:934`) returns
    a **new DOMRect object on every ResizeObserver tick**.
  - That DOMRect is in the dependency array of the svg-pan-zoom setup effect
    (`SvgSplitEditor.tsx:202`: `[ containerRef, noteId, svg, width ]`), so
    **every width change runs the cleanup (`zoomInstance.destroy()`,
    line 200) and re-creates the instance (line 178)**, then restores the
    previous pan/zoom, then the second effect (lines 205-208) calls
    `resize().fit().center()`.
- svg-pan-zoom 3.6.2 behavior (`node_modules/svg-pan-zoom/src/`):
  - On init, `cacheViewBox()` reads the SVG `viewBox`, caches it, and
    **removes the attribute** (`shadow-viewport.js:78`).
  - `destroy()` does **not** restore the viewBox (`svg-pan-zoom.js:665-719`).
  - On the second init the viewBox is gone, so `simpleViewBoxCache()` falls
    back to `viewport.getBBox()` (`shadow-viewport.js:87-94`), and `fit()`
    scales the whole bbox into the pane.

## 3. Why exactly Gantt and "Bar Chart"

Mermaid's gantt renderer always draws a "today" marker line at
`timeScale(now)`, even when today is far outside the chart's date domain.
The line is outside the viewBox but inside `getBBox()`.

Measured (headless Chromium, mermaid 11.16.1, the version in
`pnpm-lock.yaml`; installed `node_modules` is stale at 11.9.0 and behaves
identically):

- Demo "Gantt" note (dates in Jan 2014): viewBox `0 0 1280 148`, but
  viewport `getBBox()` width ~104,000 units (today = 2026 extrapolated).
- Demo "Bar chart" note is **not an xychart - it is gantt syntax with
  `dateFormat X`** (`apps/edit-docs/demo/root/Trilium Demo/Note Types/
  Mermaid Diagrams/Bar chart.txt`). Its domain is 0-71 (seconds), so the
  today marker lands at epoch-seconds x, bbox width **33,554,428** units vs
  1,264 without the `.today` line.

After the first divider movement, `fit()` therefore computes a zoom of
500/104000 = 0.005 (Gantt) or 550/33554428 = 0.000016 (Bar chart): the chart
is scaled to a 1-2 px sliver, i.e. "vanishes". Diagrams whose bbox matches
their viewBox (flowchart, xychart, etc.) survive; they only get a small
one-time fit jump (repro showed zoom 1.376 -> 1.439 for flowchart).

This also explains the exact reproduction on app.triliumnotes.org: the two
demo notes that vanish are precisely the two gantt-based ones.

## 4. Empirical reproduction (out of app)

Script: `repro.mjs` (copied next to this report). It loads the app's own
`svg-pan-zoom` 3.6.2 UMD plus mermaid (both 11.9.0 from node_modules and
11.16.1 fetched from npm), renders flowchart/gantt/xychart with Trilium's
`getMermaidConfig()` settings into a 600x500 pane, then replays the exact
`useResizer` effect sequence for pane widths 600 -> 400.

Key output (mermaid 11.16.1, identical shape on 11.9.0):

```
=== gantt ===
after-init-600   transform=matrix(0.46875,...)          vpRect h=54   OK
after-drag-550   transform=matrix(0.00527...,...)       vpRect h=2    VANISHED
after-drag-400   transform=matrix(0.00383...,...)       vpRect h=1    VANISHED
=== flowchart ===  stays visible at every step
=== xychart  ===  stays visible at every step
```

Fix variant A (do not destroy/recreate on width change; only
`resize().fit().center()`): gantt scale stays proportional
(0.469 -> 0.3125 = 400/1280), chart visible at every step.

Fix variant B (smallest diff: capture `svgEl.getAttribute("viewBox")` before
`svgPanZoom()` init and re-set it after `destroy()` in the effect cleanup):
identical healthy numbers.

Both verified with the same script (`repro-fix.mjs`, `repro-fix2.mjs`,
copied next to this report; `check-today.mjs` isolates the today-marker bbox
inflation).

## 5. Suggested fix

Smallest safe change in `SvgSplitEditor.tsx` `useResizer`: variant B, restore
the viewBox in the cleanup so every re-init takes the same `cacheViewBox()`
path as the first init. Variant A (keep one instance per rendered svg and let
the existing second effect handle resizes) is cleaner but needs care for the
"pane starts at width 0" case that the `width` dependency currently handles
(instance creation must retry when the pane first gets real width).

Secondary observation (pre-existing, cosmetic): even for well-behaved
diagrams the destroy/recreate discards the initial viewBox-based fit, so the
zoom level jumps slightly on the first resize. Both variants fix that too.

The issue's second complaint (mindmap sample icon not shown) is a separate
cause: the `::icon(fa fa-book)` sample requires an icon pack that is not
registered. PR 9960 item 2 addressed it by removing the icon from the sample.
Out of scope here.

## 6. Regression test sketch (Playwright e2e)

Infra exists: `packages/trilium-e2e/src/note_types/mermaid.spec.ts` already
opens demo notes by title and asserts on `.render-container svg`, and the
demo document contains the two affected notes ("Gantt", "Bar chart").

```ts
// packages/trilium-e2e/src/note_types/mermaid.spec.ts
test("gantt diagram survives split divider drag (issue 9749)", async ({ page, context }) => {
    const app = new App(page, context);
    await app.goto();
    await app.goToNoteInNewTab("Gantt");

    const viewport = app.currentNoteSplit.locator(".render-container svg .svg-pan-zoom_viewport");
    await expect(viewport).toBeVisible();
    const before = await viewport.boundingBox();

    // Drag the Split.js gutter ~150px left in small steps so ResizeObserver
    // fires repeatedly, matching a real drag.
    const gutter = app.currentNoteSplit.locator(".note-detail-split .gutter");
    const g = (await gutter.boundingBox())!;
    await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2);
    await page.mouse.down();
    for (let dx = 30; dx <= 150; dx += 30) {
        await page.mouse.move(g.x - dx, g.y + g.height / 2);
    }
    await page.mouse.up();

    // With the bug, the viewport collapses to a 1-2 px sliver.
    const after = (await viewport.boundingBox())!;
    expect(after.height).toBeGreaterThan(before!.height * 0.5);
});
```

Notes for whoever lands it: verify the gutter selector against the rendered
DOM (Split.js default class is `gutter`); repeat for the "Bar chart" note,
which is the pathological case (bbox 33.5M units); the assertion is on
viewport height because the gantt bbox width is dominated by the off-screen
today marker even when healthy.

## 7. What was verified vs inferred

Verified:
- Issue text, labels, open state; no open PR overlap; PR 9960 history.
- Code path and line numbers at `372a749ff2` (files read directly).
- svg-pan-zoom 3.6.2 removes viewBox on init and does not restore on destroy
  (source read: `shadow-viewport.js:49-81`, `svg-pan-zoom.js:665-719`).
- Vanish mechanism reproduced headlessly with the app's own library builds,
  both mermaid 11.9.0 (installed) and 11.16.1 (lockfile version), replaying
  the exact effect sequence.
- Both fix variants restore correct behavior in the same repro.
- Demo "Bar chart" note is gantt syntax (file read).

Inferred (not run):
- That the real app's ResizeObserver/effect ordering matches the simulated
  sequence. The simulation mirrors the code exactly, but React batching and
  rAF timing in the live app were not observed. This is the residual
  uncertainty behind "likely" rather than "confirmed".

## 8. Remaining for human

1. Runtime confirmation: `pnpm install && pnpm client:serve` (or run the
   desktop app), open a mermaid note, paste the demo Gantt content, drag the
   split divider. Expect the diagram to shrink to a sliver after the first
   drag movement.
2. Decide whether to open a fix PR (variant B is a ~4 line diff in
   `SvgSplitEditor.tsx`) plus the e2e test; credit PR 9960 / wsjwu58-cmd as a
   prior attempt in the PR body.
3. Review and, if acceptable, post `comment-issue9749.md` on the issue.

## Appendix: exact commands run

```
gh pr list --repo TriliumNext/Trilium --state open --search "mermaid"      # empty
gh issue view 9749 --repo TriliumNext/Trilium --json ...                   # open, no comments
git -C $trilium_root log --all --oneline --since=2.months -- '*mermaid*'
git -C $trilium_root log --oneline -L 158,211:apps/client/src/widgets/type_widgets/helpers/SvgSplitEditor.tsx
gh api "search/issues?q=repo:TriliumNext/Trilium+9749+in:body+type:pr"     # PR 9960 only, closed
gh pr view 9960 --repo TriliumNext/Trilium --json ...
node repro.mjs / repro-11161.mjs / repro-fix.mjs / repro-fix2.mjs / check-today.mjs
```
