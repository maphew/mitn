Observed while triaging idle PRs: this fix has been mostly superseded on main, but a narrower variant of the leak survives.

What changed since this PR was filed: PR 9296 (merged 2026-05-31, commit b8b535c0f2) added `sanitizeNoteContentHtml`, which `renderText` now applies to every text note before DOM insertion, with `style` in DOMPurify `FORBID_TAGS` (apps/client/src/services/sanitize_content.ts, line 53). That fixes the reported scenario, imported HTML notes restyling the tree, unconditionally rather than only when `trim` is set.

What remains: markdown notes now render through their own path, `renderMarkdown` in content_renderer.ts, which sanitizes with default DOMPurify config (line 195). Default DOMPurify keeps `<style>` unless it is the very first element of the fragment. Verified against the installed dompurify: a leading `<style>` is dropped by a parser hoist, but `<p>hi</p><style>...</style>` and `<div><style>...</style></div>` both keep the style element. So a markdown note with a non-leading raw HTML `<style>` block can still restyle the whole document from a preview. Both regression tests in this PR use a leading style block, so they would now pass on main even without the code change here.

Smallest fix as I see it: either re-apply this PR's `$renderedContent.find("style").remove()` in `postProcessRichContent` (which `renderMarkdown` also calls, so it covers the remaining path), or switch `renderMarkdown` to the strict `sanitizeNoteContentHtml` config, which also closes iframe and event-handler vectors in markdown raw HTML. The regression test should use a non-leading `<style>` block, since a leading one no longer distinguishes fixed from broken.

Remaining uncertainty: I verified the code paths and DOMPurify behavior in isolation, not the visual leak in a running build, and the installed dompurify I tested was 3.2.5 while the client pins 3.4.13.

Since the branch now conflicts with main and the surviving case needs a different test, a rebase is effectively a rework. Happy to leave that to @AllanZyne, whose approach still applies; any rework by others should credit them with Co-Authored-By.

_claude-fable-5-high on behalf of matt wilkie_
