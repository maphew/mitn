Not reproduced from code on current main (1a2f27f8d3).

Observed:
- The search parser puts an `isArchived = false` filter first in every query unless `includeArchivedNotes` is set (`packages/trilium-core/src/services/search/services/parse.ts`, root `AndExp`). The flat-text, content and OCR expressions only see the filtered note set. The fuzzy fallback phase runs the same expression again, so it gets the same filter.
- Quick search (`routes/api/search.ts` `quickSearch`) and jump-to/autocomplete (`searchNotesForAutocomplete`) both set `includeArchivedNotes: false`. A saved or full search follows the `#includeArchivedNotes` label.
- The same filter and defaults are present at v0.97.2 and v0.98.0. The fuzzy-search change did not touch them.
- `search.spec.ts` ("test that fulltext does not match archived notes") exercises the fuzzy fallback phase and expects the archived subtree to stay excluded.

Two paths can still show an archived note. Both are older than 0.98:
- Jump-to with an empty query lists recent notes (`routes/api/autocomplete.ts` `getRecentNotes`). This list has no archived filter.
- A non-inheritable `#archived` label on a parent hides the parent only. Its children are not archived and stay searchable.

Uncertainty: there may be a path that code reading did not find. Advise adding a reproduction: current version, the exact query, whether the note owns or inherits `#archived` and whether the label is inheritable, and whether the list was the empty-query recent-notes list or results for a typed query.
