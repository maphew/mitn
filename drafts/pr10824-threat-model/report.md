# Threat-model/UX review of TriliumNext/Trilium PR 10824 (bead mitn-5kv.11)

Slug: pr10824-threat-model. Date: 2026-08-15. Agent: claude-fable-5-high.

## Scope and method

Task: outsider threat-model/UX review of PR 10824 "feat(plugins): add plugin
manager settings and operation locking" covering four questions (trust signal
honesty, compromised-registry blast radius, rollback comprehensibility,
interrupted operations). Greptile inline findings were read only to avoid
duplication.

## Commands run (all read-only)

```bash
gh pr view 10824 --repo TriliumNext/Trilium --json title,body,files,...
gh pr view 10824 --repo TriliumNext/Trilium --json comments,reviews
gh api "repos/TriliumNext/Trilium/pulls/10824/comments" --paginate
git -C $trilium_root fetch upstream "+pull/10824/head:refs/remotes/pr/10824"
# PR head resolved to 5782d17054cb33cda152d651aa1d3b61aef6e21e
git show pr/10824:apps/client/src/widgets/type_widgets/options/plugins.tsx      # 1053 lines, read in full
git show pr/10824:apps/server/src/services/package_operation_lock.ts            # 72 lines, read in full
git show pr/10824:apps/server/src/routes/api/package_operation_lock.ts          # 46 lines, read in full
git diff 372a749ff2...pr/10824 -- apps/server/src/routes/routes.ts \
    packages/trilium-core/src/services/hidden_subtree.ts apps/client/src/services/search.ts
git diff 372a749ff2...pr/10824 -- apps/client/src/translations/en/translation.json
git diff 372a749ff2...pr/10824 -- apps/client/src/widgets/type_widgets/ContentWidget.tsx
git grep -n "package-operation-lock" pr/10824 -- apps/client          # EMPTY: no client caller
git grep -n "packageAllowNetwork|allowedSourceHosts|..." pr/10824 -- apps/server packages   # EMPTY: no enforcement
git grep -n "permissions" pr/10824 -- .../plugins.tsx                 # display-only (lines 713, 799-800)
git grep -n "fetch(" pr/10824 -- .../plugins.tsx                      # only manifest JSON fetches (611, 619)
```

The shared checkout at $trilium_root was never modified; only the
dedicated ref refs/remotes/pr/10824 was created. No GitHub write operations
were performed.

## Greptile findings excluded from my review (per task)

1. P1 direct manifests skip scheduled update checks (resolved per summary).
2. P1 prerelease ordering discarded by isNewerVersion (resolved per summary).
3. P2 plugin settings page bypasses localization (still open).
4. P2 hidden note title untranslated (resolved per summary).

None of my findings overlap these.

## Findings (verified against PR head 5782d17)

### Q1 Trust signal honesty

- "Trusted" appears in advanced_description, registry_description,
  direct_manifest_description (translation.json) but trust = user-pasted URL
  (plugins.tsx:483-509). Verified.
- permissions: registry-supplied, display-only (plugins.tsx:713, 800). Grep
  confirmed no other consumer in the PR head. Verified.
- securityStatus "reviewed" renders NO text (manifestStatus,
  plugins.tsx:971-979: only "warning" and "unreviewed" push status strings), so
  a registry self-asserting "reviewed" looks identical to clean. Verified by
  reading the function.
- lastValidatedAt is registry-supplied and rendered as "Validated <date>"
  (plugins.tsx:977). Verified.
- sha256 integrity (plugins.tsx:889) is format-validated only in this PR; the
  digest comes from the same manifest as the artifact URL, so it does not
  defend against registry compromise. Verified (no artifact download exists in
  the diff to check against).

### Q2 Compromised registry blast radius

- Plugins are activation-label notes: PACKAGE_ACTIVATION_LABELS
  (plugins.tsx:38) includes run, widget, customRequestHandler; enable/disable
  renames disabled:X <-> X (plugins.tsx:551-566). INFERRED from existing
  Trilium semantics (not re-executed): these labels mean unsandboxed script
  with full notes-DB access. This is the one inference in the review and is
  flagged as such in the draft.
- Manifest-defined settings include type "secret" rendered as a password input
  (plugins.tsx:63, 853) but stored as a plaintext packageSetting: label
  (serializeSetting plugins.tsx:998-999, settingLabelName 1002-1004, write at
  313). Phishing-into-synced-plaintext vector. Verified.
- Cached manifest persistence: cacheInstalledManifests writes packageManifest
  label (plugins.tsx:688-704); loadCatalog falls back to cache
  (plugins.tsx:602-607, 653-656). Malicious manifest survives registry
  removal; no purge UI in the diff. Verified.
- Download-host and network toggles stored (plugins.tsx:291-292) but no
  enforcement code anywhere in the PR head (grep empty). Reported as "the PR
  does not show enforcement", not as broken, since the catalog note may
  enforce. Verified absence within PR scope.

### Q3 Rollback

- The PR does not implement rollback: pin (plugins.tsx:325-337, 824-831)
  prevents; repair re-downloads current artifacts (repair_description); no
  downgrade, no version history, settings persist while disabled
  (package_settings_description). Reported as scope gap plus one-sentence UI
  fix, not as a defect. Verified.

### Q4 Interrupted operations

- packageTransaction notes excluded from installed list (plugins.tsx:200, 216)
  and counted into a recovery banner (243-246, 385-394); recovery itself is in
  the catalog note, out of diff. Verified.
- Lock service sound in isolation (TTL lock.ts:4, token-checked renew/release
  52-67, expiry 31-35) but NO client caller exists in this PR (grep empty), so
  renewal discipline cannot be judged; in-memory lock is freed by server
  restart; TTL expiry is silent. Reported as contract notes for the eventual
  caller. Verified.
- Gap in this PR's own code: setPackageEnabled loops setLabel per note then
  window.location.reload() (plugins.tsx:339-359) with no transaction marker;
  mid-loop failure leaves mixed activation state that packageHealth
  (plugins.tsx:590-597, artifact-presence only) will not detect. Verified by
  reading both functions.

## Deliverable

- Draft upstream comment:
  $mitn_root/drafts/pr10824-threat-model/comment-pr10824.md
- Lint: `scripts/gh-body-lint comment-pr10824.md` exited 0 with no output
  (clean).
- NOT posted anywhere; human (maphew) review required before any upstream use.

## What a human must still do

1. Review and, if agreed, post comment-pr10824.md on PR 10824.
2. The claim that run/widget/customRequestHandler labels grant unsandboxed
   script execution is inferred from Trilium's existing script-note model, not
   re-tested; a maintainer will know this cold, but if posting elsewhere,
   confirm against apps/server script execution paths.
3. The Community Packages catalog note (install/download/recovery/rollback
   implementation) is outside this PR and was not reviewed; several findings
   explicitly defer to it.
