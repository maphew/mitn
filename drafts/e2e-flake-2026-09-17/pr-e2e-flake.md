## Why

The E2E test "Can duplicate note with broken links" (`packages/trilium-e2e/src/duplicate.spec.ts`) fails all four attempts in 28 of the 138 Playwright runs completed since 2026-09-14T16:19Z. Six of those runs are on `main`; the others are on branches of several contributors. Most failures are in "Standalone E2E tests on linux-arm64", a few on linux-x64. The test fails in none of the 102 runs before that time. The error is always the same:

```
Error: locator.click: Test timeout of 30000ms exceeded.
  - waiting for locator('.tree-wrapper').getByText('Note map').first()
    - locator resolved to <span tabindex="0" class="fancytree-title">Note Map</span>
    - element is not visible
```

The cause is in the test, not in the app:

- `getByText("Note map")` is a case-insensitive substring match. It also finds the two "Note Map" rows of the `_hidden` subtree (`_globalNoteMap` and `_lbNoteMap`). Those rows are in the tree's DOM from the first render, and CSS hides them.
- The "Note map" row that the test wants appears only after the tree expands the path from the URL hash.
- Playwright resolves `.first()` to an element once, and then retries the click on that same element while it stays attached. When the locator resolves before the path expands, it holds a hidden "Note Map" row for the full 30 s. The right row becomes visible a few seconds in, but the click never looks again.
- Before 0984df34ce (PR 11492), `waitUntil: "networkidle"` in `App.goto()` kept the click back until the tree had loaded. The standalone leader tab now answers API calls in-page, so the network is idle about 1.1 s after navigation with no tree row rendered. After that, the speed of the runner decides the race. The first failure in CI is on the `feature/standalone_performance` branch, 2026-09-14T16:19Z.

## What

One changed line: `getByText("Note map", { exact: true })`. With an exact match the locator finds nothing until the right row exists, so Playwright waits for it. "Note Map" and "Note map (dup)" no longer match.

## Validation

I reproduced the failure against a standalone preview build (`TRILIUM_INTEGRATION_TEST=memory`) with the steps of the spec, in a fresh browser context for each run, with CDP `Emulation.setCPUThrottlingRate`:

| CPU throttle | locator | result |
|---|---|---|
| 1x | inexact | 3 of 3 pass |
| 6x | inexact | 0 of 3 pass, same error and call log as CI |
| 20x | inexact | 0 of 3 pass |
| 6x | exact | 3 of 3 pass |
| 20x | exact | 3 of 3 pass |

- In every failed run the final state of the page is correct: "Note map" is active and visible in the tree. Without the early click, the row becomes visible after 5 s at 12x and after 7 s at 20x.
- At 1x, 6x and 20x the network is idle 1.1 s to 1.4 s after navigation, and the tree has 0 rendered rows at that moment.
- The real spec on this branch, against the same preview server, unthrottled: passed in both of its runs (`pnpm --filter standalone e2e` with `--retries 0`).
- I did not run the server E2E project. The fixture database is the same for both projects, and it contains exactly one note with the title "Note map".
- Cross-vendor review of the exact commit: NVIDIA Nemotron 3 Ultra through opencode, read-only. It checked the fixture titles and reported "No findings".

## Scope

- I looked at the other tree locators in `packages/trilium-e2e`. Only this one combines an inexact match with `.first()`. The others have no `.first()`, so an ambiguous match there stops with a strict-mode error and cannot hold a hidden row silently.
- `waitUntil: "networkidle"` in `App.goto()` no longer waits for the app to load in the standalone project. Other specs can depend on it in less visible ways. A load signal from the app would be a more general fix, but that is a design decision for a different change.

_claude-fable-5-1-high on behalf of matt wilkie_

🤖 Generated with [Claude Code](https://claude.com/claude-code)
