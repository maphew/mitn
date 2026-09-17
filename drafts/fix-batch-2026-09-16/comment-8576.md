This looks resolved by PR 8431, which shipped in v0.102.0.

Observed: the reporter's settings are First day of the week = Sunday and First week = contains first day of the year. In 0.101.1, `getWeekNumberStr()` in `date_notes.ts` used dayjs `isoWeek()` and `isoWeekYear()`. Those are always Monday-based, so Sunday 2026-02-01 resolved to ISO week 2026-W05 (Jan 26 to Feb 1). That week starts in January, so the day note landed under January > Week 5. With a Sunday week start the expected result is February > Week 6.

Current main: `getWeekNumberStr()` and `getWeekNote()` use `getWeekInfo()` and `getFirstDayOfWeek1()` from `packages/commons/src/lib/week_utils.ts`. Both honour `firstDayOfWeek` and `firstWeekOfYear`. `week_utils.spec.ts` already asserts this exact case ("2026-02-01 (Sunday) should be 2026-W06").

Uncertainty: checked by reading the code and by hand calculation, not by running 0.102+ with these settings. Week notes that 0.101.x already created keep their old ISO-based `#weekNote` labels. The warning on the settings page covers that. A journal that mixes old and new week notes might therefore still show a few oddly placed days around the upgrade date.

Advise closing if the reporter confirms on 0.102 or later.
