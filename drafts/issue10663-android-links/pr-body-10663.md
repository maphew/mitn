## Why

Fixes #10663. Picking an `@`-mention and continuing to type could interleave or duplicate the text around the inserted note link, reported on Android but not Android-specific.

`ReferenceLinkCommand.execute` is async: the mention command synchronously deletes the typed `@query`, then the command awaits `getReferenceLinkTitle(href)` - a real network round trip when the target note is not in the froca cache - and called `insertContent(placeholder)` with no position. The link therefore landed at wherever the caret was when the fetch resolved. Reproduced deterministically on desktop (main 964e23ec56, web client, 2000 ms injected latency, froca-cold target): typing `AAA @Themes`, picking the note, and immediately typing ` BBB CCC DDD` settled as `AAA  BBB CCC DDD[Themes-link]` - the link after the typed text - and in one variant the link never visibly materialized because the insertion context was gone. On a slow Android link the same gap, amplified by IME composition, is the plausible route to the reported duplicated text. Details in the triage comment on the issue.

## What

In `ReferenceLinkCommand.execute`:

- capture a `ModelLivePosition` (stickiness `toPrevious`) from the document selection before starting the title fetch, so text typed during the fetch lands after the anchor and the link keeps the spot where the mention was picked;
- insert the reference at that anchored position instead of the live caret;
- skip the insertion when the anchor has been transformed into the graveyard (the paragraph the user picked in was deleted while the title loaded);
- move the caret onto the link (`setSelection(placeholder, "after")`, the previous behavior) only when the selection has not moved during the fetch - a user who kept typing keeps their caret;
- detach the live position on both resolve and reject.

Every current caller executes this command with a collapsed selection: the mention pick deletes the query first, and the Add link dialog only offers the reference-link type when nothing is selected (`add_link.tsx` defaults a selection to hyper-link and hides the radio group). The anchored insertion preserves that contract; behavior with a hypothetical future non-collapsed caller is to insert before the selected text rather than replace it, which is the conservative choice.

With the fix, the same throttled protocol settles as `AAA [Themes-link] BBB CCC DDD`, verified end to end on a dev server.

## Validation

- Three new tests in `referencelink.spec.ts` under "anchored insertion during the title fetch (#10663)": link inserted at the captured position while typing continues (with the caret left where typing put it), caret still placed after the link in the no-typing flow, and no insertion when the picked context was deleted mid-fetch.
- `pnpm --filter ckeditor5 test referencelink`: 12/12 passed. `pnpm --filter ckeditor5 test mention_customization`: 6/6 passed. `pnpm typecheck`: no errors.
- Live throttled repro before/after on a dev server as described above.

## Scope

Only `packages/ckeditor5/src/plugins/referencelink.ts` and its spec. The Android-device confirmation of the original duplication symptom is still outstanding; this fixes the confirmed underlying race.
