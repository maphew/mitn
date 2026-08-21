## Why this review

This is a threat-model and user-experience pass over PR 10824 from the standpoint of a nontechnical user and of a compromised plugin registry. It does not repeat Greptile's implementation findings (direct-manifest scheduling, prerelease ordering, localization). Every claim below comes from the PR diff. Where the diff is silent I say so rather than assume the missing piece is broken, since the PR body states that install, download, and recovery live in the separate Community Packages catalog note.

Line numbers refer to the PR head (5782d17).

## 1. What "trusted" means to a nontechnical user

Observed: the UI uses trust language in three places, all in `apps/client/src/translations/en/translation.json`: "Trusted plugin sources, permissions, and update behavior" (`plugins.advanced_description`), "another trusted source" (`plugins.registry_description`), and "a trusted plugin that is not listed in a registry catalog" (`plugins.direct_manifest_description`).

Cause: nothing in the diff establishes or verifies trust. "Trusted" here means only "a URL the user pasted into a textarea" (`plugins.tsx` lines 483 to 509). The three signals shown alongside a package are all supplied by the registry itself:

- `permissions` is registry-declared text, filtered for string type only (`plugins.tsx:713`) and displayed verbatim (`plugins.tsx:800`). Nothing in the diff enforces it. I could find no consumer of the permissions list other than display.
- `securityStatus` and `lastValidatedAt` come from the same manifest (`plugins.tsx:109-110`) and are rendered as "Registry status" (`plugins.tsx:971-979`). A value of `"reviewed"` produces no status text at all, so a self-asserted "reviewed" looks the same as a clean state; only `"warning"` and `"unreviewed"` produce visible text.
- The SHA-256 integrity check (`plugins.tsx:889`) is validated for format only in this PR, and the digest comes from the same registry as the artifact URL. It defends against a tampered download host, not against a compromised registry, which can publish a matching digest for malicious content.

Smallest fix: soften the wording rather than build infrastructure. Say "plugin sources you add yourself" instead of "trusted", label the permissions row as informational ("declared by the author, not enforced by Trilium"), and either render `securityStatus: "reviewed"` explicitly or drop the field until something signs it. The honest framing already used in `plugins.registry_status_description` ("metadata published by the registry") is the right model; extend it to the other rows.

## 2. Can a compromised registry cross security boundaries

What a malicious registry update gets, per the diff:

- Full script capability once installed, because plugins are activation-label notes: `PACKAGE_ACTIVATION_LABELS` at `plugins.tsx:38` includes `run`, `widget`, and `customRequestHandler`, and the enable toggle just renames `disabled:run` back to `run` (`plugins.tsx:551-566`). In Trilium these labels execute unsandboxed script with full notes-DB access. So the boundary between "catalog metadata" and "code execution" is exactly one update plus the user pressing Enable; the permissions display does not narrow it.
- Settings can phish credentials: the manifest defines the settings form, including type `"secret"`, which renders as a password field (`plugins.tsx:63`, `plugins.tsx:853`). The value is stored via `serializeSetting` as a plain `packageSetting:` label (`plugins.tsx:998-1003`, write at `plugins.tsx:313`). Note attributes are plaintext and sync. A compromised registry can push a manifest update whose settings panel says "Sync password" and harvest the value into a synced plaintext label. The field looks like a password field, which is itself a dishonest trust signal.
- The cached manifest outlives the registry: `cacheInstalledManifests` writes the fetched manifest into the `packageManifest` label (`plugins.tsx:688-704`), and `loadCatalog` falls back to that cache when sources are empty or failing (`plugins.tsx:602-607`, `653-656`). A malicious manifest therefore keeps driving the settings UI, health verdict, and update math after the user deletes the registry URL. There is no UI to inspect or purge the cached manifest.

What the diff does not do: it does not download or execute artifacts (the only fetches are manifest JSON at `plugins.tsx:611` and `619`), and it validates URL scheme, id, version, and integrity format strictly (`plugins.tsx:881-936`). The two toggles that sound like enforcement, "Plugin download hosts" and "Allow plugin network requests", are stored as labels (`plugins.tsx:292`, `291`) but no code in this PR reads them for enforcement; grep over the PR head finds no server-side consumer. If enforcement lives in the catalog note, the settings page should say where; if it does not exist yet, these controls currently give a nontechnical user a false sense of a boundary.

Smallest fixes: state in the two descriptions which component enforces them; render secret-type settings with a warning that values are stored as plaintext note attributes (or reject `"secret"` until protected storage exists); add a "forget cached manifest" action or clear the cache when the last source is removed.

## 3. Is rollback comprehensible and complete

The PR does not implement rollback. What it offers:

- "Pin updates" holds a version (`plugins.tsx:325-337`, `plugins.tsx:824-831`), which prevents rather than reverses.
- "Repair package" re-downloads the current declared artifacts (`plugins.repair_description`), which restores integrity, not a prior version.
- No version history, no downgrade path, and no statement about data a newer plugin version wrote (its own notes, or settings labels, which explicitly "remain stored while the package is disabled", `plugins.package_settings_description`).

This is a fair scope cut for a first settings layer, but the UI never tells the user that rollback does not exist. A nontechnical user seeing "recover from incomplete operations" (PR body) plus "Repair" plus "Pin" may reasonably believe they can go back a version. Suggest one sentence in the Updates section: updates are one-way; pin before updating if you need to stay on a version.

## 4. Interrupted operations

What the diff covers:

- Notes carrying `packageTransaction` are excluded from the installed list (`plugins.tsx:200`, `216`) and surface a distinct-transaction count with an "Open recovery" button (`plugins.tsx:243-246`, `385-394`). Good: partial installs cannot masquerade as healthy packages. Recovery itself happens in the catalog note and is not reviewable in this diff.
- The lease lock (`apps/server/src/services/package_operation_lock.ts`) is sound for its stated scope: 5-minute TTL (`lock.ts:4`), token-checked renew and release (`lock.ts:52-67`), expiry cleanup (`lock.ts:31-35`). No client code in this PR calls `/api/package-operation-lock` (the route is registered at `routes.ts:198`; grep finds no caller), so lease renewal discipline during a long install cannot be judged here. Two properties the eventual caller must handle, stated here so they are not lost. The lock is in-memory, so a server restart mid-operation silently frees it while the first client may still be working. And an operation that outlives the TTL without renewing loses the lease with no notification, so a second client can start a concurrent operation. The code comment (`lock.ts:37-41`) acknowledges the process-local design, but the client contract is the part that matters and it is out of scope here.
- One interruption path in this PR's own code has no transaction marker: `setPackageEnabled` flips activation labels note by note in a loop and then reloads the window (`plugins.tsx:339-359`). A failure or window close mid-loop leaves a package with some artifacts enabled and some disabled. The health check will not notice, because it only verifies artifact presence (`plugins.tsx:590-597`), not activation consistency. Smallest fix: derive health from label consistency too, or wrap the loop in the same `packageTransaction` marker the install flow uses.

## Verification

Read the full PR head of `plugins.tsx`, the `package_operation_lock.ts` service and its route file, `routes.ts`, `hidden_subtree.ts`, `search.ts`, and the translation additions, via `git fetch upstream pull/10824/head` at 5782d17. I checked the enforcement-absence claims (permissions, download hosts, network toggle, lock caller) by grep over the PR head tree, not just the diff. Not verified: behavior of the Community Packages catalog note, which is outside this PR. I inferred the runtime behavior of activation labels from existing Trilium script-note semantics and did not re-test it.

_claude-fable-5-high on behalf of matt wilkie_
