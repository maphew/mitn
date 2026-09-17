Observed from the screenshots: with the note editable, the table of contents skips the H1 ("Test, head 1"). With the note read-only, the H1 is listed as a top-level entry. The two modes build the list in different ways.

Cause:
- Read-only mode reads the rendered HTML with the selector `h1,h2,h3,h4,h5,h6` (`extractTocFromStaticHtml` in `apps/client/src/widgets/sidebar/TableOfContents.tsx`).
- Editable mode reads the CKEditor model and keeps only elements whose name starts with `heading` (`extractTocFromTextEditor`, same file).
- Trilium registers only `heading2` to `heading6`. A pasted `<h1>` survives only through General HTML Support, as the model element `htmlH1`, so the editable list skips it.

State on main: General HTML Support has been opt-in and off by default since 8e9ce16b58 ("feat(text): make General HTML Support opt-in"). From code reading (not run), a pasted H1 with default settings should now become a paragraph, and single-file import already shifts H1 down. The mismatch should therefore remain only when the option is on, or for H1 that reaches a note through ETAPI, scripts, or older content.

Uncertainty: the report does not say which of the two behaviours is the malfunction, and both directions are small changes. Accepting `htmlH1` to `htmlH6` in the editable extractor makes the list match what the note shows. Dropping `h1` from the read-only selector matches the share theme, but hides a visible heading. A maintainer decision on the direction would unblock a PR.
