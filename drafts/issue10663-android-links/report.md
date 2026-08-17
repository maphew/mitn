# Triage report: Trilium issue 10663 - Android duplicated note-link text

Bead: mitn-5kv.2. Status: partial (code-side triage complete; device reproduction
remains for a human). Trilium source read at upstream/main `372a749ff2`.
Produced by a sonnet subagent in workflow wf_bea57cbe-8a8, 2026-08-15; persisted
by the orchestrator because the subagent harness blocks report-file writes.

## Issue state

- Still OPEN, unassigned, zero comments since filing 2026-07-25
  (`gh api repos/TriliumNext/Trilium/issues/10663` -> assignees `[]`, state `open`;
  labels: Difficulty: Easy, State: Triage, mobile, UI).
- No PR references it and no in-flight fix found (`gh pr list` searches for
  "10663", "mention reference link android", "duplicat mention", "referenceLink"
  returned nothing relevant; PRs 10393 ckeditor bump and 10149 test-coverage are
  unrelated).
- No upstream comment drafted, per task branch for the open/unassigned case.

## Key structural finding

Desktop and mobile share identical CKEditor config and plugins - mobile only
swaps toolbar chrome (`mobile_editor_toolbar.tsx`, `mobile_layout.tsx`;
`find apps/client/src -iname '*mobile*'` shows no mobile-specific text-insertion
path). So this is a shared-code race that Android conditions amplify, not an
Android-only code path.

## Ranked hypotheses

### H1 PRIMARY - unanchored async insertion race (high confidence, file-verified)

- `packages/ckeditor5/src/plugins/mention_customization.ts:74-83`
  (`insertReference`) synchronously deletes the typed `@query` range and
  collapses the selection, then calls the `referenceLink` command.
- `packages/ckeditor5/src/plugins/referencelink.ts:11-29`
  (`ReferenceLinkCommand.execute`) is asynchronous and unanchored: it awaits
  `glob.getReferenceLinkTitle(href).then(...)` before calling
  `editor.model.insertContent(placeholder)` with NO explicit
  selectable/position argument, so it inserts at whatever the current selection
  happens to be when the promise resolves, not the position captured earlier.
- `getReferenceLinkTitle` -> `apps/client/src/services/link.ts:622-640` ->
  `froca.getNote` -> `apps/client/src/services/froca.ts:253-273,281-291` is a
  real network round trip on a cache miss and at minimum a microtask tick even
  on a hit.
- Anything the user (or the OS IME) commits into the document during that gap
  lands exactly where the reference link is about to be inserted, producing
  interleaved/duplicated text when the user keeps typing right after picking a
  suggestion. This matches the report's framing ("doubled ... as soon as one
  resumes typing") and the detail that only the trailing word duplicates for a
  multi-word title.

### H2 SECONDARY - Android IME/composition desync (plausible amplifier, NOT file-verified)

General CKEditor-mobile knowledge, not verified in this repo: ckeditor5 48.4.0
is an external npm dependency (no node_modules in this checkout), so its
DOM-mutation-observer source was not read. Android Chrome's IME composition
commit can desync from a model-level text deletion performed by application
code rather than a real beforeinput/compositionend event, and CKEditor's engine
leans more heavily on DOM-mutation reconciliation on Android. A plausible
amplifier of H1's symptom on that platform, not independently confirmed.

### H3 WEAK - marker-range staleness under allowSpaces:true

`packages/ckeditor5/src/plugins/mention/trilium_mention_ui.ts` (`_onTyped`
lines 226-262, execute handler lines 371-409) derive the replace-range from
live document positions rather than a frozen snapshot
(`apps/client/src/widgets/type_widgets/text/config.ts:294-329` registers the
`@` feed with `allowSpaces: true` at line 325). Reads as a variant framing of
the same H1 race rather than an independently actionable defect.

## What remains for a human

1. **No-device fastest check (targets H1 directly):** in the desktop/web
   client, DevTools -> Network -> throttle to Slow 3G (or use a note title cold
   in the froca cache), type `@` + title, pick the suggestion, then immediately
   keep typing for ~1s. If duplication reproduces under artificial delay, H1
   alone suffices and no Android-specific mechanism is required.
2. **Full Android repro protocol:**
   1. Install a CURRENT nightly APK (not `apk-nighlty-260723` from the report,
      dated 2026-07-23): `gh run list --repo TriliumNext/Trilium --workflow
      nightly-build --limit 5`, grab the Android artifact from the latest
      successful run.
   2. Use the same local+server sync setup as the report if possible, else
      standalone.
   3. Type `@` + a single-word note title cold in the froca cache, select the
      suggestion, keep typing 3-5 characters immediately without pausing.
   4. Repeat with a multi-word title to check whether only the trailing word
      duplicates (the issue's second example).
   5. Capture per attempt: what duplicates; the note's raw exported HTML
      (Export -> single HTML) to distinguish H1's duplicate-text-node signature
      from H2's IME-resurrection signature; `adb logcat -s chromium:V
      CapacitorWebView:V` around the glitch if reachable over adb; whether
      airplane-mode toggling or throttling mid-test changes reproducibility
      (worse under a slow link is a clean H1 signature); device model, Android
      version, and keyboard app (IME behavior varies by keyboard, relevant to
      H2).
3. Report back reproduced yes/no plus whether the desktop throttling repro also
   reproduces it, to settle whether H1 alone explains the report.

## Live repro results (2026-08-17): H1 CONFIRMED on desktop, no device needed

Environment: Trilium at upstream/main `964e23ec56` (referencelink.ts /
mention_customization.ts unchanged since `372a749ff2`), dev server (web
client) on Linux, headless Chromium via Playwright, fixture DB copy, 2000 ms
artificial latency via CDP `Network.emulateNetworkConditions`. Scripts:
`repro/repro10663.js`, `repro/repro10663b.js`.

Protocol refinements that mattered:

- The mention target must be COLD in froca. A note visible in the tree, or
  one whose reference link is already rendered in any open note, is cached,
  and `getReferenceLinkTitle` resolves in a microtask - no gap, no race.
  Hidden help notes (e.g. `_help_Wy267RK4M69c` "Themes") stay cold.
  Coldness was asserted in-page (`glob.froca.notes[id]` undefined) and the
  fetch observed as a throttled `POST /api/tree/load` fired at pick time.
- Pick the suggestion by keyboard (ArrowDown+Enter). Mouse clicks on the
  balloon row intermittently failed to register under throttle.

**Result (typed `AAA @Themes`, picked the note, immediately typed
` BBB CCC DDD` inside the 2 s gap):**

- Expected: `AAA [Themes-link] BBB CCC DDD`
- Got (settled state): `AAA  BBB CCC DDD[Themes-link]` - the reference link
  was inserted at the CURRENT caret position when the title fetch resolved,
  after all text typed during the gap, not at the position where the mention
  was picked. Intermediate DOM dumps show the `@query` text deleted
  immediately and the link materializing only ~4-5 s later.
- A second run (target "Zen mode") showed the harsher variant: the `@query`
  was deleted and the link never visibly materialized at all.

This is H1's mechanism reproduced end-to-end: `ReferenceLinkCommand.execute`
awaits the title with no position anchor and inserts at whatever the
selection is at resolve time. On desktop the misplacement is clean
(text/link out of order, or the link lost); the report's exact
duplicated-text symptom plausibly needs H2's Android IME composition on top,
which still needs a device.

Remaining for a human: only the Android confirmation of the duplication
symptom itself (protocol above). The mechanism no longer needs confirmation.
