# PR idea triage rubric (TriliumNext/Trilium)

Purpose: a fast gut-check, for agents and people, of whether an upstream PR's
*idea* is sound and appropriate for Trilium. Code quality and convention
conformance are judged elsewhere; this rubric asks only "should this exist in
Trilium at all, in roughly this shape?"

Provenance: TriliumNext has **no CONTRIBUTING.md, no PR template, and no
written acceptance policy** (confirmed 2026-08-17). Everything below is
*inferred* from scattered doc statements and from maintainer behavior on
~30 not-planned issues, 24 closed-unmerged PRs, and ~70 merged outsider PRs
(evidence window roughly 2026-02 to 2026-08, plus older landmark issues).
It predicts eliandoran's likely call; it is not his stated policy. Counts and
case numbers rot; re-verify specifics before quoting them upstream.

Companion: [trilium-landscape-2026-08.md](trilium-landscape-2026-08.md)
(culture, communication style, who's who).

## The 60-second gut check

Work down the list; first hit wins. Lanes: **RED** = doesn't belong, draft a
polite decline rationale. **YELLOW** = idea needs discussion before code
review is worth anyone's time. **GREEN** = idea is sound, facilitate landing.

1. Bounty-motivated or bulk AI-farm provenance? → **RED** (hard policy)
2. Breaks a core invariant: requires online service, huge bundle,
   proprietary-format dependency, or risks existing users' data? → **RED**
3. Solves the problem at the wrong layer (reverse proxy, OS, packaging,
   upstream library) or duplicates an existing capability/affordance? → **RED**
4. Workaround UI (refresh buttons, toggles that paper over a bug) instead of
   a root-cause fix? → **RED** as-is; the underlying bug may be GREEN
5. Niche need that a user script or custom widget can satisfy? → **RED** for
   core; suggest the scripting path
6. Reproducible bugfix at the root cause, or docs fix through the proper
   pipeline, reasonably small? → **GREEN**
7. Small feature that is opt-in / preserves default behavior, answers an
   existing feature-request issue, reuses existing components, adds no
   dependency? → **GREEN**
8. Touches a maintainer-reserved surface (mobile platform, trilium://
   protocol, sync/encryption architecture, storage model, in-core LLM) or an
   area with an active maintainer redesign? → **YELLOW**; expect "we'd like
   to handle this on our side"
9. Changes default behavior or visible UI defaults? → **YELLOW** (design
   debate; winnable with product-precedent arguments, costs weeks)
10. Adds a settings toggle on single-requester demand? → **YELLOW**; options
    are permanent maintenance commitments
11. Large feature arriving cold (no linked issue, no prior discussion, no
    phasing)? → **YELLOW**; the accepted path is discuss first, then phased
    delivery with zero behavior change for existing installs
12. Omnibus PR bundling separable changes? → **YELLOW**; ask to split so
    maintainers can cherry-pick
13. None of the above fired? Default **YELLOW**: state need and fit in one
    short comment and let a maintainer react before investing review effort.

## Lane detail and evidence

### RED: doesn't belong

- **Bounty/AI-farm provenance.** "We're not interested in AI-driven
  contributions with the sole purpose of gaining a bounty" (PRs 9845-9848,
  9688-9716 wave, 2026-05). Applies even when tests pass and the code is
  polished; provenance and motive outweigh execution. Note the converse:
  good-faith AI-assisted work is fine if the author verified the result
  (PR 10924 Turkish translations).
- **Offline invariant.** "Everything in Trilium must work offline"
  (issue 10093, draw.io); commercial/cloud APIs "out of scope for a
  local-first PKM tool" (issue 3865).
- **Data longevity.** Dependencies with complex proprietary formats are
  rejected because "I want to keep the data in Trilium usable for decades"
  (issue 676). Also weight: a few hundred MB bundle is disqualifying alone
  (10093).
- **Data safety of the installed base.** File-sync-provider syncing rejected
  as a class despite popularity (issue 10035); crypto modernization declined
  without a concrete threat model because migration endangers existing data
  (issue 7411). Popularity does not override architectural risk.
- **Existing equivalent.** A shipped alternative closes the door (Excalidraw
  vs draw.io, 676/10093); redundant second paths to the same capability
  "complicate the UX for little benefit" (issue 6817); a mechanism is
  declined when an existing mechanism already negates the need (tree
  pagination vs hoisting, issue 3569).
- **Wrong layer.** "This needs to be done at reverse proxy level" (Basic
  Auth, issue 4474); Zotero-side config, not Trilium (1853); upstream-library
  bugs get the `upstream` label, not patches.
- **Workaround over root cause.** "If the diagram fails to render, then we
  must fix that issue instead of having a work-around" (PR 9960).
- **Scriptable and niche.** "Can be relatively easily implemented as a custom
  widget... I don't see it being native" (issues 715, 2485). The two tests
  compound: niche + scriptable = not core.
- **Off-identity.** The project self-defines everywhere as "hierarchical
  note taking... large *personal* knowledge bases" (README, docs portal,
  package.json). Team/enterprise pulls are off-identity, with one big
  sanctioned exception: multi-user is an official milestone (issue 4956),
  but on the maintainers' terms (see YELLOW).

### YELLOW: sound-ish idea, discuss before code

- **Maintainer-reserved surfaces.** Mobile: "something we want to keep
  internally due to how many architectural decisions need to be taken"
  (7447, PR 9715). Protocol: "we'd like to handle this on our side since we
  plan to make trilium:// more powerful" (PR 9712). Deep widget/core
  modifications "need to be discussed beforehand" (PR 9708); roadmap-owned
  features need "an agreed-upon plan" (PR 9707). "Conceptually it's not bad"
  is explicitly not sufficient.
- **LLM-adjacent (volatile; confirm before acting).** In-core LLM was removed
  at v0.102 as unsustainable and all LLM issues closed as a class, with MCP
  named as the sanctioned integration path (issue 8794). Yet a maintainer-led
  reintroduction is now in progress (Elian's own PR 10554 and the trilium-core
  WASM/LLM thread). Outsider LLM feature PRs sit in limbo; do not facilitate
  or decline without checking the current maintainer position.
- **Default-behavior and UI-default changes.** Always-visible UI change drew
  idea-level pushback and took 14 days, won by a product-precedent
  counter-argument (PR 8623). Adorian is the UX-flow voice (issue 9584).
- **New options/toggles.** "Adding a new option is a commitment... Unless it
  gains traction, the cost outweighs the value" (issue 9584); "effort
  outweighs the demand" is the standing prioritization test (5813).
- **Large features.** The accepted template is PR 10273 (multi-user phase 1,
  first-time contributor, merged in 7 days): target the project's
  most-demanded issue, explicit phasing, "nothing changes for existing
  installs," staged review on a feature branch. For architecture-scale work
  Elian's stated bar (issue 4956) adds: pre-agreed design, ~10% max
  LLM-generated code, and demonstrated user-level knowledge of Trilium.
- **New dependencies.** Judged on footprint and breadth of internal use
  (Day.js plugin note in User Guide); reuse of existing components is a
  documented acceptance principle (Markdown note type "Rationale").
- **Omnibus PRs.** "A single PR for all of them might not be the best
  approach since we might want to pick out only a few" (PR 9960).
- **Third-party ecosystem promotion.** Needs prior discussion and a trust
  track record: update cadence, support responsiveness (PRs 10837, 10998).
- **Ideas framed in another app's data model.** Requests importing
  file-manager or folder semantics get challenged to re-derive in Trilium's
  model (clones, note=folder) before anything else happens (issues 6351,
  7396).

### GREEN: facilitate landing

- **Bugfixes with reproduction.** Median 0.9 days to merge for outsider
  bugfixes. Reproducibility is demanded before a fix is considered
  (PR 10477). Fix must be at the root cause.
- **Docs fixes through the pipeline.** Median 0.5 days, but must use the
  `edit-docs` toolchain; a correct fix bypassing it was redone by the
  maintainer instead of merged (PR 9719).
- **Small, opt-in, demand-backed features.** Median 2.2 days. Strongest
  predictors, each independently evidenced:
  - links one or more existing feature-request issues ("Closes #...") -
    neutralizes idea risk entirely; review energy shifts to robustness
    (PRs 8799, 5834, 9190);
  - preserves default behavior / off-by-default (PR 10237 merged cold in
    under 2 days, only comment was "update the documentation");
  - reuses existing components, no new dependency;
  - matches something maintainers already articulated they want ("better
    aligns with our functional expectations", PR 8808).
  A well-framed small feature with a linked issue and a screenshot can merge
  with zero conversation (PR 9190).
- **Alignment with declared priorities.** React client port (active), mobile
  and multi-user (declared milestones in the ADR doc) - but via the YELLOW
  discussion path when the surface is maintainer-reserved.

## Evidence grading

**Explicit** (written in-repo or stated verbatim by a maintainer; safe to act
on): offline invariant; data-longevity test; scriptable-not-core;
options-are-commitments; effort-vs-demand; wrong-layer; workaround-vs-root-
cause; component-reuse principle; dependency footprint test; bounty/AI-farm
rejection; maintainer-reserved mobile and protocol; every PR is manually
tested and maintainer-reviewed (Developer Guide, Branching strategy).

**Implicit but consistent** (revealed by behavior across multiple cases; act
on it, but cite the behavior, not doctrine): linked-issue demand neutralizes
idea risk; opt-in/behavior-preserving lands cold; large-feature phasing
template; contributor track record earns latitude ("only two commits is a
huge red flag", 7447, vs perfectra1n's 11 merges including feature removals);
old rejections are era-dependent and reversible (Kanban: "too specialized"
in 2021, core Collections view in 2026 - judge against the current
framework, not old refusals); silence is a real outcome (an XL PR from a
trusted contributor died unreviewed, 10514; merge latency scales hard with
size: large features median 10.4 days, mean 49, max 285).

**Ambiguous** (do not rely on these without confirmation): see next section.

## Confirm with Elian before relying on

1. **Policy status.** On issue 649 he announced a *plan*: "working on
   assigned issues only" and moving feature requests to Discussions/Ideas
   with voting. Is that in force now? Should triage treat unassigned-issue
   PRs as automatically YELLOW? (Our triage could help roll this policy out.)
2. **LLM lane.** Which, if any, outsider LLM contributions are welcome during
   the reintroduction (e.g. open PRs 10553, 9340-9343, 9556, 10009), or is
   that whole surface maintainer-only for now?
3. **AI-assistance line for ordinary PRs.** The ~10% figure was stated for
   architecture-scale work (4956); PR 10924 suggests the real bar is
   "author verified the output." What's the expectation for normal PRs,
   given the repo's own heavy Claude use?
4. **The rotted queue.** 44+ open PRs wear `merge-conflicts`. Are
   third-party rebases/salvage of *other people's* PRs welcome, or does a
   conflicted PR signal it should be closed?
5. **Old cold feature PRs.** Pre-policy feature PRs with no linked issue:
   grandfathered into review, or redirected to Discussions?
6. **Decision authority.** Confirm the working assumption: Elian gates
   architecture/scope, Adorian gates UX flow; nobody else's approval moves
   a PR. And is there an off-GitHub channel where idea buy-in actually
   happens (the standalone-iOS PR 9539 merged with an empty body and no
   visible discussion)?

## Applying it

- One PR, one lane, one sentence of rationale citing the rule that fired.
  When two rules conflict, prefer the RED rule, then ask.
- These lanes decide *our* facilitation posture; we are contributors, not
  maintainers. We never close, label, or verdict-post on others' work; a RED
  call means "don't invest, and if asked, draft a gated comment explaining
  why," not action against the PR.
- All upstream comments remain gated per `upstream-comment-gate`.
- When triaging, record the lane call and the firing rule in the bead or
  report so later sessions can re-check the reasoning as evidence rots.
