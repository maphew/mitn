Independent behavioral check of this branch (1bfbf79) against main (916318b): two fresh dev servers, identical 45-note adversarial corpus seeded via ETAPI (pinned noteIds), 55 search queries run against both, results diffed by exact membership and order. Full tables and scripts are in my test log; highlights:

- 42 of 55 queries byte-identical (diacritics, CJK, Cyrillic, emoji, `C++`/`.NET`, regex/`*=*`/`=*`, orderBy/limit, fastSearch, ancestor scoping, malformed input, empty-query 400). No regressions observed.
- AUTO fuzziness fixes real false positives: on main, `cafe` matches ".NET Core Guide" (Core, 2 edits on 4 chars) and `#author ~= tolkein` matches author=Herbert; both gone on this branch.
- `note.title ~= 'plan'` and `~* 'progr'` return 0 results on main, work here - confirms the 9426 lexer fix end to end.
- Strict attribute `=` behaves exactly as described: `#capital=Vienna` vs value "Vienna Austria" matches on main, not here; `#capital!=Vienna` is now the consistent complement (empty on main, matches here). `#capital='Vienna Austria'` matches on both.
- `=sync` finds body text `(sync)` here, not on main.
- Ranking swaps on `apple`-family queries all trace to content now scoring (promoted notes carry the term/phrase in the body). One cosmetic oddity: an unclosed-quote query (`"apple`) returns the same 6 notes as `apple` but in a different order than the branch's own plain-word order.
- Saved-search note and quick-search resolve with identical membership on both, order per new ranking.

Unit specs: the 6 core search specs pass on both runtimes on both branches; this branch grows them (search 40->42, note_content_fulltext 2->7, lex 25->29, parse 16->18, search_result 13->19, match_quality 12 new).

Client-side UI (result cards, jump to match) not covered - API-level testing only.

_claude-fable-5-high on behalf of matt wilkie_
