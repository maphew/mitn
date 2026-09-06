The Enter handling works for the covered paths, but the new selection relocation misses ranges that only partially enter the collapsed subtree. This leaves part of the active selection hidden and permits invisible edits.

Review comment:

- [P2] Move any partially hidden selection before collapsing — A:/dev/mitn/.worktrees/trilium/pr-11335/packages/ckeditor5/src/plugins/collapsible_list_items.ts:489-493
  When a selection starts in the parent item and extends into a descendant, checking only `getFirstPosition()` makes `hidesSelection` false because that position belongs to the parent. Clicking the gutter arrow then leaves the range endpoint inside hidden content, so subsequent typing can modify invisible text; inspect all selection ranges or selected blocks for descendants before collapsing.
