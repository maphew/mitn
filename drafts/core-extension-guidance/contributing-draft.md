# Make the core-versus-extension guidance easier to use

Draft for maintainer review, 2026-09-10. These are proposed edits to existing upstream guidance, not adopted policy. The canonical home remains [CONTRIBUTING.md](https://github.com/TriliumNext/Trilium/blob/main/CONTRIBUTING.md). The [research note](../../reports/core-extension-guidance-2026-09-10.md) explains the evidence and placement.

## 1. Put the choice before implementation

In `CONTRIBUTING.md`, insert this bullet in **Before you start**, immediately before the feature-discussion bullet. Keep the existing requirement to wait for maintainer feedback.

```markdown
- Before proposing a feature, read [Core feature or extension?](#core-feature-or-extension). A script or custom widget can be the right contribution for a specialized workflow.
```

## 2. Add a practical decision aid to Features

In `CONTRIBUTING.md`, insert the following subsection at the end of **Features**, before **Pull requests**. Preserve the existing script/widget decline bullet and add only the link:

```markdown
- can be built as a [user script or custom widget](#core-feature-or-extension) instead. Trilium is very scriptable, and specialized needs fit well there;
```

### Core feature or extension?

Trilium's scripting and widget support lets people adapt the application to their own workflows. A useful contribution can be an extension shared with other users.

| What you want to change | Where to start |
|---|---|
| A defect in existing behavior | Report the bug with reproduction steps, or propose a focused fix. A script workaround does not remove the underlying bug. |
| A personal interaction preference, automation, or specialized workflow | Check existing options and community extensions, then consider a script. |
| A custom panel or note view | Consider a custom widget or render note. |
| A button or control in the launch bar | Use the [Launch Bar Widgets guide](https://docs.triliumnotes.org/user-guide/scripts/frontend-basics/launch-bar-widgets). |
| An external tool that reads or writes notes | Check the [ETAPI REST API](https://docs.triliumnotes.org/user-guide/advanced-usage/etapi) before proposing an in-app integration. |
| A need shared by other users that existing features or extensions do not meet | Discuss a core feature before implementation. Explain the evidence of need and why the extension routes do not meet it. |
| An extension that needs an API or event the application does not expose | Describe the gap in a feature request. Discuss whether a small extension API change would be suitable. |

Small size, an opt-in setting, or a linked feature request does not settle whether a feature belongs in core. New settings and built-in behavior add maintenance and testing work. Follow **Before you start** and wait for maintainer feedback before implementing a core feature of any size.

In the discussion, describe the problem, who encounters it, the alternatives you considered, and why you suggest core or an extension. If you are unsure, say so. You do not need to build a prototype to ask.

For implementation, see [Scripting](https://docs.triliumnotes.org/user-guide/scripts), [Frontend Basics](https://docs.triliumnotes.org/user-guide/scripts/frontend-basics), [Custom Widgets](https://docs.triliumnotes.org/user-guide/scripts/frontend-basics/custom-widget), and [Render Note](https://docs.triliumnotes.org/user-guide/note-types/render-note). The [community extension list](https://github.com/Nriver/awesome-trilium) can help you find existing work and places to share your extension. Prefer documented extension APIs. If the only approach relies on internal UI details, explain that limitation in the discussion. Test any draft script before sharing it as a working solution.

## 3. Show the link where people ask for features

In `.github/ISSUE_TEMPLATE/feature_request.yml`, insert this item first in `body`, before the existing feature description:

```yaml
- type: markdown
  attributes:
    value: |
      Before implementing a feature, read [Core feature or extension?](https://github.com/TriliumNext/Trilium/blob/main/CONTRIBUTING.md#core-feature-or-extension) and wait for maintainer feedback. Scripts and custom widgets can be a good fit for specialized workflows. You can ask for help choosing an approach without writing code first.
```

After the existing feature description, add this optional item. Leave both existing fields in place.

```yaml
- type: textarea
  id: alternatives
  attributes:
    label: Existing features or extensions considered
    description: Have you found an existing option, script, or custom widget that addresses this? Describe any gap, or say that you are unsure.
  validations:
    required: false
```

## 4. Give agents the same entry point

In `CLAUDE.md`, insert this paragraph after the opening description and before **Overview**:

```markdown
Read [CONTRIBUTING.md](./CONTRIBUTING.md) before starting a contribution. For a new feature, check [Core feature or extension?](./CONTRIBUTING.md#core-feature-or-extension) and wait for maintainer feedback before implementation.
```

This points agents to the contributor guide without repeating the decision rules. It does not change the file's development commands or Git workflow.

## 5. Optional links from the documentation entry points

In `docs/Developer Guide/Developer Guide.md`, add this as the first **Quick links** item:

```markdown
* [Contribution guidance: core features or extensions](https://github.com/TriliumNext/Trilium/blob/main/CONTRIBUTING.md#core-feature-or-extension)
```

In the root `README.md`, add this under **Quick Links**:

```markdown
- [Contributing to Trilium](./CONTRIBUTING.md)
```

The root README is the source for the translated README base. Follow the existing [Sync README workflow](https://github.com/TriliumNext/Trilium/blob/main/.github/workflows/sync-readme.yml); do not edit the translated README files as independent sources.
