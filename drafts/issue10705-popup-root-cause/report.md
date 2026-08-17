# Issue 10705 triage: popup/tooltip/context-menu root-cause analysis

Bead: mitn-5kv.4. Date: 2026-08-15.
Source tree analyzed: $trilium_root at upstream/main 372a749ff2 (read-only).
Issue: TriliumNext/Trilium No.10705 "Some tooltip and context menu glitches",
filed 2026-07-27 by Staenly, labels: Difficulty: Easy, State: Triage, UI.
One follow-up comment (creightonjoiner, 2026-08-13) adds a seventh surface.

## Method

- `gh issue view 10705 --json ...` for the full thread (saved to `issue-raw.json`).
- Downloaded all six animated GIF demos from the issue and extracted frames with
  ffmpeg to identify exactly which UI element each symptom involves
  (frames in session scratchpad, not committed).
- Read the relevant client source at 372a749ff2. No code changes made.
- Duplicate-work check: `gh pr list --repo TriliumNext/Trilium --search "tooltip"`
  and `--search "context menu"`, state open. No open PR addresses any of these
  surfaces (closest are unrelated: 11031 todo-hint flicker, 10224 PDF annotations).

## Enumerated surfaces (from thread + screenshots)

| # | Surface | What the GIF actually shows |
|---|---------|------------------------------|
| S1 | Side panel (launch bar) icons | Launcher icon Bootstrap tooltip ("Calendar") stays visible on top of the launcher context menu after right-click; separately, a launcher tooltip ("Recent Changes") stays stuck after left-click while on a new empty tab |
| S2 | Web Clipper note | Right-click on the "Web clip" badge: badge tooltip ("This note was originally taken from ...") covers the context menu |
| S3 | In-note inline links | CKEditor link actions balloon (url / copy / edit / unlink / "Inline") stays on screen after switching to another tab |
| S4 | PDF note | Selection context menu ("Copy / Copy as Markdown / Search ...") and the note-actions three-dots dropdown do not dismiss when clicking into the PDF |
| S5 | ETAPI settings | Right-click inside the "Rename token" prompt modal: the context menu renders partially behind the modal dialog |
| S6 | Attributes panel | CKEditor mention autocomplete of the attribute editor (`#inbox`, `#clipperInbox`, `#workspaceInbox`) stranded at the top-left corner of the window after the panel closes |
| S7 | (comment) Long menus | Context menus / ellipsis menus taller than the viewport are clipped and cannot be scrolled; also affects submenus |

## Root-cause buckets (code analysis)

These seven symptoms resolve to five independent causes. They are not one bug.

### A. Static Bootstrap tooltips are not dismissed when a context menu opens (S1 + S2)

- The launch bar buttons and the clipped-note badge both create their tooltip via
  `useStaticTooltip` (Bootstrap `Tooltip`, module-private `tooltips` set):
  - `apps/client/src/widgets/react/hooks.tsx:1135` (`const tooltips = new Set<Tooltip>()`, not exported)
  - `apps/client/src/widgets/react/ActionButton.tsx:52` (trigger: `"hover focus"` on desktop)
  - `apps/client/src/widgets/react/Badge.tsx:32-39` (web clip badge tooltip)
- `ContextMenu.show()` dismisses only the note-link preview tooltips:
  `apps/client/src/menus/context_menu.ts:91` calls `note_tooltip.dismissAllTooltips()`,
  which iterates `openTooltipElements` in
  `apps/client/src/services/note_tooltip.ts:31-38`. The static `tooltips` set in
  hooks.tsx is never touched by the context menu path.
- `useStaticTooltip`'s dismiss-on-press listens to `"click"` only
  (`apps/client/src/widgets/react/hooks.tsx:1170-1178`); `contextmenu` never fires it.
- The legacy (pre-Preact) button widget did hide its tooltip on right-click:
  `apps/client/src/widgets/buttons/abstract_button.ts:41-49` (`this.tooltip.hide()`
  inside the contextmenu handler). The Preact `ActionButton` has no equivalent, and
  the launcher context menu is attached via
  `apps/client/src/widgets/launch_bar/launch_bar_widgets.tsx:31-34,44` which goes
  straight to `showLauncherContextMenu` without touching the tooltip.
- The S1 left-click-residue sub-symptom is mitigated but maybe not eliminated by
  commit 5d99e3b02d (2026-08-01, "fix(tooltips): put a tooltip away on the press
  that opened something"): it hides on click, but the `focus` trigger can re-show
  the tooltip when focus returns to the button (for example after the
  Recent Changes dialog closes). Needs nightly verification.
- Related landed fix: df0cb94187 (2026-07-28, one day after filing) added the
  `context-menu-shown` body-class guard to note_tooltip
  (`apps/client/src/services/note_tooltip.ts:49-54,139`). That fixes async
  note-preview tooltips landing on menus, but does nothing for the static
  tooltips in this bucket.

### B. Clicks inside the pdf.js iframe never reach the parent document's dismiss listeners (S4)

- The PDF is a cross-document `<iframe>` running pdf.js:
  `apps/client/src/widgets/type_widgets/file/PdfViewer.tsx:47-58`.
- The custom context menu dismisses on `$(document).on("click", ...)` in the
  parent document only: `apps/client/src/menus/context_menu.ts:84`. Bootstrap
  dropdowns (the note-actions three-dots menu) likewise auto-close from
  document-level listeners. A click inside the iframe belongs to the iframe's
  own document and never bubbles into the parent, so neither closes.
- The screenshots confirm both menus are Trilium chrome, not pdf.js UI: the
  right-click menu is the Electron selection menu
  (`apps/client/src/menus/electron_context_menu.ts`, built via `contextMenu.show`)
  and the three-dots menu is the note actions dropdown.
- A natural fix point already exists: Trilium already bridges in-iframe clicks
  for tab activation at `apps/client/src/widgets/type_widgets/file/Pdf.tsx:240-243`
  (`contentWindow.addEventListener('click', ...)`); the same hook could also
  dismiss floating layers. (Observation only; no change made.)

### C. z-index tie between the context menu and prompt modals (S5)

- `#context-menu-container` has `z-index: 2000`
  (`apps/client/src/stylesheets/style.css:1666-1670`) and is the first child of
  `<body>` (`apps/client/index.html:17`).
- The prompt dialog declares `zIndex={2000}`
  (`apps/client/src/widgets/dialogs/prompt.tsx:50`), and `openDialog` raises it
  to at least `maxZIndex + 10` over other visible modals
  (`apps/client/src/services/dialog.ts:177-182`).
- Equal z-index (2000 vs 2000): later DOM order wins, and the modal is rendered
  after the menu container, so the menu paints behind the modal. With stacked
  modals the modal is outright higher (2010+). Nothing ETAPI-specific: any
  right-click inside any prompt/confirm modal should reproduce.

### D. CKEditor balloons outlive or misposition against a hidden host (S3 + S6)

- Both stranded popups are CKEditor balloon panels living in the `.ck-body`
  portal attached to `document.body`, outside the note's widget subtree:
  - S3 is the LinkUI actions balloon (frame shows url/copy/edit/unlink toolbar).
  - S6 is the mention autocomplete balloon of the CKEditor-based attribute editor
    (`apps/client/src/widgets/ribbon/components/AttributeEditor.tsx:43-46,311`,
    mention feed via `note_autocomplete.autocompleteSourceForCKEditor`). The
    frame shows the mention list re-anchored at the window origin (0,0-ish)
    after the panel closed, which is the classic signature of a balloon
    positioned against a hidden/detached target.
- No app code tears these down on tab switch or panel close: the only global
  cleanup is `$("body > div.tooltip").remove()` on tab REMOVAL
  (`apps/client/src/components/tab_manager.ts:537-538`), which does not match
  `.ck-balloon-panel`/`.ck-body`. `floating_layers.ts` knows the selector
  (`apps/client/src/widgets/react/floating_layers.ts:17-19`) but is a hit-test
  helper, not a dismissal path.
- Confidence: mechanism for S6 (balloon anchored to hidden target falls back to
  origin) is inferred from the rendering position, not stepped through in a
  debugger. S3's persistence across tab switch is taken from the report and the
  absence of any dismissal code path; CKEditor's own clickOutsideHandler may
  clear it on the next in-document click, which the GIF cannot show. Both are
  PLAUSIBLE, not CONFIRMED.

### E. Menus taller than the viewport cannot scroll (S7, from the comment)

- `positionMenu()` clamps the menu's top/left into the viewport but never
  constrains its height: `apps/client/src/menus/context_menu.ts:140-186`.
- `overflow: auto` is explicitly forbidden on the container because submenus are
  DOM children and would be clipped:
  `apps/client/src/stylesheets/style.css:1633-1636`
  ("Cannot set overflow: auto, submenus will break").
- This is a structural limitation (submenus need portaling or the menu needs an
  internal scroll region), not a regression, and not shared with A-D. It is an
  enhancement-shaped issue of its own. Submenu clipping is partially addressed
  for the vertical flip case by `repositionSubmenu`
  (`apps/client/src/menus/context_menu.ts:188-204`), which does not help when
  the parent menu itself overflows.

## Split-or-merge recommendation

Split into 5 issues; keep 10705 as the umbrella/tracking issue linking the five,
or close it once split:

1. Static button/badge tooltips not hidden when a context menu opens (S1 + S2, bucket A).
2. Menus over PDF notes not dismissed by clicks inside the pdf.js iframe (S4, bucket B).
3. Context menu renders behind prompt/confirm modals (S5, bucket C, generalize away from ETAPI).
4. CKEditor balloons (link actions, attribute mention list) outlive their hidden host (S3 + S6, bucket D; may split further if investigation shows the two need different fixes).
5. Context menus taller than the viewport cannot scroll (S7, bucket E, enhancement).

## What remains for the human (live nightly verification)

All six original GIFs were recorded around 2026-07-27; two relevant fixes landed
after filing (df0cb94187 on 2026-07-28, 5d99e3b02d on 2026-08-01). Each surface
needs a repro attempt on a current nightly build before the split issues are
filed:

- S1a: right-click a launch bar icon; is the icon tooltip still overlapping the menu? (Expected: still broken; bucket A unfixed.)
- S1b: left-click a launcher that opens a dialog (Recent Changes) on a new empty tab, close the dialog; does the tooltip stick? (Partially fixed by 5d99e3b02d; the focus-trigger re-show path is untested.)
- S2: right-click the "Web clip" badge on a clipped note; tooltip over menu? (Expected: still broken; same bucket A.)
- S3: click an inline link so the balloon shows, switch tabs by clicking the tab strip AND by keyboard shortcut; does the balloon persist in both cases?
- S4: in a PDF note open the right-click menu and the three-dots menu, then click into the PDF page; do they stay? (Expected: still broken; no bridging code exists.)
- S5: ETAPI settings, rename a token, right-click inside the input; menu behind modal? (Expected: still broken; z-index values unchanged on main.)
- S6: open/close the attribute panel while the mention autocomplete is showing; stranded list at top-left? The attribute UI was heavily reworked 2026-07-27 to 07-30, so this one is the most likely to have changed shape.

Verification requires a real desktop build (Electron for the S4/S5 electron menu
variants); no automated check substitutes.

## Exact commands used (selection)

```bash
gh issue view 10705 --repo TriliumNext/Trilium --json title,body,author,createdAt,labels,state,comments
git -C $trilium_root log -1 --oneline          # 372a749ff2
git -C $trilium_root log --format="%h %ad %s" --date=short df0cb94187 -1
git -C $trilium_root log -S "dismissOnPress" -- apps/client/src/widgets/react/hooks.tsx
gh pr list --repo TriliumNext/Trilium --search "tooltip" --state open
gh pr list --repo TriliumNext/Trilium --search "context menu" --state open
ffmpeg -i <demo>.gif -vf "select='not(mod(n\,60))'" -vsync vfr frames_%02d.png
```

No GitHub write operations were performed. No files outside
`drafts/issue10705-popup-root-cause/` were created or modified.

## Live verification results (2026-08-17)

Environment: Trilium at upstream/main `964e23ec56` (implicated files
unchanged since `372a749ff2`), dev server (web client) on Linux, headless
Chromium via Playwright, fixture DB copy. Scripts and screenshots in
`repro/`. Electron-only surfaces were not run; Web client only.

| Surface | Verdict | Evidence |
|---|---|---|
| S1a (tooltip over launcher context menu) | **REPRODUCED** | "New Note" tooltip visible while `#context-menu-container` menu open; screenshot `repro/repro10705-s1a.png` |
| S1b (tooltip re-shown after dialog close) | **REPRODUCED** | Tooltip correctly hidden while Recent Changes dialog open (5d99e3b02d works there), but re-shown after Escape closes the dialog: focus returns to the launcher button and the `focus` trigger fires with the pointer far away |
| S2 (web clip badge) | not tested | needs a clipped note in the DB; same bucket A as S1a, which reproduced |
| S3 (link balloon vs tab switch) | **NOT reproduced** | balloon dismissed on tab switch via BOTH the tab-strip click and the command layer (`triggerCommand("activateNextTab")`, active note verified changed). Bucket D's guess that clickOutsideHandler would only cover the click path was too pessimistic |
| S4 (menus over PDF iframe) | **REPRODUCED** | note-actions dropdown stays open after a click inside the pdf.js iframe; control click in app chrome closes it immediately |
| S5 (menu behind prompt modal) | not testable in web | needs Electron's input context menu; z-index analysis (2000 vs 2000, DOM order) stands unchanged on main |
| S6 (attribute autocomplete stranded) | **NOT reproduced** | autocomplete balloon opens at a sane anchored position and is dismissed when the panel closes (tried Escape-then-close and direct-click close). Consistent with the late-July attribute UI rework changing this surface |
| S7 (menus taller than viewport) | not re-tested | structural, code-confirmed; nothing changed in `positionMenu()` |

Impact on the split recommendation: still split, but now FOUR issues instead
of five - bucket D (S3+S6) drops out as not reproducible on current main in
the web client. If the reporter can still trigger S3/S6 (e.g. in Electron or
by a different gesture), it can be filed separately with fresh steps.
Remaining for a human: S5 (Electron), optional S2, and an Electron sweep of
S1a/S1b/S4 to confirm parity with the web results.
