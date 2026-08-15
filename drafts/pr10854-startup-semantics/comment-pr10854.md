I read the current implementation (main at 372a749ff2) to check the "mutually exclusive" sentence. Observed behavior:

- A script note can carry several `#run` labels, one value per label. Attributes have no per-note name uniqueness (`packages/trilium-core/src/assets/schema.sql`, attributes table), and each event queries its own value independently, so a note with both `#run=frontendStartup` and `#run=mobileStartup` fires in both contexts. Separate script copies are not needed.
- A comma-separated list inside a single label, such as `#run=frontendStartup,mobileStartup`, matches nothing: lookup is an exact value match (`packages/trilium-core/src/services/attributes.ts`, `getNotesWithLabel`).
- Per startup, the two frontend values are exclusive at the event level: the client requests exactly one set, `mobileStartup` when the mobile layout is active, otherwise `frontendStartup` (`apps/client/src/services/bundle.ts` `executeStartupBundles`; `packages/trilium-core/src/routes/api/script.ts` `getStartupBundles`). So `frontendStartup` does not fire on the mobile frontend, and `mobileStartup` does not also pull in `frontendStartup` scripts.

Smallest fix: replace the last sentence of the `run` row with something like:

> A script note may have several `#run` labels, one value per label; each event matches its value exactly, so adding both `#run=frontendStartup` and `#run=mobileStartup` covers desktop and mobile with a single note. A comma-separated list in one label value does not match anything. On the mobile layout only `mobileStartup` fires; `frontendStartup` does not.

Verified by reading the code paths above; I did not runtime-test on a mobile device. That may also explain the original confusion in No.10853: the two-label form is the supported one, and if it still does not run, the note must be of type Code: JS frontend. A JS backend note produces a wrong-environment toast/log, while other note types are skipped silently (`packages/trilium-core/src/services/script.ts`, `getScriptBundleForFrontend`).

_claude-fable-5-high on behalf of matt wilkie_
