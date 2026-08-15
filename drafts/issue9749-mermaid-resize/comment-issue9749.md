Traced the vanish on current main (372a749ff2). It is specific to gantt-based diagrams; both demo notes that vanish ("Gantt" and "Bar chart") are gantt syntax.

Observed: dragging the split divider makes the diagram collapse to a 1-2 px sliver on the first movement.

Cause, in three parts:

1. `useResizer` in `apps/client/src/widgets/type_widgets/helpers/SvgSplitEditor.tsx` has the container width (a fresh DOMRect per ResizeObserver tick) in the deps of the svg-pan-zoom setup effect, so every width change destroys and re-creates the svg-pan-zoom instance.
2. svg-pan-zoom removes the SVG `viewBox` attribute on init (`shadow-viewport.js`, `cacheViewBox`) and `destroy()` never restores it. The re-init therefore falls back to `viewport.getBBox()` for its fit geometry.
3. Mermaid's gantt renderer always draws the "today" marker line, even when today is far outside the chart's date range. It is outside the viewBox but inside `getBBox()`. For the demo Gantt (Jan 2014 dates) the bbox is ~104,000 units wide against a 1280-unit viewBox; for the demo Bar chart (`dateFormat X`, domain 0-71 seconds) it is 33,554,428 units. `fit()` then scales the chart by 0.005 or 0.000016, so it effectively disappears. Diagrams whose bbox matches their viewBox (flowchart, xychart) survive.

Smallest fix: in the setup effect, capture `svgEl.getAttribute("viewBox")` before calling `svgPanZoom()` and re-set it right after `zoomInstance.destroy()` in the cleanup, so each re-init fits from the real viewBox again. Not re-creating the instance on width change at all (letting the existing `resize().fit().center()` effect handle it) also works and avoids a small zoom jump on first resize, but needs care for panes that start at zero width. PR 9960 attempted the second approach earlier but was closed unmerged when asked to split its bundled changes.

Verified with: a headless Chromium harness replaying the exact effect sequence using the app's own svg-pan-zoom 3.6.2 and mermaid 11.16.1 builds; gantt collapses to a 1 px viewport after the first simulated drag step, and both fix variants keep it proportionally scaled (zoom 400/1280 at 400 px pane width). Flowchart and xychart stay visible in the same run.

Remaining uncertainty: reproduced against the extracted code path, not inside the running app, so effect timing in the live client is inferred from the source rather than observed.

The mindmap icon part of this issue is unrelated: the `::icon(fa fa-book)` sample appears to require an icon pack that is not registered (closed PR 9960 addressed it by removing the icon from the sample), so nothing renders for it. Probably worth splitting into its own issue.

_claude-fable-5-high on behalf of matt wilkie_
