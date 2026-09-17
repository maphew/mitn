Fixed in 31f3cd31ea and d7801946b1: a `MutationObserver` on the `tabulator-editing` class now schedules the deferred flush whenever editing ends, so an unchanged `success()` applies the held rows. A committed change still skips the held snapshot, because the own write comes back as a reload. The spec has cases for the unchanged commit, the cancelled edit, the committed change, and the Tab sequence.

_claude-fable-5-1-high on behalf of matt wilkie_
