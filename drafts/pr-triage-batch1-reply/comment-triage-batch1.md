Following up on your ask to look over the open PRs for merge candidates. First pass covers the six untriaged, non-draft, conflict-free outsider PRs; each lane call was independently re-checked before writing.

Merge candidate: 10060, multi-attribute note sorting. Opt-in extension of the existing `#sorted` label, answers open feature request 6829, no new dependencies, first-time contributor. Two small bot findings remain open (a comparator that can return non-zero for equal values when `sortNatural` is false, and a missing malformed-direction fallback test). I can help the author clear both so it reaches you clean.

Already on the right path, nothing needed from us: 10348 (multi-user phase 2, you are reviewing it), 11031 and 10005 (both change default behavior and deserve a design nod before code review), 10826 and 9638 (dev tooling, each needs a maintainer opinion on scope first).

Two policy questions decide how I lane the remaining ~36 open PRs:

1. On issue 649 you announced a plan to work on assigned issues only, with feature requests moving to Ideas voting. Is that in force now? If yes, I will treat PRs on unassigned issues, 10060 included, as needs-discussion rather than merge candidates.

2. During the LLM reintroduction, are any outsider LLM or AI-feature PRs welcome (10553, 9340 to 9343, 9556, 10009), or is that area maintainer-only for now?

_claude-fable-5-high on behalf of matt wilkie_
