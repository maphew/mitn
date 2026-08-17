# Issue 10680: stuck emoji tooltip - static analysis report

Bead: mitn-5kv.3 (P2). Slug: issue10680-emoji-tooltip.
Analyst: Claude Code subagent, read-only. Trilium checkout at upstream/main
372a749ff2. I could not run the GUI and could not watch the video attached to
the issue; everything below is static code analysis plus git archaeology.
What is marked VERIFIED was confirmed by reading code or running the exact
command shown; what is marked INFERRED is a conclusion drawn from that.

## Issue summary

TriliumNext/Trilium issue 10680, "[Bug] Emoji Tooltip stuck on screen",
reported 2026-07-26 by DeSynkro, labels: Difficulty: Easy, State: Triage, UI.
Repro (verbatim from the issue):

1. Click the emoji button to add an emoji to the note
2. Hover over an emoji until its tooltip appears
3. Type something or search for another emoji

The tooltip sticks and does not go away; the reporter says it "requires a
restart to get rid of it". Started in 0.104.0. Reproduced on Linux (CachyOS)
and Windows, and by a second user (epicnerd1990) on an Arch nightly build.
The issue body also says "The Tooltip when selecting an emoji **for a note**"
which reads as the note icon picker rather than the text-editor emoji
insertion feature. Command used (VERIFIED):

```bash
gh issue view 10680 --repo TriliumNext/Trilium --json title,body,labels,comments
```

## Two candidate surfaces

Trilium has two pickers a user could call "the emoji button":

A. The note icon picker (button next to the note title; sets the note's
   icon; emoji appear here when an emoji icon pack is installed, and the
   issue phrase "selecting an emoji for a note" matches this surface).
   Tooltips here are Bootstrap 5 tooltips.

B. The CKEditor text-toolbar emoji button (inserts an emoji character into a
   text note). Tooltips here are CKEditor's own TooltipManager balloons.

Both surfaces share the same structural hazard: typing in the picker's search
field re-renders the grid and detaches the hovered tile from the DOM, and no
browser fires mouseleave on a removed element. But only surface A produces a
tooltip that nothing will ever remove, and only surface A changed between
0.103.0 and 0.104.0. Conclusion (INFERRED, high confidence): the bug is the
note icon picker, surface A.

## Root cause (surface A), with file:line evidence

All paths relative to the Trilium checkout at 372a749ff2 unless a tag is
named.

1. The icon picker attaches one *delegated* Bootstrap tooltip to the whole
   icon list container:
   `apps/client/src/widgets/react/IconPicker.tsx:50-55` -
   `useStaticTooltip(iconListRef, { selector: "span", ..., animation: false,
   title() { return this.getAttribute("title") || ""; } })`.
   At v0.104.0 the same code lived in
   `apps/client/src/widgets/note_icon.tsx:113-117` (VERIFIED via
   `git show v0.104.0:apps/client/src/widgets/note_icon.tsx`).

2. Bootstrap's delegated mode creates a separate per-span Tooltip instance
   the first time each span is hovered:
   `node_modules/bootstrap/js/src/tooltip.js:361-362`
   (`getOrCreateInstance(event.delegateTarget, ...)`), wired through
   mouseenter/mouseleave listeners at `tooltip.js:444-470`. The only things
   that hide such an instance are mouseleave/focusout **on that same span**,
   or an explicit hide()/dispose() on that instance.

3. The popup element is appended to `document.body`: with no `container`
   option, `tooltip.js:559` resolves `container === false` to
   `document.body` (Bootstrap 5.3; `apps/client/package.json:40` pins
   bootstrap 5.3.8). So the popup floats over the whole app, not inside the
   picker dropdown.

4. The grid is virtualized with react-window
   (`IconPicker.tsx:88-99`), and each cell renders
   `<span key={id} class={...} title={...}>` (`IconPicker.tsx:314-321`).
   Typing in the search box (`IconPicker.tsx:255`, `onChange={setSearch}`)
   changes `filteredIcons` (`IconPicker.tsx:381-406`), so the cell under the
   pointer re-renders with a different `key` and the hovered span is
   **replaced with a new DOM node**. Scrolling the virtualized grid detaches
   cells the same way, so hover-then-scroll is a second trigger for the same
   leak.

5. The detached span never receives mouseleave, so its per-span Tooltip
   instance never hides, and its popup div stays in `document.body`. Nothing
   else can reach it:
   - The container-level cleanup in
     `apps/client/src/widgets/react/hooks.tsx:1180-1208` disposes only the
     container's own instance (line 1187) and then sweeps
     `element.querySelectorAll("[aria-describedby]")` (lines 1200-1207).
     Bootstrap stamps `aria-describedby` on the *trigger* span
     (`tooltip.js:206`, cleared on hide at `tooltip.js:277`), but the stuck
     trigger is no longer a descendant of the container, so the sweep never
     finds it. Closing the picker therefore does NOT remove the popup.
   - The "hide all the other tooltips" pass on `show.bs.tooltip`
     (`hooks.tsx:1155-1161`) iterates the module-level `tooltips` set, which
     contains only container-level instances; delegated per-span instances
     are never added to it.
   - Bootstrap has no self-healing (no mutation observation, no visibility
     re-check). The popup persists until page reload / app restart, exactly
     matching the report.

## Why it started in 0.104.0 (the decisive evidence)

The delegated tooltip and the virtualized grid both already existed at
v0.103.0 (VERIFIED: `git show v0.103.0:apps/client/src/widgets/note_icon.tsx`
shows `useStaticTooltip(iconListRef, { selector: "span", ... })` and
react-window `Grid`). What changed is the cleanup:

- v0.103.0 `useStaticTooltip` cleanup ended with a blanket sweep:

  ```ts
  // Remove any lingering tooltip popup elements from the DOM.
  document.querySelectorAll('.tooltip').forEach(t => t.remove());
  ```

  This ran on EVERY `useStaticTooltip` effect cleanup anywhere in the app,
  so an orphaned popup was wiped as soon as the picker closed (its own hook
  cleanup ran) or any other tooltip-bearing component re-rendered. The leak
  existed but was invisibly masked.

- Commit `95b244e0c6` (2026-07-11, "client/text editor/custom task states:
  fix some issues", first released in v0.104.0 - VERIFIED with
  `git log v0.103.0..v0.104.0 -S 'aria-describedby' -- .../hooks.tsx` and
  `git show 95b244e0c6`) replaced the blanket sweep with the scoped
  `[aria-describedby]` sweep, deliberately, because the blanket sweep was
  wiping unrelated tooltips (the TodoListMultistateEditing checkbox tooltip,
  per the in-code comment at `hooks.tsx:1194-1199`). The scoped sweep cannot
  see a trigger that has already left the container, so the masking
  disappeared and the leak became user-visible. This matches the reporter's
  "starting in version 0.104.0" precisely.

Behavioral difference that a live repro can confirm: on 0.103.x the stuck
tooltip disappears when the icon picker is closed; on 0.104.x it survives
closing the picker and everything else short of a reload.

## Hypotheses ruled in / out

- RULED IN: delegated Bootstrap tooltip orphaned by react-window re-render in
  the icon picker; exposed (not caused) by commit 95b244e0c6 narrowing the
  cleanup sweep. Evidence above.

- RULED OUT: CKEditor emoji picker (toolbar emoji button, surface B).
  Its grid does detach tiles on search without mouseleave
  (`node_modules/@ckeditor/ckeditor5-emoji/src/ui/emojigridview.js:160-177`,
  `_updateGrid` removes tiles; tiles carry `tooltip: name` at line 196), and
  CKEditor's TooltipManager keeps `_currentElementWithTooltip` pointing at
  the detached tile while early-returning on mouseleave/blur of any other
  element (`node_modules/@ckeditor/ckeditor5-ui/src/tooltipmanager.js:296,
  319`). So its tooltip CAN briefly stick. But it has several heal paths a
  restart-requiring bug contradicts:
  - Escape anywhere unpins (`tooltipmanager.js:227-231`).
  - Focusing any element without a tooltip (e.g. clicking back into the
    note text) unpins (`tooltipmanager.js:245-247`).
  - Hovering any other tooltip-bearing element (any toolbar button) unpins
    and re-pins (`tooltipmanager.js:257`).
  - Any `editor.ui#update` (typing in the note) re-checks
    `isVisible(currentElement)` and unpins a detached target
    (`tooltipmanager.js:405-417`).
  Also, nothing on this surface changed across the version boundary:
  v0.103.0 shipped ckeditor5 48.0.1 and v0.104.0 shipped 48.2.0 (VERIFIED
  via `git diff v0.103.0 v0.104.0 -- packages/ckeditor5/package.json`), and
  `tooltipmanager.ts` and `emojigridview.ts` are byte-identical between CKE
  tags v48.0.1 and v48.2.0 (VERIFIED by fetching both from
  ckeditor/ckeditor5 via `gh api` and diffing; empty diff). CKE balloons use
  class `ck-tooltip`, so the removed `.tooltip` blanket sweep never touched
  them either way.

- RULED OUT: a Bootstrap upgrade regression. Bootstrap stayed on 5.3.x
  across the boundary; only `@types/bootstrap` moved (5.2.10 to 5.2.11).

- NOT APPLICABLE: the earlier stuck-tooltip fix for issue 10567
  (non-delegated trigger remounted while shown) is already in place at
  `hooks.tsx:1183-1187` and does not cover delegated per-span instances,
  which is exactly the gap here.

- No existing fix in flight: no PR or branch found targeting 10680
  (`gh pr list --repo TriliumNext/Trilium --search "tooltip"` and
  `git log --all --since=2026-07-01 --grep=10680`).

## Smallest fix (sketch only - no source edited)

Fix at the shared hook so every delegated `useStaticTooltip` user (icon
picker, code MIME type list, ...) is covered, including the scroll-away
trigger. Inside the `useStaticTooltip` effect in
`apps/client/src/widgets/react/hooks.tsx`, for delegated configs only, track
which delegate spans currently show a popup (Bootstrap component events
bubble, `node_modules/bootstrap/js/src/dom/event-handler.js:269-282`, so the
container hears them) and dispose instances whose trigger has left the DOM,
detected with a MutationObserver on the container:

```ts
// Delegated triggers can be unmounted while their tooltip is shown (the icon
// grid re-renders under the pointer as the user types a search); no
// mouseleave ever reaches the detached span, so its popup would stand until
// reload (10680). Watch the container and put orphans away on detach.
let delegateObserver: MutationObserver | undefined;
if (config?.selector) {
    const shownDelegates = new Set<Element>();
    const track = (e: Event) => { if (e.target instanceof Element && e.target !== element) shownDelegates.add(e.target); };
    const untrack = (e: Event) => { if (e.target instanceof Element) shownDelegates.delete(e.target); };
    element.addEventListener("inserted.bs.tooltip", track);
    element.addEventListener("hidden.bs.tooltip", untrack);
    delegateObserver = new MutationObserver(() => {
        for (const target of shownDelegates) {
            if (!target.isConnected) {
                // dispose() also removes the shown popup; the 37474
                // pending-callback crash is handled by the patch above.
                Tooltip.getInstance(target)?.dispose();
                shownDelegates.delete(target);
            }
        }
    });
    delegateObserver.observe(element, { childList: true, subtree: true });
}
// ... and in the cleanup: delegateObserver?.disconnect();
// (plus removeEventListener for the two tracking handlers)
```

Notes on the sketch:

- `Tooltip.getInstance(target)` still resolves after detach because Bootstrap
  keeps instance data keyed on the element object, and `dispose()` removes a
  currently-shown popup (same property the 10567 fix at `hooks.tsx:1183-1187`
  relies on). The existing `Tooltip.prototype.dispose` patch at
  `hooks.tsx:1032-1044` already guards the pending-callback crash.
- As a belt-and-braces fallback, the same loop can remove
  `document.getElementById(target.getAttribute("aria-describedby"))` when no
  instance is found.
- The existing scoped unmount sweep at `hooks.tsx:1200-1207` stays as is; it
  handles the "container unmounts while a still-attached child shows a
  popup" case, which the observer does not need to.

A one-surface alternative (an effect on `[filteredIcons]` in IconPicker.tsx
that sweeps orphans) would be smaller in line count but misses the
scroll-away trigger and any other delegated user of the hook; the hook-level
fix is the right minimal scope.

## Regression test approach (sketch)

`apps/client/src/widgets/react/hooks.spec.tsx` already has the exact harness
pattern for this class of bug (the 10567 test,
"removes a shown tooltip popup when the trigger element is remounted",
lines 116-156). Add a delegated variant:

```tsx
function DelegatedHarness({ generation }: { generation: number }) {
    const ref = useRef<HTMLDivElement>(null);
    useStaticTooltip(ref, { selector: "span", animation: false,
        title() { return this.getAttribute("title") || ""; } });
    return <div ref={ref}><span key={generation} title="smile" /></div>;
}

it("removes a delegated tooltip popup when its trigger span is replaced (10680)", async () => {
    await act(async () => render(<DelegatedHarness generation={1} />, container));
    const span = container.querySelector("span")!;
    // Delegated instances are created lazily on the first hover.
    act(() => { span.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true })); });
    act(() => { Tooltip.getInstance(span)?.show(); });
    expect(document.querySelector(".tooltip")).not.toBeNull();

    // Re-render with a new key, as the icon grid does when the search text
    // changes under the pointer; no mouseleave ever reaches the old span.
    await act(async () => render(<DelegatedHarness generation={2} />, container));
    await act(async () => { await Promise.resolve(); }); // let the MutationObserver run

    expect(document.querySelector(".tooltip")).toBeNull();
});
```

Two mechanics to verify while implementing (jsdom/happy-dom quirks): whether
the synthetic mouseenter reaches Bootstrap's delegated listener in the test
DOM (the 10567 test sidesteps this by calling `show()` on the instance; the
delegated test can do the same after `getOrCreateInstance(span, ...)`), and
whether MutationObserver callbacks need a `queueMicrotask` flush helper.
Run with the client test suite, e.g.
`pnpm --filter @triliumnext/client test -- hooks.spec`.

## What was verified vs inferred

VERIFIED (by reading code at 372a749ff2 or running the shown commands):
- Issue thread content and labels.
- Delegated tooltip config, grid virtualization, keyed span cells, search
  wiring (IconPicker.tsx lines cited above).
- Bootstrap 5.3 delegated-instance creation, body-appended popup,
  aria-describedby stamping (tooltip.js lines cited above).
- v0.103.0 blanket sweep vs v0.104.0 scoped sweep, and commit 95b244e0c6 as
  the change, contained in v0.104.0 only.
- Emoji feature presence in both 0.103.0 and 0.104.0 toolbars; ckeditor5
  48.0.1 -> 48.2.0 across the boundary with tooltipmanager.ts and
  emojigridview.ts identical between those CKE tags.
- CKE TooltipManager heal paths (tooltipmanager.js lines cited above; the
  installed node_modules copy is CKE 46.0.0 and stale relative to
  package.json 48.4.0, so the heal-path lines were additionally confirmed
  against the fetched v48.2.0 source, which matches).
- No existing PR/branch fixing 10680.

INFERRED (not run in a GUI):
- That the video shows the note icon picker, not the CKEditor emoji balloon.
  The phrase "selecting an emoji for a note", the restart-persistence, and
  the 0.104.0 boundary all triangulate to the icon picker, but I could not
  watch the video or run the app.
- That preact + react-window replaces (rather than mutates in place) the
  hovered span when `key={id}` changes. This is standard keyed-reconciliation
  behavior but was not observed live.
- That no other event path removes the orphaned popup at runtime. The code
  search found none, but only a live session proves a negative.

## Remaining for a human (live repro checklist)

1. Run 0.104.x (or current main) desktop or web. Open a note, click the note
   icon button, hover an icon until the tooltip shows, then type in the
   search field. Expected per this analysis: tooltip freezes on screen.
2. Close the picker, click around, switch notes. Expected: tooltip persists
   (this is the 0.104 signature; on 0.103.x it disappears when the picker
   closes).
3. In devtools: `document.querySelectorAll(".tooltip")` should show the
   orphan popup as a direct child of `body`, and its former trigger span
   should not be in the document.
4. Optional cross-check of the ruled-out surface: text note, toolbar emoji
   button, hover an emoji tile, type in its search. If a balloon sticks,
   confirm that Escape or clicking into the note text clears it (heal paths
   above); if it also survives those, my surface attribution needs revising.
5. Watch the issue video to confirm which picker is shown.

## Key commands run (all read-only)

```bash
gh issue view 10680 --repo TriliumNext/Trilium --json title,body,labels,comments
git -C ~/dev/trilium show v0.103.0:apps/client/src/widgets/react/hooks.tsx
git -C ~/dev/trilium show v0.103.0:apps/client/src/widgets/note_icon.tsx
git -C ~/dev/trilium show v0.104.0:apps/client/src/widgets/note_icon.tsx
git -C ~/dev/trilium log v0.103.0..v0.104.0 -S 'aria-describedby' -- apps/client/src/widgets/react/hooks.tsx
git -C ~/dev/trilium show 95b244e0c6 -- apps/client/src/widgets/react/hooks.tsx
git -C ~/dev/trilium diff v0.103.0 v0.104.0 -- packages/ckeditor5/package.json
gh api "repos/ckeditor/ckeditor5/contents/packages/ckeditor5-ui/src/tooltipmanager.ts?ref=v48.0.1"   # and v48.2.0, diffed: identical
gh api "repos/ckeditor/ckeditor5/contents/packages/ckeditor5-emoji/src/ui/emojigridview.ts?ref=v48.0.1"  # and v48.2.0, diffed: identical
gh pr list --repo TriliumNext/Trilium --search "tooltip" --state all
```

No Trilium source was modified; no branches, refs, or GitHub state were
created or changed.

## Live repro results (2026-08-17)

Environment: Trilium at upstream/main `964e23ec56` (implicated files unchanged
since `372a749ff2`), dev server (`tsx src/main.ts`, web client) on Linux
(Fedora, kernel 7.0.12), headless Chromium driven by Playwright, fixture DB
copy, no auth. Script: `repro/repro10680.js` in this directory.

**REPRODUCED, exactly as predicted.** Sequence and observations:

1. Open note, open icon picker, hover a tile: one `.tooltip` popup appears as
   a direct child of `body` ("pear / Icon pack: Boxicons").
2. Type "arrow" in the picker search box: the popup persists and its trigger is
   gone - the `[aria-describedby]` back-reference resolves to no element in the
   document (`triggerStillInDom: false`).
3. Press Escape (picker closes), click elsewhere: popup still present in
   `body` at its original position.

This confirms the RULED IN root cause live (delegated per-span Bootstrap
tooltip orphaned by the react-window re-render; scoped unmount sweep cannot
reach it). Steps 1-3 of the "Remaining for a human" checklist are done; still
open: watching the issue video (step 5) and the optional CKEditor emoji
cross-check (step 4).
