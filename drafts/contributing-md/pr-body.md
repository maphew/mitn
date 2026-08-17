## Why

The repository has no CONTRIBUTING.md. The expectations that matter most to
contributors (what fits the project, when to discuss before coding, how
AI-assisted work is treated) exist today only in scattered issue and PR
comments. New contributors, and increasingly coding agents, do not see them
before opening a PR, and review cost lands on you. In #649 you described
this problem directly and mentioned a contribution policy was coming; this
PR is an attempt to help with that, offered for your consideration and
editing.

## What

One short page (under 5 KB, so agents can preload it) distilled only from
public maintainer statements and observed merge decisions. Examples of
sources: the offline requirement (issue 10093), data longevity (issue 676),
options as maintenance commitments (issue 9584), script-vs-core (issue 715),
the bounty and AI statements from May, and the Documentation and Branching
strategy pages in the Developer Guide.

Nothing here is meant as new policy from us. Where your practice was clear,
the draft states it plainly. Two decisions are deliberately left to you:

1. **Feature intake.** The draft asks for prior discussion only for large or
   architectural features. If the "work on assigned issues only, feature
   requests move to Discussions" plan from #649 is now in force, the
   "Before you start" section should say that instead, and the README
   pointer for feature requests would need a matching update.
2. **AI policy.** The draft states only author responsibility and the
   rejection of bounty farming. Anything stricter (disclosure rules, limits
   on generated code) is left out until you say what you want.

## Validation

- All relative links resolve against the repository at the branch point.
- The `pnpm edit-docs:edit-docs` guidance was checked against package.json
  and the Documentation page in the Developer Guide.
- A second model family (GPT-5.6) reviewed the draft against the source
  statements to remove wording that overstated or invented policy.

## Scope

Adds one file. No code or documentation pipeline changes. Please edit
freely, or comment and we will revise.

_claude-fable-5-high on behalf of maphew_
