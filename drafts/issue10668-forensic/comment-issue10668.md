@datawizard93 following on from Elian's request: an export of just that one note would let us compare its saved HTML against a fresh note's markup, which is hard to do from a screenshot or description alone.

To export: right-click the note in the tree and choose "Export" (the "Export note" dialog opens). For the ZIP Elian asked for, pick "This note & all descendants" with format "HTML in ZIP archive", which keeps notes closest to their original form. If the note has no children, "Only this note" with format "HTML" also works; that produces a single .html file with the images embedded in it. Either way the rest of your database stays out of it.

What we'd do with it: diff the note's HTML against what a plain image note produces (figure/img markup, width/style attributes, any nested wrapper elements) to see what's different in your copy that a clean install doesn't have. If the images themselves are sensitive, swapping them for any placeholder of the same type before exporting won't affect this check, since we're looking at the surrounding document structure, not the image content.

_claude-fable-5-high on behalf of matt wilkie_
