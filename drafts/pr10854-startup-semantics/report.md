# PR 10854 startup run-label semantics - findings

Bead: mitn-5kv.1. Source read at $trilium_root, branch main at
upstream/main commit 372a749ff2 (read-only; no PR-head fetch needed because
the PR touches only one docs file, read via `gh pr diff`).

## Question

Docs PR TriliumNext/Trilium 10854 (docs/User Guide/.../Backend
scripts/Events.md) adds:

> Note that all event values for run attributes are mutually exclusive. To
> get the same script to trigger on multiple events, create multiple copies
> of the script and assign each the key value pair you need.

Greptile's review (P2, "Multiple run values are supported") says one script
note can carry multiple `run` label values because each event independently
retrieves matching notes. Which is right?

## Verdict

Both are partly right; the doc's remedy (copy the script) is wrong.

1. One note CAN carry multiple `#run` labels. Attributes are independent
   rows keyed only by `attributeId`; no uniqueness on (noteId, name). A note
   with both `#run=frontendStartup` and `#run=mobileStartup` matches both
   queries and fires in both contexts. No script copies needed. Greptile is
   substantively correct (its phrase "each scheduler event" is loose;
   frontend startup is not the scheduler).
2. A comma-separated value in a single label does not work.
   `#run=frontendStartup,mobileStartup` is matched as an exact literal and
   matches neither event. (Exactly what the issue author in 10853 tried
   first.)
3. Per startup, the frontend values ARE exclusive. The client requests one
   set only: mobile layout requests `mobileStartup` bundles, every other
   layout requests `frontendStartup` bundles. So `frontendStartup` does NOT
   fire on the mobile frontend, and `mobileStartup` does not additionally
   pull in `frontendStartup` scripts. The doc's "mutually exclusive"
   intuition is true at the per-event level, not the per-note level.
4. backendStartup / hourly / daily run on the server scheduler, independent
   of any client, ~10 s after DB ready / on timers.

## Evidence (file:line at commit 372a749ff2)

- Server route picks ONE label value per request:
  packages/trilium-core/src/routes/api/script.ts:74-82
  (`if (req.query.mobile === "true") return getBundlesWithLabel("run", "mobileStartup"); return getBundlesWithLabel("run", "frontendStartup");`)
- Client decides mobile vs not, single request:
  apps/client/src/services/bundle.ts:73-75
  (`const isMobile = utils.isMobile(); ... server.get('script/startup' + (isMobile ? '?mobile=true' : ''))`)
  Called once, 2 s after app start: apps/client/src/components/app_context.ts:649.
- Mobile detection = mobile layout (`window.glob.device === "mobile"`) or
  `Mobi` UA fallback: apps/client/src/services/utils.ts:303-309.
- Exact-value label match: packages/trilium-core/src/services/attributes.ts:12-18
  (`getNotesWithLabel` builds `#run=<value>` via
  packages/trilium-core/src/services/attribute_formatter.ts:5-28).
- No per-note uniqueness of label name:
  packages/trilium-core/src/assets/schema.sql:67-78 (PK is attributeId
  only). Same PR's own docs note `runAtHour` "Can be defined multiple
  times".
- Co-presence of both labels expected by client tooling:
  apps/client/src/services/active_content.ts:143-144
  (`#run = frontendStartup OR #run = mobileStartup`).
- Scheduler handles backend values:
  packages/trilium-core/src/services/scheduler.ts:63-77.
- Env guard: a "JS backend" note is refused for frontend execution,
  packages/trilium-core/src/services/script.ts:147-162 (relevant to why a
  user's script may silently not run; not part of the doc dispute).
- en translation already states the split
  (apps/client/src/translations/en/translation.json:570): frontendStartup
  "but not on mobile", mobileStartup "on mobile".

## PR thread state (gh, read-only, 2026-08-15)

- Author tmzhuang; docs-only change born from issue 10853 (their own
  confusion; they tried the comma form and the two-label form on an Android
  PWA, v0.95.0, and reported neither worked).
- Greptile review: confidence 4/5, blocks on the mutual-exclusivity
  sentence; inline P2 "Multiple run values are supported".
- No human review yet.

## Verified vs inferred

- Verified by reading current source: everything in Evidence.
- Not runtime-tested: execution on a real mobile device/PWA. The 10853
  author's report that the two-label form did not work on Android PWA is
  unexplained; plausible causes are the note not being type "JS frontend"
  (script.ts:147 guard), timing, or the old version. Human test: create a
  "JS frontend" code note with `#run=mobileStartup` logging to console,
  open the mobile layout, confirm it runs ~2 s after load.

## Deliverables

- This report.
- Comment draft: comment-pr10854.md (lint-clean, signed). One comment,
  scoped to the run-semantics sentence only, per first-contact culture.
