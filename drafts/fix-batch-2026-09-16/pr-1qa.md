## Why

A menu of the shared Preact `Dropdown` (`apps/client/src/widgets/react/Dropdown.tsx`) that is open when its `disabled` prop turns true stays open. An outside click, Tab and Escape do not close it, and its items stay clickable until the toggle is enabled again or the component unmounts.

Root cause: `Dropdown` passed `disabled` directly to the toggle button, and Bootstrap 5.3.8 cannot close a menu whose toggle is disabled. In `bootstrap/js/src/dropdown.js`, `hide()` returns early on `isDisabled(this._element)`, and `clearMenus()` and the Escape keydown handler find toggles with `[data-bs-toggle="dropdown"]:not(.disabled):not(:disabled)`.

I reproduced this in the app with the note icon picker (`note_icon.tsx` to `IconPicker` to `Dropdown`): open the picker, then change the same note to `viewMode: "source"`. From a code read only, the LLM chat model selector (`ChatInputBar.tsx`, `disabled={chat.isStreaming}`) can also reach it when the user clicks Send with the model menu open. I did not drive that path because it needs a configured LLM provider.

There is no upstream issue for this defect. It came from the review of the fix for issue 11163 (PR 11279), so the title has no closing keyword.

## What

- A `useLayoutEffect` keyed on `[disabled, shown]` calls the public `hide()` of the Bootstrap instance when `disabled && shown`.
- The toggle gets `disabled={disabled && !shown}`. The attribute stays off while the menu is open, so `hide()` passes the Bootstrap guard. `hide.bs.dropdown` then runs the existing `onHidden` path, and the next render applies `disabled`. The layout effect runs before paint, so the toggle never paints enabled.
- The `forceShown` mount effect skips a disabled dropdown, so `shown` cannot become true without an open menu.
- Behavior does not change for a closed menu or an enabled toggle. No consumer changes.

## Validation

- Red, test added and fix absent: `pnpm --filter client test Dropdown.spec` gave 1 failed, 9 passed (`hide()` expected 1 call, got 0). `pnpm --filter client test Dropdown.tooltip` gave 1 failed, 2 passed (the menu kept `.show`).
- Green on the final head: `pnpm --filter client test Dropdown` gave Test Files 3 passed (3), Tests 15 passed (15).
- The `forceShown` assertion fails without the `!disabled` guard (`show()` called 1 time) and passes with it.
- `pnpm typecheck`: "No errors found."
- `pnpm --filter client test note_icon.spec IconPicker.spec NodePanel.spec`: Test Files 3 passed (3), Tests 43 passed (43).
- `pnpm dev:format-check` fails across the tree before this change. It reports 0 problems in the three changed files.
- Patch coverage of the first commit: 100% of changed lines and branches in `Dropdown.tsx`, from an lcov run limited to that file.
- Live A/B in headless Chromium against `apps/server` with a scratch copy of the fixture database, on the note icon picker. Without the fix, the menu stayed open after the `viewMode` change, an outside click and Escape (`openMenus: 1`, `toggleDisabled: true`). With the fix, the menu closed on the `viewMode` change (`openMenus: 0`, `aria-expanded="false"`, `toggleDisabled: true`).
- Claude review of the exact diff: verdict ship. It found one latent regression (`forceShown` with `disabled` left the toggle enabled), which the second commit fixes with a test. Three comment findings are applied. The finding about the closing keyword is answered in "Why".
- Cross-vendor review of the exact diff: Codex was not available (`gpt-5.6-sol` is refused for this account and the `gpt-5.6-terra` quota is used up), so I ran NVIDIA Nemotron 3 Ultra through opencode in read-only mode. It reported no findings.

## Scope

- One source file and two existing spec files. Only the public Bootstrap API is used.
- Not changed: a consumer that passes `buttonProps={{ disabled: true }}` or a `disabled` class in `buttonClassName` can still get the old behavior. No consumer does this today, and the doc comment of the `disabled` prop now says so.
- New visible effect: `onHidden` of a consumer now fires when `disabled` turns true with the menu open. For `IconPicker` this closes the picker, which is the wanted result.
- Not verified: the LLM chat Send path and its microtask order. The ribbon note-type dropdown, `EmbeddedNotePane` and the mind map `NodePanel` were read, not driven.

_claude-fable-5-1-high on behalf of matt wilkie_

🤖 Generated with [Claude Code](https://claude.com/claude-code)
