Root cause found. It looks already fixed in v0.105.0.

Observed: in the video, the menu is displaced from the pointer by about the canvas container's offset (tree panel width, header height). It moves with the pointer. This is the result when Excalidraw's container-relative `left`/`top` are applied to a `position: fixed` element.

Cause: v0.104.0 ships this rule in `packages/ckeditor5-math/theme/mathform.css`:

```css
.ML__tooltip, [role="tooltip"], .ML__popover[role="tooltip"], .popover, [data-ml-tooltip] {
    position: fixed !important;
}
```

The bare `.popover` selector also matches Excalidraw's context menu (`.excalidraw .popover`, normally `position: absolute`). The CKEditor CSS loads lazily when a text editor first mounts. That explains the repro conditions:
- The bug starts after a new note is created (it starts as a text note), and then affects every open canvas.
- It goes away after a reload with a canvas note active.
- It does not show on web if no text note was opened in that session.

It is not Electron-specific, and not related to zoom.

Fix: commit 5e02f7d19b (2026-08-05, "keep the math form's tooltip rescue to MathLive's own tooltips") removed the bare `.popover` and `[role="tooltip"]` selectors. It was written for a geo map popup symptom. It is included in v0.105.0. The desktop video shows the "Get Version 0.105.0" update banner, so that client was still v0.104.0.

Uncertainty: not re-tested on a v0.105.0 desktop build here. @fbd-ss @march-7th-mini, can you retest on v0.105.0 or later? Open a text note first, then right-click in a canvas. If it still reproduces, check the computed `position` of `.excalidraw .popover` in devtools. It should be `absolute`.

_claude-fable-5-1-high on behalf of matt wilkie_
