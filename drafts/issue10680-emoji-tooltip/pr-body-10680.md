## Why

Fixes #10680. Since 0.104.0, hovering a tile in the note icon picker and then typing in its search box (or scrolling the grid) leaves the tile's tooltip stuck on screen until the app is restarted.

A delegated (`selector:`) `useStaticTooltip` config spawns a per-child Bootstrap Tooltip instance that only hides on that child's own `mouseleave`. Typing in the picker search re-renders the react-window grid and replaces the hovered span (keyed by icon id), so no `mouseleave` ever fires; the per-span instance never hides and its popup is orphaned as a direct child of `document.body`. The scoped `[aria-describedby]` cleanup sweep cannot see a trigger that already left the container, and the grid re-render never re-runs the hook's effect at all. The leak predates 0.104.0, but until 95b244e0c6 replaced the blanket `.tooltip` sweep (which had its own collateral damage) it was invisibly wiped whenever the picker closed - which is why the report starts at 0.104.0.

Reproduced live on main (964e23ec56) before the fix and verified gone after it: hover a tile, type in the search box, the popup previously survived closing the picker and everything short of a reload.

## What

In `useStaticTooltip`, for delegated configs only:

- track which delegate triggers currently show a popup via the bubbled `inserted.bs.tooltip` / `hidden.bs.tooltip` container events;
- watch the container with a `MutationObserver` (`childList` + `subtree`); a tracked trigger found disconnected has its instance disposed - `dispose()` also removes a currently-shown popup, the same property the earlier #10567 fix relies on, and the existing twbs/bootstrap#37474 dispose patch guards the pending-callback crash - with a fallback removal by `aria-describedby` id;
- disconnect the observer and listeners in the effect cleanup; the existing scoped sweep is untouched (it still covers container-unmount-while-child-attached, which the observer does not).

Fixing at the hook covers every delegated user (icon picker, MIME type list, ...) including the hover-then-scroll variant, rather than patching the icon picker alone.

## Validation

- New regression test "removes an orphaned popup when a delegated tooltip's hovered child is removed without a mouseleave (#10680)" in `hooks.spec.tsx`, driving the keyed-remount scenario with a render-stable delegated config (an inline config would re-run the effect and exercise the old sweep instead). Verified the test fails without the `hooks.tsx` change.
- `pnpm --filter client test hooks.spec`: 22/22 passed.
- `pnpm typecheck`: no errors.
- Live end-to-end check on a dev server: the repro sequence above no longer leaves a popup behind.

## Scope

Only `apps/client/src/widgets/react/hooks.tsx` and its spec. No behavior change for non-delegated tooltips.
