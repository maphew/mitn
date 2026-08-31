# Unreviewed Trilium pull requests, 2026-08-29

Snapshot: TriliumNext/Trilium had **83 open pull requests**. **43 had no
substantive review from a person other than the author.** The qualifying set
contains 23 ready human-authored PRs, 10 draft PRs, and 10 automated PRs.

The audit checked formal reviews, inline review comments, and PR conversation
comments. A conversation comment counted only when it contained testing,
findings, or design feedback. Author comments and bot activity did not count.
GitHub reports `truecourse-agent` as a user account, but this audit treated it
as automation. PR 11101 qualifies because its only other-person comment is a
request for somebody to review it, not a review.

Ratings estimate whether the specific PR will be accepted and merged. They
assume reported findings and merge conflicts are resolved. They do not assume
that maintainers accept the product scope, promote a draft, or choose this PR
over a competing implementation.

- **High:** 75% or more
- **Medium:** 40% to 74%
- **Low:** less than 40%

Ratings are intentionally absent from the GitHub review drafts.

## Likelihood report

| PR | State | Likelihood | Draft review | Main remaining factor after fixes |
|---|---|---:|---|---|
| [11241](https://github.com/TriliumNext/Trilium/pull/11241) Node.js 24.20.0 | automated | **97% High** | [Approve](../drafts/unreviewed-prs-2026-08-29/pr11241.md) | Routine LTS update; all checks pass. |
| [11240](https://github.com/TriliumNext/Trilium/pull/11240) node-abi 4.34.0 | automated | **92% High** | [Approve](../drafts/unreviewed-prs-2026-08-29/pr11240.md) | One arm64 check needs a green rerun. |
| [11239](https://github.com/TriliumNext/Trilium/pull/11239) js-yaml 5.4.0 | automated | **95% High** | [Approve](../drafts/unreviewed-prs-2026-08-29/pr11239.md) | Low-risk established dependency update. |
| [11238](https://github.com/TriliumNext/Trilium/pull/11238) webdriverio 9.31.3 | automated | **97% High** | [Approve](../drafts/unreviewed-prs-2026-08-29/pr11238.md) | Test-only patch update; all checks pass. |
| [11237](https://github.com/TriliumNext/Trilium/pull/11237) Mermaid 11.17.2 | automated | **97% High** | [Approve](../drafts/unreviewed-prs-2026-08-29/pr11237.md) | Focused upstream rendering fix; E2E passes. |
| [11236](https://github.com/TriliumNext/Trilium/pull/11236) Claude Agent SDK 0.3.246 | automated | **95% High** | [Approve](../drafts/unreviewed-prs-2026-08-29/pr11236.md) | Additive lockfile-only SDK patch. |
| [11235](https://github.com/TriliumNext/Trilium/pull/11235) reverse-proxy share links | ready | **90% High** | [Approve](../drafts/unreviewed-prs-2026-08-29/pr11235.md) | Small bug fix with direct coverage. |
| [11233](https://github.com/TriliumNext/Trilium/pull/11233) Weblate translations | automated | **94% High** | [Request changes](../drafts/unreviewed-prs-2026-08-29/pr11233.md) | Correct one false Polish license identifier. |
| [11232](https://github.com/TriliumNext/Trilium/pull/11232) large spreadsheets | ready, maintainer | **88% High** | [Request changes](../drafts/unreviewed-prs-2026-08-29/pr11232.md) | Fix two route/render test contract regressions. |
| [11226](https://github.com/TriliumNext/Trilium/pull/11226) Electron 44 | automated | **82% High** | [Request changes](../drafts/unreviewed-prs-2026-08-29/pr11226.md) | Adapt three removed Electron APIs and smoke-test platforms. |
| [11220](https://github.com/TriliumNext/Trilium/pull/11220) marked 18.0.11 | automated | **94% High** | [Approve](../drafts/unreviewed-prs-2026-08-29/pr11220.md) | One arm64 check needs a green rerun. |
| [11217](https://github.com/TriliumNext/Trilium/pull/11217) layout-elk 0.2.3 | automated | **35% Low** | [Request changes](../drafts/unreviewed-prs-2026-08-29/pr11217.md) | PR 11180 already carries the update and test repair. |
| [11211](https://github.com/TriliumNext/Trilium/pull/11211) ETAPI base64 attachments | ready | **88% High** | [Approve](../drafts/unreviewed-prs-2026-08-29/pr11211.md) | Focused API addition with round-trip coverage. |
| [11191](https://github.com/TriliumNext/Trilium/pull/11191) backend npm packages | draft, maintainer | **45% Medium** | [Comment](../drafts/unreviewed-prs-2026-08-29/pr11191.md) | Draft documents runtime loading that it does not implement and mixes broad refactors. |
| [11180](https://github.com/TriliumNext/Trilium/pull/11180) layout-elk fix | ready, maintainer | **80% High** | [Approve](../drafts/unreviewed-prs-2026-08-29/pr11180.md) | Preferred complete form of the dependency update; rebase and bundle check remain. |
| [11176](https://github.com/TriliumNext/Trilium/pull/11176) scoped quick search | ready | **84% High** | [Approve](../drafts/unreviewed-prs-2026-08-29/pr11176.md) | Backward-compatible fix with direct API coverage. |
| [11147](https://github.com/TriliumNext/Trilium/pull/11147) fork workflow guards | ready | **86% High** | [Approve](../drafts/unreviewed-prs-2026-08-29/pr11147.md) | Minimal workflow hardening; maintainer policy agreement remains. |
| [11143](https://github.com/TriliumNext/Trilium/pull/11143) saved-search action | ready | **88% High** | [Comment](../drafts/unreviewed-prs-2026-08-29/pr11143.md) | Add error-branch coverage to clear the patch gate. |
| [11142](https://github.com/TriliumNext/Trilium/pull/11142) DB-backed search properties | ready | **88% High** | [Request changes](../drafts/unreviewed-prs-2026-08-29/pr11142.md) | Make the regression fixture type-safe without changing its cold state. |
| [11141](https://github.com/TriliumNext/Trilium/pull/11141) quoted search commas | ready | **95% High** | [Approve](../drafts/unreviewed-prs-2026-08-29/pr11141.md) | Small bug fix with complete green CI. |
| [11133](https://github.com/TriliumNext/Trilium/pull/11133) Trillium discovery spelling | ready | **70% Medium** | [Approve](../drafts/unreviewed-prs-2026-08-29/pr11133.md) | Technical change is ready; wording and SEO value are subjective. |
| [11126](https://github.com/TriliumNext/Trilium/pull/11126) shared stylesheet hardening | ready, maintainer | **90% High** | [Comment](../drafts/unreviewed-prs-2026-08-29/pr11126.md) | Decide compatibility for existing non-ASCII or escaped icon keys. |
| [11125](https://github.com/TriliumNext/Trilium/pull/11125) empty-note templates | ready | **82% High** | [Request changes](../drafts/unreviewed-prs-2026-08-29/pr11125.md) | Restrict HTML-empty normalization to HTML notes. |
| [11124](https://github.com/TriliumNext/Trilium/pull/11124) interrupted LLM streams | ready | **88% High** | [Approve](../drafts/unreviewed-prs-2026-08-29/pr11124.md) | Focused protocol fix; unrelated CI failure remains. |
| [11121](https://github.com/TriliumNext/Trilium/pull/11121) search parse errors | ready | **90% High** | [Approve](../drafts/unreviewed-prs-2026-08-29/pr11121.md) | Small safety fix with direct API coverage. |
| [11120](https://github.com/TriliumNext/Trilium/pull/11120) multiple script widgets | ready | **88% High** | [Approve](../drafts/unreviewed-prs-2026-08-29/pr11120.md) | Backward-compatible scripting improvement. |
| [11112](https://github.com/TriliumNext/Trilium/pull/11112) code-note scrolling | draft, maintainer | **80% High** | [Comment](../drafts/unreviewed-prs-2026-08-29/pr11112.md) | Focused performance work; app-level restored-tab check remains. |
| [11108](https://github.com/TriliumNext/Trilium/pull/11108) Linux autostart | ready | **78% High** | [Request changes](../drafts/unreviewed-prs-2026-08-29/pr11108.md) | Parse desktop-entry field codes instead of token-dropping. |
| [11105](https://github.com/TriliumNext/Trilium/pull/11105) content-hint flicker | ready | **70% Medium** | [Comment](../drafts/unreviewed-prs-2026-08-29/pr11105.md) | Remove line-ending churn and resolve overlap with PR 11031. |
| [11102](https://github.com/TriliumNext/Trilium/pull/11102) wheel tab switching | ready | **60% Medium** | [Comment](../drafts/unreviewed-prs-2026-08-29/pr11102.md) | Stateful handler lacks coverage and default UX needs agreement. |
| [11101](https://github.com/TriliumNext/Trilium/pull/11101) board column deletion | ready | **88% High** | [Request changes](../drafts/unreviewed-prs-2026-08-29/pr11101.md) | In-memory removal intent does not cross renderer or client boundaries. |
| [11073](https://github.com/TriliumNext/Trilium/pull/11073) CardDAV script | draft, maintainer | **65% Medium** | [Comment](../drafts/unreviewed-prs-2026-08-29/pr11073.md) | Fix conditional DELETE, replacement NOTE semantics, and docs path. |
| [11031](https://github.com/TriliumNext/Trilium/pull/11031) hover-only todo hints | ready | **72% Medium** | [Approve](../drafts/unreviewed-prs-2026-08-29/pr11031.md) | Direct issue fit, but it competes with PR 11105 and lacks full CI. |
| [10977](https://github.com/TriliumNext/Trilium/pull/10977) stable block IDs | draft, maintainer | **55% Medium** | [Comment](../drafts/unreviewed-prs-2026-08-29/pr10977.md) | Navigation can consume targets before render and miss same-note changes. |
| [10951](https://github.com/TriliumNext/Trilium/pull/10951) Terra Draw map shapes | draft, maintainer | **75% High** | [Comment](../drafts/unreviewed-prs-2026-08-29/pr10951.md) | Coherent prototype; product scope and lazy-bundle cost remain. |
| [10826](https://github.com/TriliumNext/Trilium/pull/10826) plugin dev harness | ready | **68% Medium** | [Comment](../drafts/unreviewed-prs-2026-08-29/pr10826.md) | Validate port input and consider splitting unrelated harness changes. |
| [10797](https://github.com/TriliumNext/Trilium/pull/10797) attribute clipboard | draft, maintainer | **70% Medium** | [Comment](../drafts/unreviewed-prs-2026-08-29/pr10797.md) | Clear stale selection anchors after reload removal. |
| [10647](https://github.com/TriliumNext/Trilium/pull/10647) virtual notes and help | draft, maintainer | **30% Low** | [Comment](../drafts/unreviewed-prs-2026-08-29/pr10647.md) | Very broad architecture and destructive migration for a narrower need. |
| [10554](https://github.com/TriliumNext/Trilium/pull/10554) warm LLM agents | draft, maintainer | **55% Medium** | [Comment](../drafts/unreviewed-prs-2026-08-29/pr10554.md) | Failed turns can return broken sessions to the pool; cap enforcement also leaks. |
| [10553](https://github.com/TriliumNext/Trilium/pull/10553) Ollama semantic search | ready | **35% Low** | [Request changes](../drafts/unreviewed-prs-2026-08-29/pr10553.md) | Remote note disclosure and silent newest-300 truncation need product redesign. |
| [10499](https://github.com/TriliumNext/Trilium/pull/10499) scanned-PDF OCR | ready, maintainer | **55% Medium** | [Request changes](../drafts/unreviewed-prs-2026-08-29/pr10499.md) | Hybrid pages can skip OCR and page failures persist as success. |
| [10439](https://github.com/TriliumNext/Trilium/pull/10439) iOS URL scheme bridge | draft, maintainer | **40% Medium** | [Comment](../drafts/unreviewed-prs-2026-08-29/pr10439.md) | Per-navigation readiness and cancellation lifecycle remain incomplete. |
| [10329](https://github.com/TriliumNext/Trilium/pull/10329) inverse DAG view | draft | **25% Low** | [Comment](../drafts/unreviewed-prs-2026-08-29/pr10329.md) | Frozen POC, no coverage, and duplicate React keys for cloned notes. |

## Confirmed review findings

The highest-impact findings are:

- **11232:** a spreadsheet-specific response need changes the generic standalone
  string response contract, and generated row-height classes leave the current
  E2E assertion reading `NaN`.
- **11101:** the removal tombstone is module-local. A second renderer can observe
  the attachment update before the definition update and write the deleted
  column back because it has no tombstone.
- **10553:** semantic search sends note titles and bodies to any configured
  HTTP(S) Ollama URL without a separate disclosure, then silently excludes all
  but the 300 newest candidates.
- **10554:** Claude session reuse does not require successful turn completion,
  so an exception from `query.next()` can return an indeterminate session to the
  warm pool.
- **10499:** 16 embedded characters suppress OCR for a whole page, and per-page
  OCR exceptions become successful empty results that the service can persist.
- **10439:** native bridge readiness never resets for navigation, and cancelled
  tasks remain in the delivery queue.

Other actionable findings appear directly in their draft review files. Current
CI evidence was inspected for every PR. No branch was executed locally because
the source checkout was not clean and many heads are stale or conflicted; the
review used exact fetched PR objects and GitHub check logs instead.
