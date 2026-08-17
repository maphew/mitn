# Upstream PR idea-triage report (campaign mitn-b9b)

Applies [docs/pr-idea-triage.md](../docs/pr-idea-triage.md) to open outsider
PRs on TriliumNext/Trilium, per Elian's 2026-08-17 ask: "have a look at the
PRs and see which ones would be a good candidate for merging."

Method: per PR, a three-stage agent pipeline - factual evidence gathering
(gh CLI, read-only), rubric lane call (rules 1-13, first hit wins), and an
independent adversarial verify that tries to refute the call. Lane calls are
recorded only when the verifier agrees on the lane. These lanes decide *our*
facilitation posture; we are contributors, not maintainers, and every
upstream comment stays human-gated per `upstream-comment-gate`.

Evidence rots; re-verify specifics before quoting anything upstream.

## Batch 1 - 2026-08-17

Selection: the six untriaged, non-draft, conflict-free outsider PRs
(most likely "candidates for merging"), skipping LLM-lane PRs gated on
mitn-9l3 and PRs already reviewed in drafts/ (9633, 10371, 10633, 10824,
10825). Workflow run wf_52056a34-b6c, 18 agents, all verified.

| PR | Title | Lane | Rule | Verifier |
|---|---|---|---|---|
| 10060 | Support multi-attribute note sorting | **GREEN** | 7 small opt-in, linked FR | agrees |
| 10348 | feat(users): phase 2 per-user isolation | **YELLOW** | 8 maintainer-reserved surface | agrees |
| 11031 | fix(text editor): todo hints only on hover | **YELLOW** | 9 default-behavior change | agrees |
| 10005 | feat(search): prefix-aware fuzzy match | **YELLOW** | 9 default-behavior change | agrees |
| 10826 | dev: reproducible plugin/test harnesses | **YELLOW** | 12 omnibus | agrees on lane |
| 9638 | feat(dev): push PR containers to GHCR | **YELLOW** | 13 default (verifier) | agrees on lane |

### 10060 - multi-attribute note sorting - GREEN (rule 7)

Opt-in, backward-compatible extension of the existing `#sorted` label to
comma-separated attributes with `:asc`/`:desc`; answers open feature request
TriliumNext/Trilium issue 6829; no new dependencies. First-time contributor
(Rajesh270712). This is the batch's one merge candidate.

- Gate: issue 6829 appears unassigned; if the "assigned issues only" plan
  (rubric confirm-item 1, bead mitn-9l3) is in force this drops to YELLOW.
- Code-quality follow-ups outside the idea call: Gemini flagged a comparator
  that can return non-zero for equal values when `sortNatural` is false;
  Greptile noted a missing malformed-direction fallback test.
- Facilitation: draft a human-gated supportive comment confirming the issue
  link and offering to help the author address the two bot findings so a
  maintainer can review it clean.

### 10348 - multi-user phase 2 per-user isolation - YELLOW (rule 8)

Rewires storage model and sync-adjacent core (ownerId column,
note_permissions table whose rows bypass sync, per-user Becca cache, 60+
files). Maintainer-reserved surface, but it is the sanctioned multi-user
milestone (issue 4956) following the accepted PR 10273 phasing template, and
eliandoran is already actively reviewing (8 findings posted; author committed
to fixing 4 in phase 2, deferring 4 to phase 3). The YELLOW discussion path
is being walked correctly; verifier confirmed the data-safety RED reading is
defeated by the opt-in / single-user-unaffected evidence.

- Facilitation: monitor the committed fixes; deajan flagged review-capacity
  as the bottleneck, so a human-gated offer of concrete testing help once
  binaries exist would be the useful contribution.

### 11031 - todo hints only on hover - YELLOW (rule 9)

Links open bug 11030 (caret flicker), but resolves it by deleting the shipped
caret-triggered hint behavior from merged PR 9881 rather than fixing the
flicker within the existing design: a default-behavior change of an existing
feature, so rule 9 fires before the rule-6 bugfix lane can. Greptile also
flagged an unresolved regression (a visible hint disappears on state change
and will not re-show until the pointer re-enters).

- Gate: if a maintainer frames 11030 as a plain bug and hover-only as its
  root-cause fix, this reading should be re-checked; the lane is YELLOW
  either way until that design call lands.
- Facilitation: draft a human-gated comment asking maintainers (Adorian for
  UX flow) whether hover-only hints are the intended design versus fixing
  the flicker while keeping caret-entry hints.

### 10005 - prefix-aware fuzzy match - YELLOW (rule 9)

The prefix-aware strategy activates unconditionally when word-length
conditions are met, expanding every user's default fuzzy-search results with
no toggle. Verifier confirmed rule 7 fails on its opt-in prong and no
earlier rule fires.

- Gate: the only linked item is 9963, the same author's own larger FTS5
  search PR (open, conflicted), not a demand-backed feature request; the
  relationship between the two needs clarifying.
- Facilitation: draft a human-gated comment asking whether always-on recall
  expansion is desired behavior and how this PR relates to 9963, before any
  code-review investment.

### 10826 - reproducible plugin/test harnesses - YELLOW (rule 12)

Bundles three separable dev-infra changes: script-deployer env-var overrides
(TRILIUM_DEV_DATA_DIR etc.), per-test timeout bumps in three unrelated
specs, and a new splitjs tsconfig. Production defaults unchanged, CI green,
Greptile 5/5, but no linked issue and the pieces are cherry-pickable, which
is exactly the PR 9960 precedent rule 12 cites.

- Facilitation: draft a human-gated comment suggesting the author split the
  timeout and tsconfig changes from the dev-harness feature.

### 9638 - push PR containers to GHCR - YELLOW (rule 13 per verifier)

XS workflow-only change from perfectra1n (34 merged PRs); CI green.
eliandoran's image-accumulation question ("Is there a clean-up mechanism? I
wouldn't want to have thousands of images") is unresolved. The lane agent
cited rule 9, the verifier refuted the rule (rule 9's evidence base is
user-facing product defaults, not CI defaults) but confirmed the lane via
rule 13's default YELLOW: state need and fit, let a maintainer react.
Recorded as rule 13.

- Facilitation: draft a human-gated comment proposing a concrete retention
  or cleanup mechanism (delete-on-PR-close workflow or GHCR retention
  policy) to directly resolve the stated concern and unblock the idea.

## Remaining queue

Roughly 36 outsider PRs untriaged, most wearing `merge-conflicts`. Gated
subsets: LLM-lane PRs (10553, 9340-9343, 9556, 10009) and any call hinging
on the unassigned-issue policy wait on mitn-9l3. Already covered by earlier
deep reviews in drafts/: 9633, 10371, 10633, 10824, 10825.
