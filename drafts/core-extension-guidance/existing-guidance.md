# Existing core-versus-extension guidance

**Research date:** 2026-09-10

**Upstream examined:** `TriliumNext/Trilium` `main` at
`5d0bff15f8e02e779a249078973e5c17a82ae7ef` (2026-09-10 18:06 UTC).

## Finding

The project already has an authoritative core-versus-extension rule. It is in
[`CONTRIBUTING.md`](https://github.com/TriliumNext/Trilium/blob/5d0bff15f8e02e779a249078973e5c17a82ae7ef/CONTRIBUTING.md#L55-L82),
not in the User Guide. It says that a feature idea will likely be declined if
it can be made as a user script or custom widget, because specialized needs
fit there. It also requires maintainer discussion before implementation for
every feature. The same section gives core-fit constraints: shared user need,
opt-in behavior, reused components, dependency size, offline operation, and
long-term data use ([lines 27-43](https://github.com/TriliumNext/Trilium/blob/5d0bff15f8e02e779a249078973e5c17a82ae7ef/CONTRIBUTING.md#L27-L43),
[57-76](https://github.com/TriliumNext/Trilium/blob/5d0bff15f8e02e779a249078973e5c17a82ae7ef/CONTRIBUTING.md#L57-L76)).

This is an explicit project policy. The visibility findings and recommended
placement below are interpretation of the current first-party sources.

## Current entry points

| Surface | What it says | Gap relevant to the decision |
| --- | --- | --- |
| [`CONTRIBUTING.md`](https://github.com/TriliumNext/Trilium/blob/5d0bff15f8e02e779a249078973e5c17a82ae7ef/CONTRIBUTING.md#L11-L25) | Feature authors must discuss the idea before coding. The Features section gives the extension rule. | It names scripts and widgets but does not link to their guides or give a short way to choose one. |
| [Feature-request form](https://github.com/TriliumNext/Trilium/blob/5d0bff15f8e02e779a249078973e5c17a82ae7ef/.github/ISSUE_TEMPLATE/feature_request.yml#L1-L14) | Requests only ask for a description and extra information. | No link to `CONTRIBUTING.md`; no prompt to consider an existing script, widget, render note, or outside integration. |
| [`docs/index.md`](https://github.com/TriliumNext/Trilium/blob/5d0bff15f8e02e779a249078973e5c17a82ae7ef/docs/index.md#contributing) | Has a Contributing section that links only to the repository. | This file is not the current published root page, so changing it alone would not fix the live entry point. See the build evidence below. |
| [Root README](https://github.com/TriliumNext/Trilium/blob/5d0bff15f8e02e779a249078973e5c17a82ae7ef/README.md#L21-L28) | Points to online docs, in-app help, and source User Guide. It also links scripting and advanced showcases ([lines 45, 56, 63](https://github.com/TriliumNext/Trilium/blob/5d0bff15f8e02e779a249078973e5c17a82ae7ef/README.md#L45-L63)), plus third-party extensions at awesome-trilium ([lines 66-69](https://github.com/TriliumNext/Trilium/blob/5d0bff15f8e02e779a249078973e5c17a82ae7ef/README.md#L66-L69)). | It does not direct contributors to `CONTRIBUTING.md`, and it does not connect these links to the feature-request decision. |
| [Scripting guide](https://github.com/TriliumNext/Trilium/blob/5d0bff15f8e02e779a249078973e5c17a82ae7ef/docs/User%20Guide/User%20Guide/Scripting.md#L1-L15) | Explains executable JavaScript code notes and Script API, then links demonstrations and API material. | It teaches implementation after a user chooses scripting. It does not state when scripting is preferred to core. |
| [Custom Widgets](https://github.com/TriliumNext/Trilium/blob/5d0bff15f8e02e779a249078973e5c17a82ae7ef/docs/User%20Guide/User%20Guide/Scripting/Frontend%20Basics/Custom%20Widgets.md#L1-L23) | Defines widgets as scripts that render UI elements and gives creation steps. It documents Preact and legacy approaches. | It does not link back to contribution triage. |
| [Render Note](https://github.com/TriliumNext/Trilium/blob/5d0bff15f8e02e779a249078973e5c17a82ae7ef/docs/User%20Guide/User%20Guide/Note%20Types/Render%20Note.md#L1-L17) and [Launch Bar Widgets](https://github.com/TriliumNext/Trilium/blob/5d0bff15f8e02e779a249078973e5c17a82ae7ef/docs/User%20Guide/User%20Guide/Scripting/Frontend%20Basics/Launch%20Bar%20Widgets.md#L1-L25) | Document two additional routes for a custom dashboard/editor and for custom launch-bar controls. | Neither appears in the contribution rule or form, so a contributor can miss suitable alternatives. |
| [Advanced Showcases](https://github.com/TriliumNext/Trilium/blob/5d0bff15f8e02e779a249078973e5c17a82ae7ef/docs/User%20Guide/User%20Guide/Advanced%20Usage/Advanced%20Showcases.md#L1-L10) | Provides in-app examples built with scripts and promoted attributes, explicitly saying they are not native features. | Strong practical evidence for extensibility, but not surfaced from the feature workflow. |
| [`CLAUDE.md`](https://github.com/TriliumNext/Trilium/blob/5d0bff15f8e02e779a249078973e5c17a82ae7ef/CLAUDE.md#L1-L11) | Is an agent/developer implementation entry point. | It has no contributor-facing core-versus-extension rule near its start. It should point to `CONTRIBUTING.md`; it should not become a competing charter. |

The User Guide navigation is source-managed in
[`docs/User Guide/!!!meta.json`](https://github.com/TriliumNext/Trilium/blob/5d0bff15f8e02e779a249078973e5c17a82ae7ef/docs/User%20Guide/!!!meta.json),
and the root README says the same guide is online and in-app. Therefore,
changes to these pages must follow the documented User Guide editing workflow,
not direct Markdown edits ([contribution instructions](https://github.com/TriliumNext/Trilium/blob/5d0bff15f8e02e779a249078973e5c17a82ae7ef/CONTRIBUTING.md#L94-L99)).

The current documentation build copies [`apps/build-docs/src/index.html`](https://github.com/TriliumNext/Trilium/blob/5d0bff15f8e02e779a249078973e5c17a82ae7ef/apps/build-docs/src/index.html) to the site root ([build entry point](https://github.com/TriliumNext/Trilium/blob/5d0bff15f8e02e779a249078973e5c17a82ae7ef/apps/build-docs/src/main.ts#L26-L28)). That HTML redirects to `/user-guide`, as does the live documentation root checked on September 10. The `docs/index.md` file is excluded from the current documentation build; it was considered during review and is excluded from the proposed visibility changes.

## Minimal canonical-home recommendation

Keep the decision criteria in `CONTRIBUTING.md`, under **Features**, because
that is the authoritative contributor policy and already contains it. Add a
brief, linked "consider an extension first" checklist there: script for
automation or event behavior; custom/launch-bar widget for UI integration;
render note for a custom note view; external integration when the concern is
outside Trilium. Link each choice to the existing User Guide page.

Add only routing links elsewhere: one early link from the feature-request
form to that subsection and an optional alternatives field; a short
`CLAUDE.md` pointer for agents; and, if desired, a README contributor link to
`CONTRIBUTING.md`. This promotes existing policy and implementation guidance
without creating a second charter.

## Validation

- Queried GitHub's repository and commit APIs with `gh`; default branch is
  `main`, and the commit above is the current API result.
- Retrieved the cited source files from `main` through GitHub's raw-contents
  API.
- Searched current upstream paths `CONTRIBUTING.md`, `README.md`, `CLAUDE.md`,
  `.github/ISSUE_TEMPLATE`, `docs/User Guide`, and `docs/Developer Guide` for
  `user script`, `custom widget`, `feature request`, `feature idea`, and
  `scripting`.
- The local sibling checkout is a fork at `cf1e97cc89`, so it was used only to
  locate paths and line structure. Findings above are cited to the verified
  upstream commit.
