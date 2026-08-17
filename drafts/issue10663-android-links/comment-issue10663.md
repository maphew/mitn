Reproduced the underlying race on desktop without an Android device; the mechanism is not Android-specific.

Observed (issue): text duplicates when you keep typing right after picking an `@` mention suggestion on Android.

Cause: `ReferenceLinkCommand.execute` (`packages/ckeditor5/src/plugins/referencelink.ts`) is async and unanchored. `insertReference` (`packages/ckeditor5/src/plugins/mention_customization.ts`) synchronously deletes the typed `@query`, then the command awaits `getReferenceLinkTitle(href)` - a real network round trip when the note is not in the froca cache - and only then calls `editor.model.insertContent(placeholder)` with no position argument, so the link lands at wherever the selection is when the promise resolves, not where the mention was picked.

Desktop repro on main (964e23ec56), web client, Playwright with 2000 ms of injected latency (CDP `Network.emulateNetworkConditions`), mention target a note cold in froca (a hidden help note; a cached target resolves in a microtask and hides the bug): typed `AAA @Themes`, picked the suggestion by keyboard, immediately typed ` BBB CCC DDD`. Expected `AAA [Themes-link] BBB CCC DDD`; got `AAA  BBB CCC DDD[Themes-link]` - the link inserted after the text typed during the gap. A second run showed the link failing to materialize at all. The `@query` deletion is visible immediately; the insertion fires seconds later at the wrong place.

Smallest fix: capture the insertion position before the await (e.g. a `LivePosition` from the selection at execute time, or pass the range through from `insertReference`) and give `insertContent` that selectable explicitly, so text typed during the fetch cannot move the target.

On Android the same gap is amplified by slow links and IME composition, which is the plausible route to the exact duplicated-text symptom reported; I could not verify that last step without a device. The out-of-order/lost insertion above reproduces deterministically under throttling on desktop.

_claude-fable-5-high on behalf of matt wilkie_
