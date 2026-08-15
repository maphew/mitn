Fixes TriliumNext/Trilium#9749.

## Why

Mermaid gantt-based diagrams (including the demo "Gantt" and "Bar chart" notes, the latter being gantt syntax with `dateFormat X`) collapse to a 1-2 px sliver as soon as the split divider is dragged. Analysis details are in [this comment on the issue](https://github.com/TriliumNext/Trilium/issues/9749#issuecomment-5304567026); short version:

- `useResizer` in `SvgSplitEditor.tsx` has the container width in the deps of the svg-pan-zoom setup effect, so every width change destroys and re-creates the pan/zoom instance.
- svg-pan-zoom removes the SVG `viewBox` attribute on init and `destroy()` never restores it, so every re-init falls back to fitting from `viewport.getBBox()`.
- Mermaid's gantt renderer always draws a "today" marker far outside the chart's date domain. It is outside the viewBox but inside `getBBox()`, inflating the demo Gantt bbox to ~104,000 units against a 1,280-unit viewBox (~33.5M units for the Bar chart), so `fit()` scales the chart to invisibility.

## What

Smallest fix: capture the `viewBox` before `svgPanZoom()` init and restore it in the effect cleanup right after `destroy()`, so every re-init takes the same `cacheViewBox()` path as the first one. This also removes the small zoom jump previously visible on the first resize of well-behaved diagrams.

Closed PR 9960 by @wsjwu58-cmd diagnosed the same resize problem earlier (bundled with unrelated fixes and closed when a split was requested); this PR is the resize-only slice with a different minimal mechanism, credited here as prior art.

## Validation

- Two new e2e regression tests in `packages/trilium-e2e/src/note_types/mermaid.spec.ts`: round-trip divider drag on the demo "Gantt" and "Bar chart" notes, asserting the pan/zoom viewport height survives. A round-trip drag is used because a one-way drag legitimately shrinks the diagram with the pane; with the bug the height collapses to ~0.001x even after the divider returns to its start position.
- Red/green verified: with the source fix reverted the two tests fail (`viewport height 0.049 / 0.0017 px vs ~25 px expected`, reproduced on 4/4 attempts); with the fix they pass, including a `--repeat-each=2` stability run alongside the existing mermaid e2e tests.
- The e2e fixture database gains the two demo notes ("Gantt", "Bar chart" under Mermaid Diagrams), copied from `demo.zip`. The rows were added surgically to the pristine fixture (notes/branches/blobs/entity_changes only) so nothing else in the fixture changes; the core migration suite that reloads this fixture (`0240__migrate_board_status_to_select.spec.ts`) still passes 36/36.
- `pnpm typecheck` clean.

Out of scope, per the issue analysis: the mindmap `::icon` sample complaint in the same issue has a different cause (unregistered icon pack).

_claude-fable-5-high on behalf of matt wilkie_
