# Trilium upstream landscape and contribution strategy (August 2026)

Distilled from a ChatGPT research thread (2026-08-15):
<https://chatgpt.com/share/6a80cffb-786c-83e8-b1da-edd1a8539af1>

All counts and issue/PR states are a snapshot of 2026-08-15 and rot quickly;
re-verify before acting on any specific number or issue.

## Posting gate (standing rule)

**All upstream issue and PR comments are gated for human review before
posting.** Agents draft comment bodies to files and stop; maphew reviews and
posts. This holds until we have been through enough rounds to be confident
the orchestration and harness configuration produce comments that blend well.
Recorded as bead memory `upstream-comment-gate`.

## State of TriliumNext (snapshot)

- Stable v0.104.1 (2026-07-25); `main` deep into v0.105.0 (286 milestone
  items closed, 2 open).
- Three waves: v0.103 (May) expansion (spreadsheets, Markdown notes, OCR in
  search); v0.104 (July) security hardening (16 fixes, Electron isolation,
  no LAN-exposed port by default); post-0.104 architectural again.
- Strongest momentum: standalone/browser/mobile parity (backup/restore for
  low-memory Android and iOS Safari suspension, multi-tab coordination,
  missing browser routes, LLM chat via `trilium-core` into WASM runtime).
- Other active threads: data safety (sync correctness, encrypted backups,
  restore-during-setup), UI componentization in Preact, replacing premium
  CKEditor features with GPL implementations, LLM reintroduction (second
  attempt after v0.102 removed it; treat as high-volatility), deliberate
  testing/performance infrastructure.

## People and throughput

- Extremely concentrated: July 1 to Aug 15, 95 merged PRs by `eliandoran`,
  47 by `adoriandoran` (they are brothers). Surrounding ring: `perfectra1n`
  (imports/infra), `FliegendeWurst` (Nix/TriliumDroid), `BeatLink`
  (scripting/UI APIs), translators.
- Heavily agent-assisted: 84 PRs merged since July 1 say "Generated with
  Claude Code". One Elian commit credits Claude Opus 5 (1M context) as
  co-author.
- Friction: 57 open human PRs, 44 labelled `merge-conflicts`; `main` moves
  fast enough that long-lived branches rot immediately. Bottleneck is
  verification, integration, review, and keeping changes small - not raw
  code production.
- 98 open issues in `State: Triage`; zero `help wanted` / `good first
  issue` - the contribution funnel itself is underdeveloped. Entry point is
  following an active subsystem and taking a loose end, not a curated queue.

## Maintainer communication culture

- **Elian**: low ceremony, high information density, architecture-first,
  skeptical of speculative abstraction ("Too complicated. Extract to a
  function..."), YAGNI on public API surface (no wrappers without an actual
  Trilium consumer). Acceptance function is roughly
  `need x fit x maintenance x correctness`, not just correct code. For
  larger work he asks for the need and design before reading code. Detailed
  only when he has personally reproduced something. Pattern on constraints:
  state constraint, explain invariant, stop.
- **Adorian**: hands-on UX verification. Uses the feature, reports concrete
  behavioral failures, retests after fixes. Corrects himself plainly when
  new evidence arrives. Warmer in Discussions.
- Discussions culture: plain language, concrete tradeoffs, comfortable
  saying "I don't know", strong preference for decomposing contentious work.
  Terse review is bandwidth, not hostility; they solicit product feedback
  before big implementations arrive.
- English is their second language. Do not mimic surface grammar; copy the
  low linguistic entropy: simple sentences, literal vocabulary, few idioms,
  one question at a time, concrete nouns and filenames, "I tested X; Y
  happened."

## Upstream agent infrastructure

- Repo canon: ~41 KB `CLAUDE.md` plus at least eight `.claude/skills/`
  (coverage, CKEditor dev/review/test, startup-request measurement, client
  performance profiling, translation, unit testing). The performance skill
  records disproved hypotheses - institutional memory; rule: "measure
  before predicting."
- Claude Code is the primary coding agent (session links, `claude/...`
  branches, attribution trailers).
- Automated review moved from Gemini Code Assist (shut down July) to
  **Greptile**: diff-aware findings, confidence scores, re-reviews, consumes
  `CLAUDE.md`. Its **Greploop** action orchestrates a closed loop: Claude
  Code fixes findings, re-runs Greptile until 5/5 confidence, max five
  rounds, and is told to push back rather than change correct code to
  satisfy the reviewer.
- **Dosu** is an external knowledge base answering issues; some answers cite
  documents stored outside GitHub.
- `.mcp.json` connects agents to a local Trilium server over ETAPI/MCP -
  Trilium itself is an available agent memory substrate (capability
  confirmed; personal use by maintainers not evidenced).
- Cautionary tale: on issue 10853, Dosu asserted `frontendStartup` /
  `mobileStartup` were mutually exclusive; the reporter encoded that into
  docs PR 10854; Greptile then read the implementation and found multiple
  `run` values are supported. **Agent knowledge is evidence, never
  authority** - code, tests, and reproduced behavior win.

## How we blend in

Operating principle: **agent writes the exhaust; human writes the signal.**
Polished agent prose belongs in PR descriptions and test evidence;
conversational comments stay short:

> I observed X. The cause is Y. The smallest fix is Z. I verified it with Q.
> This part remains uncertain.

For anything architectural, lead with: "Does this solve a problem Trilium
wants to solve, this way?"

Concretely:

- Do not introduce a competing encyclopedic `AGENTS.md` upstream; if
  anything, a thin model-neutral adapter pointing all agents at the existing
  `CLAUDE.md` + `.claude/skills/` canon.
- PR bodies may be detailed (Why / What changed / Validation / Scope - PR
  10825 is a good specimen); comments must be concise and never restate
  automated-review output.
- Small and current beats ambitious and long-running; rebase often.
- Reproduce before fixing; report platform, build, minimal steps.
- Do not expand public APIs without a demonstrated Trilium consumer.
- Loop: pick unassigned triage issue, reproduce on nightly, post findings
  (gated), add regression test, fix only the demonstrated problem, PR.

## Ranked contribution targets (snapshot 2026-08-15)

Triage/verification (highest leverage; 95 unassigned `State: Triage`, nine
also `Difficulty: Easy`):

1. **10663** Android duplicated note-link text - in the mobile momentum
   lane; reproduce, reduce, regression test, small fix. Favorite.
2. **10680** stuck emoji tooltip - explicit repro steps, Linux+Windows;
   safest small code contribution.
3. **10705** tooltip/context-menu glitches - triage value: prove shared vs
   separate root causes before any code.
4. **10668** image resize/whitespace after collapse - forensic: neither
   Elian nor a clean VM reproduces; needs the reporter's exported note. Do
   not code-guess.
5. **9749** Mermaid Gantt/bar disappear on resize - verify against current
   `main` first; Mermaid has active PR work (collision risk).
6. **10854** startup-event docs PR - verify actual `run` semantics and
   leave one short comment; ideal first cultural interaction.

Open-PR validation (humans add what agents cannot):

- **10825** native SQLite Docker artifacts: independent build/run across
  the arch matrix.
- **10371** OIDC token refresh: adversarial testing with a real
  Authentik/Keycloak/Google provider; rotation and concurrency.
- **10633** search overhaul: behavioral skepticism with real databases and
  weird queries; do not touch its code unless asked.
- **10824** plugin manager: threat-model/trust/UX review, not more code
  review.
- **9633** CSS leak fix: test whether `main` still has the bug; if yes, a
  tiny salvage/rebase contribution.

Avoid first: giant new features, multi-user, another LLM provider, and the
two v0.105 milestone issues (assigned to `adoriandoran`).

## Helper tooling worth building (in mitn, not upstream)

- `triage-report`: emit the standard evidence record (build, environment,
  reproduces, clean profile, minimal steps, expected, actual, scope,
  regression, artifact).
- `contrib-preflight`: from changed paths, print/run smallest applicable
  tests, `pnpm typecheck`, `git diff --check`.
- `pr-context`: before editing, report linked issue/discussion, overlapping
  open PRs, relevant `CLAUDE.md` section and skill, divergence from `main`.
