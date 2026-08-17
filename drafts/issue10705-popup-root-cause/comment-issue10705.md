Triaged all six demos plus the follow-up comment against current main, tracing each symptom to code, then re-tested each surface live on main (964e23ec56, web client, Linux). They are separate bugs, not one; two of the original surfaces no longer reproduce. Suggest splitting into four issues and keeping this one as the tracker.

Still reproduce on current main:

**1. Launch bar icons + Web Clipper badge (one bug).** Both tooltips are Bootstrap tooltips created by `useStaticTooltip` (`widgets/react/hooks.tsx:1135`, trigger `hover focus` in `widgets/react/ActionButton.tsx:52` and `widgets/react/Badge.tsx:32`). `ContextMenu.show()` only dismisses the note-preview tooltips (`menus/context_menu.ts:91` calls `note_tooltip.dismissAllTooltips()`), never these, and the hook's dismiss-on-press listens to `click` only (`hooks.tsx:1178`), so right-click leaves the tooltip standing over the menu - verified live (launcher tooltip stays over the open context menu). The dialog case has a second leg: the tooltip is correctly hidden on the press that opens the dialog (5d99e3b02d), but when the dialog closes, focus returns to the launcher button and the `focus` trigger re-shows the tooltip with the pointer nowhere near it - also verified live. The old widget hid its tooltip on right-click (`widgets/buttons/abstract_button.ts:42`); the Preact port dropped that. Smallest fix: hide the static-tooltip set when a context menu opens, and reconsider the `focus` trigger (or blur-on-dialog-close) for launcher buttons.

**2. PDF note menus.** The PDF is pdf.js in a cross-document iframe (`file/PdfViewer.tsx:47`). Menu dismissal relies on parent-document click listeners (`menus/context_menu.ts:84`; Bootstrap dropdown autoclose likewise), and clicks inside the iframe never bubble out. Verified live: the three-dots dropdown stays open after a click inside the PDF, while the same click in the app chrome closes it. A click bridge already exists for tab activation (`file/Pdf.tsx:241`); dismissing floating layers there too would be the smallest fix.

**3. ETAPI context menu behind the dialog.** `#context-menu-container` is `z-index: 2000` (`stylesheets/style.css:1670`) and is created before the modal in the DOM; the prompt modal is also 2000 (`dialogs/prompt.tsx:50`, bumped by `services/dialog.ts:180` when modals stack). Tie goes to DOM order, so the modal paints over the menu. Reproduces in any prompt/confirm modal, not just ETAPI settings. Not re-testable in the web client (the menu in the demo is Electron's input context menu); the z-index values are unchanged on main.

**4. Menus taller than the viewport (from the follow-up comment).** `positionMenu()` clamps position but not height (`menus/context_menu.ts:140-186`), and `overflow: auto` is explicitly forbidden because submenus are DOM children (`stylesheets/style.css:1634`). Structural limitation, enhancement-shaped, unrelated to the above.

No longer reproduce on current main (web client):

- **Inline link popup after tab switch**: the LinkUI balloon is dismissed on tab switch whether the tab is clicked or switched by keyboard command - verified both ways.
- **Attributes panel autocomplete stranded at the window corner**: the mention balloon anchors correctly and is dismissed when the panel closes. The attribute UI was reworked at the end of July, which likely covered this.

If either still triggers for you on a current build (Electron or a different gesture), fresh steps would make it worth a separate issue.

_claude-fable-5-high on behalf of matt wilkie_
