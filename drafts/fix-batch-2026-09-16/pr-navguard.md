## Why

When the app address has a query string before the hash, browser Back and Forward change the address but not the note. I reproduced this with `http://127.0.0.1:37902/?desktop`: after I opened note A, then note B, then pressed Back, the address showed note A but the active note stayed B. A fresh load of such an address also ignores the note in the hash.

Root cause: the external-link guard in `parseNavigationStateFromUrl()` (`apps/client/src/services/link.ts`, added by a5ba1b0489) accepts a full URL only if it contains the literal `/#root` or `/#?searchString`, or if it is an `extraWindow` URL. `TabManager.setCurrentNavigationStateToHash()` writes the hash with `history.pushState(null, "", hash)`, which keeps the pathname and the query. An app opened with `?desktop`, `?mobile` (the overrides that `getDevice()` reads) or a standalone environment query such as `?safeMode=1` has an address of the form `https://host/?desktop#root/<id>`. A reverse-proxy sub-path without a trailing slash gives `https://host/trilium#root/<id>`. The guard rejects both forms, so the `hashchange` handler in `app_context.ts` and `TabManager.loadTabs()` get `{}` for the app's own `window.location.href`.

Possibly related to issue 9942 (Back button does nothing). I did not confirm that link, so the title has no closing keyword.

## What

- `parseNavigationStateFromUrl(url, location: UrlParts = window.location)` takes an optional location, as `calculateExtraWindowUrl()` already does. No caller changes.
- The guard keeps all earlier acceptances and adds one: the URL is internal if `isSameDocumentUrl()` is true. This new helper drops the hash, then compares the remainder with `${protocol}//${host}${pathname}${search}` as plain strings. The query string must match (update after Greptile's review), so a link such as `?print#root/...` in note content is still an external page load. It does not call `new URL()`, so a schemeless input cannot throw.
- A URL with a different origin or a different pathname still returns `{}`, whatever its hash contains.
- A second commit adds a doc comment for the `location` parameter and makes the default-location test use a literal address.

## Validation

- `pnpm --filter client test link.spec` without the fix (final spec, `link.ts` at base content): `Tests 2 failed | 112 passed (114)`. Both new tests fail with `expected {} to match object { notePath: 'root/WWaBNf3SSA1b', ... }`. A scratch run with `expect.soft` showed that all 5 positive assertions fail without the fix. The 2 negative assertions pass before and after the fix, so they guard against regressions only.
- `pnpm --filter client test link.spec` with the fix: `Test Files 2 passed (2)`, `Tests 114 passed (114)`.
- On the final head eb9ca5b5b6: `pnpm --filter client test link.spec tab_manager.spec note_tooltip.spec link_embed.spec` gives `Test Files 5 passed (5)`, `Tests 182 passed (182)`. `pnpm typecheck` gives `No errors found.`
- `pnpm dev:format-check` fails on the base also (about 61000 problems in the repository). It reports no problem on a changed line.
- Coverage: `pnpm --filter client test link.spec --coverage --coverage.reporter=lcov`, then the `analyzing-coverage` script, gives `src/services/link.ts` lines 100% (256/256), functions 29/29. The only uncovered branch lines (261-263) are not part of this change.
- Live A/B check with headless Chromium on a scratch server (fixture database, `?desktop` address). With the fix, Back returns to note A (address and active note agree). Without the fix, the address changes to note A but the active note stays B.
- Claude review of the exact diff: verdict "ship", 1 minor and 3 nit findings. The 2 style nits (doc comment, literal test address) are fixed in the second commit. The other 2 are recorded in Scope below.
- Cross-vendor review of the exact diff: Codex was not available (`gpt-5.6-sol` is refused for this account and the `gpt-5.6-terra` quota is used up), so I ran NVIDIA Nemotron 3 Ultra through opencode in read-only mode. It reported no findings.

## Scope

- The same guard also serves about 10 call sites that pass link addresses from note content (`goToLink()`, `linkContextMenu()`, `note_tooltip.ts`, and others). An absolute link in a note that points to the app's own origin and pathname with a note-path-shaped hash (for example `https://host/#Overview`) was external before and is now parsed as a note path. I think this is correct for a link to the app's own document, and it needs an exact origin and pathname match. The alternative is to pass `window.location` only from `app_context.ts` and `tab_manager.ts`; I can change to that if preferred.
- The two literal checks (`/#root`, `/#?searchString`) stay on purpose, so no URL that was accepted before changes meaning. They do not compare the origin. That behavior is older than this change and I did not change it.
- Desktop (`trilium-app://app/`) and in-note `#root/...` links were not affected and do not change.
- Not checked live: the fresh-load path (`loadTabs()`) and the slash-less sub-path. Only the unit spec covers them. If a slash-less sub-path occurs depends on the reverse-proxy setup; the query-string case is the solid one.

_claude-fable-5-1-high on behalf of matt wilkie_

🤖 Generated with [Claude Code](https://claude.com/claude-code)
