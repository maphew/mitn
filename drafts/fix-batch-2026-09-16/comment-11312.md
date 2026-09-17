Observed: I could not find this in the source. In v0.105.0 and on main, the help definition (`apps/server/src/assets/doc_notes/en/User Guide/!!!meta.json`) lists "Premium features" with no children. Commit d5223a61a3 moved Slash Commands, Text Snippets and Format Painter directly under "Text". The docs website also has no child pages below "Premium features".

Expected upgrade behaviour: at startup, `checkHiddenSubtree` (`packages/trilium-core/src/services/hidden_subtree.ts`) moves each `_help_*` note to its new parent, deletes the old branch and rewrites the `docName` label. The test "should enforce the correct placement of help" covers this.

What the report implies: the three notes are still below "Premium features" and they are empty. That means they still hold the old `docName` ("Text/Premium features/..."), which points at HTML files that no longer exist. So the 0.105.0 check did not persist in this database.

Possible causes (not verified):
1. One peer in the sync setup is still on 0.104.x. Help notes are synced, and the sync version is 39 in both releases. An older peer therefore puts the old branches and `docName` values back, and the 0.105.0 peer repairs them only at startup or every 7 hours.
2. The hidden subtree check throws on this database and its transaction rolls back.

Useful details to tell these apart:
- The exact version of the sync server and of each client.
- Whether the three notes also appear directly under "Text".
- Any log line near startup that contains "hidden subtree", "Removing unexpected branch" or "Updating attribute _help_".
- Whether the problem comes back after all instances are on 0.105.0 and have been restarted.
