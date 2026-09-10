# Contributor guidance: core features or extensions

Research date: 2026-09-10. Upstream: `TriliumNext/Trilium`, `main` at [`5d0bff15f8e02e779a249078973e5c17a82ae7ef`](https://github.com/TriliumNext/Trilium/commit/5d0bff15f8e02e779a249078973e5c17a82ae7ef). Work: `mitn-dtc`. This is contributor research and a proposed documentation change, not an upstream policy decision.

## Recommendation

Improve the visibility and usefulness of the existing `CONTRIBUTING.md`. Keep it as the single home for the core-versus-extension decision. Add a short decision aid under **Features**, a pointer near **Before you start**, and links from the feature-request form and agent instructions. The [draft](../drafts/core-extension-guidance/contributing-draft.md) contains the proposed wording and exact insertion points.

The rule already exists. [The contributor guide](https://github.com/TriliumNext/Trilium/blob/5d0bff15f8e02e779a249078973e5c17a82ae7ef/CONTRIBUTING.md#features) says specialized needs that fit scripts or custom widgets are likely to be declined as core features. It also cautions against single-use settings and their maintenance cost. [Before you start](https://github.com/TriliumNext/Trilium/blob/5d0bff15f8e02e779a249078973e5c17a82ae7ef/CONTRIBUTING.md#before-you-start) requires maintainer feedback before coding a feature of any size. Bug fixes and documentation changes can go directly to a PR. These are explicit requirements, not deductions from closed PRs.

The guide merged through [TriliumNext/Trilium PR 11064](https://github.com/TriliumNext/Trilium/pull/11064) on August 18, 2026. That was the guide proposed from this coordination repository. A new charter would duplicate it and risk conflicting advice.

## What the recent closures establish

Both cases below closed without merging on September 6, 2026. The closing comments explicitly name an extension route.

| Proposal | Maintainer response | Implication for guidance |
|---|---|---|
| Mouse-wheel tab switching, [PR 11102](https://github.com/TriliumNext/Trilium/pull/11102#issuecomment-5561567307) | Elian preferred a custom script and supplied an untested draft. He also raised concerns about making the interaction a default. | A small interaction change with a linked feature request still needs agreement on product fit. |
| Open notes at the bottom with an `openAtBottom` label, [PR 10308](https://github.com/TriliumNext/Trilium/pull/10308#issuecomment-5561466317) | Elian preferred a custom widget and supplied an untested draft that would need adjustment. | A specialized workflow can belong in a user extension even when implemented as an opt-in label. |

These are evidence of the intended location for those features. They do not prove that the sample scripts work or cover every behavior in the PRs. No sample script was run in this research. The decision aid therefore asks authors to test scripts and describe missing APIs rather than promising that scripting solves every proposal.

Nearby closures had other causes. [PR 7287](https://github.com/TriliumNext/Trilium/pull/7287#issuecomment-5561663740) was superseded by another PR. [PR 10013](https://github.com/TriliumNext/Trilium/pull/10013#issuecomment-5562274692) was declined because the About dialog was an unsuitable place to expose the sync server; [later feedback](https://github.com/TriliumNext/Trilium/pull/10013#issuecomment-5570393756) accepted that the effective configuration needed a better display. A closed PR alone does not establish that its feature belongs outside core.

## Where contributors currently miss the rule

The [source inventory](../drafts/core-extension-guidance/existing-guidance.md) records the search and pinned links. The relevant gaps are:

| Entry point | Current gap | Proposed role |
|---|---|---|
| `CONTRIBUTING.md` | Names scripts and widgets but supplies no implementation links or decision aid. | Canonical guidance, with links to existing extension documentation. |
| `.github/ISSUE_TEMPLATE/feature_request.yml` | Only asks for a feature description and additional information. | Early guidance link and an optional alternatives field. People can ask for help without writing code. |
| `CLAUDE.md` | Opens with implementation guidance without directing agents to the contributor policy. | A short pointer near the top. |
| `docs/Developer Guide/Developer Guide.md` | Links to setup and architecture; no contributor-guide link. | A contributor link before the build instructions. |
| Root README | Advertises scripting and community extensions but does not link the contributor guide. | An optional contributor entry link, through the README source workflow. |
| Scripting, widget, and render-note guides | Explain how to build extensions after that choice has been made. | Keep the technical instructions here; link to them from the decision aid. |

The Developer Guide finding is from its [current landing page](https://github.com/TriliumNext/Trilium/blob/5d0bff15f8e02e779a249078973e5c17a82ae7ef/docs/Developer%20Guide/Developer%20Guide.md). The other entry points are documented in the inventory. No PR template was found in the inspected root or `.github` paths. A new PR template could repeat the pointer, but it would reach authors after implementation. The feature form and agent entry point are the more useful first changes.

Review also found a Contributing section in `docs/index.md`. It is not the published root page: the [build entry point](https://github.com/TriliumNext/Trilium/blob/5d0bff15f8e02e779a249078973e5c17a82ae7ef/apps/build-docs/src/main.ts#L26-L28) copies a [redirect page](https://github.com/TriliumNext/Trilium/blob/5d0bff15f8e02e779a249078973e5c17a82ae7ef/apps/build-docs/src/index.html) that sends visitors to `/user-guide`. The live site confirms this. Editing that Markdown index would not improve the published entry point, so it is recorded in the inventory but excluded from the draft.

## Scope of the draft

The existing policy and the new proposed explanations are distinct. The extension preference and discuss-first rule are already official. The decision table, optional form field, API-gap route, and no-prototype-needed explanation are proposed clarifications for maintainer review. They are not an acceptance promise or a requirement that every contributor must first build an extension.

The draft uses the documentation's concrete terms: scripts, custom widgets, and render notes. It does not invent a separate plugin framework. The [Frontend Basics guide](https://docs.triliumnotes.org/user-guide/scripts/frontend-basics) already explains scripts and the UI extension choices. The [Render Note guide](https://docs.triliumnotes.org/user-guide/note-types/render-note) covers custom dashboards and note views.

Root contribution instructions and Developer Guide Markdown can be edited directly. User Guide changes must use `pnpm edit-docs:edit-docs`, as stated in [CONTRIBUTING.md](https://github.com/TriliumNext/Trilium/blob/5d0bff15f8e02e779a249078973e5c17a82ae7ef/CONTRIBUTING.md#pull-requests). No generated User Guide files or upstream source files were edited for this draft.

For the optional README pointer, edit root `README.md`. The [Sync README workflow](https://github.com/TriliumNext/Trilium/blob/5d0bff15f8e02e779a249078973e5c17a82ae7ef/.github/workflows/sync-readme.yml) regenerates `docs/README.md` as the translation base. The Developer Guide and README pointers are included as optional additions to keep the initial change small.

The local [idea-triage rubric](../docs/pr-idea-triage.md) had stale language claiming no contributor guide existed and suggesting that small features could land without discussion. This session corrects those points and labels the old merge patterns as historical. Its other historical findings were not re-audited.

## Search and validation

Searched official contribution and agent files, issue templates, README, Developer Guide, User Guide scripting/widget/render-note pages, and existing mitn research. Read the 50 most recently updated closed, unmerged PR records and then the relevant maintainer comments. Keyword searches for custom widgets and scripts did not return the two known September cases, so they were not treated as a complete inventory. This establishes two concrete examples, not an exhaustive count of similar closures.

Checked open upstream PRs with contribution/guidance/documentation terms and inspected local branch names plus recent documentation commits. No overlapping contributor-guidance change was identified. The sibling main checkout is behind upstream, so evidence was verified against the GitHub API and pinned to the commit above.

Validation: `scripts/gh-body-lint` passed on all four changed Markdown files. The draft and this report had no warnings; the inventory and historical rubric produced non-fatal line-wrap notices because the tool also checks formatting intended for GitHub comments. `git diff --check` passed. Both proposed YAML fragments parsed, and the assembled feature form preserved its original fields and kept the alternatives field optional. Six relative document links resolved, and the proposed subsection anchor matched its heading. The extension and community URLs were checked for reachability.

Independent review caught a proposed rewording that narrowed the existing decline criterion; the draft now preserves its wording and adds only a link. It also prompted explicit launch-bar widget and ETAPI routes. The index-page finding was resolved with build evidence as described above. No application code or maintainer sample scripts were executed. The `unslop` skill was unavailable locally; prose used the required direct-editing and `gh-body-lint` fallback.
