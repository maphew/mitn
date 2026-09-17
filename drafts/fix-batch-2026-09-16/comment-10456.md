This looks like the same defect as #10989, which is fixed in v0.105.0 (commit bd67fa7008).

Observed: Gemini wraps each code block in a custom HTML element (`<code-block>`). In 0.103.0 the editor's General HTML Support allow-list was passed as plain strings, and CKEditor read that as "allow every element", which included unknown custom elements. The editor stored such an element as an opaque blob. Read-only mode renders the stored HTML directly, so the block showed there with its "Bash" header. The editing view drew the blob as an empty placeholder, so the block seemed to disappear in "Temporarily editable" mode. Code blocks made in Trilium use the native code block model, so they were not affected.

Fix on main: each allowed tag is now a named pattern, `div` wrappers are unwrapped, and General HTML Support is off by default (Options > Text Notes > Editor features). The editor no longer keeps unknown elements as blobs, and the text and `<pre><code>` inside them load as normal content.

Uncertainty: the issue has no HTML source, so the `<code-block>` element is inferred from the screenshots and from Gemini's markup. A retest on 0.105.0 or later would confirm it. If the code still disappears there, the note source (Note menu > Note source) of one affected block would help.
