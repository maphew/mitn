# Critical review

The draft is a strong starting point and already fits the size target at 4,026 bytes. It is not ready unchanged, mainly because it turns several predictions from the rubric into official-sounding rules. The largest problems are the blanket feature pre-approval rule and the AI section.

The evidence rubric itself says that Trilium has no written acceptance policy and that much of the rubric is inferred from behavior. A merged `CONTRIBUTING.md` may establish new policy, but outsiders should make those choices explicit for maintainers instead of silently presenting them as settled.

## A. Overreach

- [Lines 3-5](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:3>): “Review time is our scarcest resource” is an unsupported superlative and speaks for maintainers.

  Suggested replacement:

  > Trilium is maintained by a small team. Small, focused contributions are easier to review.

  “With the least friction” should also be removed or simplified.

- [Lines 12-22](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:12>): Offline operation and data longevity are directly supported. “The data of existing users is sacred,” “very strong reason,” and “careful migration plan” are outsider-authored policy language, not documented maintainer wording.

  Suggested replacement for the third rule:

  > Protect existing user data. Discuss changes to storage, sync, or encryption with maintainers before coding because these changes can put existing data at risk.

  Also replace “Three rules follow from this and apply to every change” with “Keep these project constraints in mind.”

- [Line 26](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:26>): “Bug fixes are the easiest contribution to accept” is a historical inference, not a stated rule.

  Suggested replacement:

  > Small, reproducible bug fixes are usually easier to review.

- [Lines 28-33](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:28>): The advice is sensible, but several absolutes are stronger than the evidence. In particular, “We only merge fixes for problems we can see” could exclude failures demonstrated by logs or tests, while “one fix per pull request” generalizes evidence about splitting unrelated work.

  Suggested wording:

  > - Check whether the bug still occurs on the latest nightly build, and say which version you tested.  
  > - Give reproduction steps, relevant logs, or a failing test.  
  > - Fix the underlying cause rather than only hiding the symptom.

  Put “Keep each pull request focused on one problem” in the pull-request section.

- [Lines 37-40](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:37>): This is the most important overreach. “Wait for a maintainer response before you start writing a feature” creates a blanket gate that is not established by the evidence. Small, linked, opt-in features have merged without prior discussion. The only evidence for an all-work gate is the May 2026 announced plan to work on assigned issues only, whose current status the rubric explicitly calls unconfirmed.

  The draft should not invent a compromise between the old practice and the announced plan. Use one of two forms:

  If the plan remains unconfirmed:

  > For a large or architectural feature, open or find an issue and wait for maintainer feedback before coding. For a smaller feature, link an existing request and keep the new behavior opt-in.

  If maintainers ratify the announced policy:

  > Please work only on issues assigned to you. Use GitHub Discussions for new feature ideas and voting.

  The latter would also require updating the README, which currently directs feature requests to GitHub Issues.

- [Lines 39-40](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:39>): “Features nobody asked for” is dismissive, and “the review costs us more than the code is worth” puts a value judgment in maintainers’ mouths.

  Suggested replacement:

  > Discussing the idea first avoids work on changes that may not fit the project.

- [Lines 42-57](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:42>): These lists are substantially supported and already use probabilistic language. They can remain, with two changes:

  - Replace “has a good chance” with “is easier to review when.”
  - Replace “Every option is a permanent maintenance and testing cost” with “Each setting adds long-term maintenance work.”

- [Lines 56-57](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:56>): “Authentication schemes (use a reverse proxy)” overgeneralizes one Basic Authentication decision. Trilium currently includes OpenID and TOTP support, so authentication as a whole is not outside the application.

  Suggested replacement:

  > is better handled outside Trilium, such as HTTP Basic Authentication at a reverse proxy or a packaging-only change.

- [Lines 59-63](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:59>): Mobile and `trilium://` have direct evidence as maintainer-led areas. Sync, encryption, and storage are high-risk discussion areas. “Other items on the roadmap” is undefined, and “will be closed” turns a discuss-first lane into automatic rejection.

  Suggested replacement:

  > Some areas are maintainer-led because they involve significant architectural risk. These include mobile, sync and encryption architecture, protocol or storage changes, and areas under active maintainer redesign. Discuss these changes first; they are unlikely to be reviewed without an agreed plan.

- [Lines 65-67](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:65>): Pre-agreed design is supported for architecture-scale work. Phased delivery with no visible change is mainly an accepted example that the rubric generalized, not a universal policy.

  Suggested replacement:

  > For a large feature, agree on the design and delivery phases before implementation. Explain how partial work will avoid disrupting existing users.

- [Line 73](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:73>): “Add tests for new logic, especially around third-party libraries” is not evidenced by the rubric. It is reasonable engineering guidance, but maintainers should knowingly approve it as a new requirement.

  Safer wording:

  > Add or update tests for behavior changed by the pull request. See the Testing guide for available test suites.

- [Lines 78-79](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:78>): Merge-time estimates come from historical sampling, not a service commitment, and will become stale. “Keep the branch rebased” is also unsupported and may encourage repeated force-pushes.

  Suggested replacement:

  > Review can take time, especially for large changes. If the branch conflicts with `main`, a maintainer may ask you to update it.

- [Lines 83-90](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:83>): The AI section needs substantial revision.

  - “We use AI tools ourselves” unnecessarily speaks for maintainers.
  - “Under one condition” followed by “fully understand, test, and be able to defend every line” invents an absolute standard. The evidence supports author verification, not this exact test.
  - “Defend” is combative and unclear.
  - Rejection of bounty-only AI contributions is directly supported.
  - “We will close these without detailed review” states an enforcement procedure that was not quoted.
  - “Most of the implementation [must] be your own” generalizes a roughly 10% limit stated for one architecture-scale context. The rubric explicitly says ordinary-PR expectations need confirmation.

  Suggested complete replacement:

  > ## AI-assisted contributions  
  >  
  > You are responsible for everything you submit, whether or not you used AI. Review and test generated changes, and be ready to explain them.  
  >  
  > We do not accept AI-generated contributions submitted mainly to collect a bounty. Bulk or unverified submissions may be closed without detailed review. For architecture-scale work, agree with a maintainer on the design and expectations for AI use before coding.

- [Lines 92-94](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:92>): This is not overreach. It exactly matches the repository’s existing `CODE_OF_CONDUCT`.

## B. Omissions

- The draft does not resolve the most important contributor question: where feature ideas should go and whether work must first be assigned. This omission is appropriate until maintainers decide whether the May plan is in force, but the v2 proposal should call out that decision explicitly. Do not silently treat “wait for a response” as ratification.

- Changes to default behavior or visible UI defaults are an important discussion-first category in the evidence. Add near the feature criteria:

  > Discuss changes to default behavior, visible UI defaults, or new settings before implementation.

- Storage-model changes are missing from the maintainer-led/high-risk list. Add “storage changes” or “storage model” alongside sync and encryption.

- Architecture-scale work has sometimes required demonstrated user-level knowledge of Trilium. If maintainers want that requirement, state it plainly:

  > For a large architectural change, explain your experience with the affected part of Trilium.

  Because this could discourage new contributors, it should be included only after explicit maintainer approval.

- A screenshot is a useful omission for user-interface work and is supported by successful-PR history. Add to the PR checklist:

  > Include a screenshot or short recording when the user interface changes.

- The guide is titled broadly but concentrates on code contributions. The existing README already covers translations through Weblate and documentation contributions. Either add one short link for those paths or make the scope explicit in the introduction.

- It is correct to omit a fixed rule about in-core LLM work. The evidence calls that area volatile and says the current maintainer position must be confirmed.

- Third-party ecosystem promotion, contributor track record, and requests framed in another application’s data model can remain omitted. They are too specialized for a guide with a 5 KB target.

## C. Tone and standing

Writing in project voice is appropriate if maintainers merge the file. The problem is not the word “we” itself. The problem is outsiders assigning priorities, motives, and enforcement decisions to maintainers.

The main tone problems are:

- [Line 4](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:4>): “our scarcest resource”
- [Line 20](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:20>): “data ... is sacred”
- [Line 39](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:39>): “features nobody asked for”
- [Line 40](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:40>): “more than the code is worth”
- [Line 52](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:52>): “niche needs belong there”
- [Line 63](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:63>): “will be closed”
- [Line 83](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:83>): “We use AI tools ourselves”
- [Line 84](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:84>): “defend every line”
- [Lines 89-90](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:89>): attributing AI-authorship expectations that have not been confirmed

Prefer neutral explanations of reviewability and project fit. Avoid predicting that maintainers “will close” something unless they explicitly choose that enforcement language.

The upstream PR description should also explain that this is proposed wording distilled from public statements and observed decisions, with the feature-intake and AI rules intentionally left for maintainer confirmation.

## D. Plain English

Concrete simplifications:

- [Lines 4-5](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:4>): Replace “scarcest resource” and “least friction” with “Small, focused changes are easier to review.”

- [Lines 12-14](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:12>): Replace “Three rules follow from this” with “Keep these project constraints in mind.”

- [Lines 20-22](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:20>): Replace the “sacred” metaphor with “Protect existing user data.”

- [Line 30](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:30>): Replace “problems we can see” with “problems reviewers can reproduce or verify.”

- [Lines 31-32](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:31>): “Root cause” is common developer language, but “underlying cause” is simpler.

- [Line 44](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:44>): A feature does not “answer an issue.” Use “implements an existing feature request.”

- [Lines 51-52](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:51>): Replace “niche needs belong there” with “For a specialized need, consider a user script or custom widget.”

- [Lines 56-57](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:56>): Replace “belongs to another layer” with “is better handled outside Trilium.”

- [Lines 59-60](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:59>): Replace “are driven by the core team” with “are maintainer-led.”

- [Lines 65-67](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:65>): Split the long sentence into separate design and rollout sentences.

- [Line 79](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:79>): Replace “keep the branch rebased” with “update the branch if it conflicts with `main`.”

- [Lines 83-85](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:83>): Replace “defend every line” with “explain the change.”

## E. Length and structure

At 4,026 bytes, the draft is already below the approximate 5 KB limit. Do not add the full triage rubric or its edge cases.

The best cuts are:

- Compress the introduction.
- Combine the maintainer-led and large-feature paragraphs.
- Remove merge-time estimates.
- State the focused-PR rule only once.
- Replace the AI section with three short sentences.
- Keep specialized cases such as LLM integrations and third-party ecosystem promotion out of the guide.

These cuts should leave enough room for the missing “default behavior/UI changes” and screenshot guidance while keeping the file near 3.5-4 KB.

Recommended section order:

1. Before you start: search existing work and state the issue/assignment/Discussion rule once maintainers decide it.
2. Project constraints.
3. Bug fixes.
4. Features.
5. Pull-request checklist.
6. AI-assisted contributions.
7. Conduct.

The current order is otherwise reasonable, but the intended feature-intake rule is too important to bury halfway through the document.

## F. Factual and workflow issues

- [Line 8](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:8>): The Developer Guide link points to a directory, not directly to build instructions or code layout. Link the specific [Environment Setup](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/docs/Developer Guide/Developer Guide/Environment Setup.md:1>) and [Project Structure](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/docs/Developer Guide/Developer Guide/Project Structure.md:1>) pages.

- [Lines 28-29](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:28>): The nightly URL is correct and matches the repository’s current README. The problem is the word “or”: a bug may exist in the latest stable release but already be fixed in nightly.

  Better:

  > Check whether the bug still occurs on the latest nightly build. If you cannot run nightly, say which release you tested.

- [Line 57](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:57>): The authentication example is too broad because Trilium itself supports some authentication systems. Narrow it to HTTP Basic Authentication or remove the example.

- [Line 72](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:72>): Not every related issue should be closed by a PR.

  Better:

  > Link the related issue. Use a GitHub closing keyword only when the pull request fully resolves it.

- [Lines 74-76](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:74>): The statement is correct only for `docs/User Guide`. The official documentation says the Developer Guide and release notes may be edited directly. Also, `edit-docs` is a repository app/command, not an ordinary workflow inside an installed Trilium application.

  Better:

  > For changes under `docs/User Guide`, run `pnpm edit-docs:edit-docs`; do not normally edit those Markdown files directly. The Developer Guide and release notes may be edited directly.

- [Line 77](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:77>): This is factually supported. The Branching Strategy says each PR must be manually tested and reviewed by a maintainer.

- [Lines 78-79](</var/home/matt/dev/mitn/.worktrees/trilium/contributing-md/CONTRIBUTING.md:78>): Remove merge-time predictions and continuous-rebase language. Ask contributors to update a branch only when it conflicts or a maintainer requests it.

- The current README still says GitHub Issues are for feature requests. If maintainers adopt the Discussions-and-voting plan, update that README sentence in the same PR or explicitly create follow-up work. Otherwise the project will publish contradictory instructions.

## Verdict

Yes, this is ready to consolidate into a v2 after fixes and then propose upstream for consideration. It is not ready to submit unchanged. The v2 should leave two explicit decisions to maintainers: whether assigned-issue/Discussions policy is now in force, and how much AI-specific policy they actually want beyond author responsibility and rejection of bounty farming.

## Top 5 changes

1. Resolve the feature-intake rule: either keep it limited to large/architectural work or explicitly ratify “assigned issues only” plus Discussions, with a matching README update.
2. Rewrite the AI section around author responsibility and verified work; remove claims about maintainers’ AI use and unsupported authorship percentages.
3. Narrow the maintainer-led section and remove automatic “will be closed” language.
4. Correct workflow details: User Guide versus other documentation, related versus closing issues, rebase only when needed, and the overbroad authentication example.
5. Simplify the tone and language, then use the saved space for default/UI-change discussion and screenshot guidance.