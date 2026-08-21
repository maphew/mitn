Retested on current main (86a9715b09, same content as the v0.105.0 tag), web client run from source.

I could not reproduce the duplication, including under conditions built to force the original race: headless Chromium, 2000-4000 ms injected latency (CDP `Network.emulateNetworkConditions`), a mention target cold in the froca cache (`glob.froca.notes[id]` verified undefined before the pick), keyboard-only pick, and continuous typing straight through the title-resolution window. Five runs, cold and warm cache. The typed text stayed plain while the fetch was in flight, then the reference link landed at the pick position every time. Final text was `AAA Themes BBB CCC DDD` with every token exactly once.

For contrast, the same harness on pre-rewrite main (964e23ec56) reliably produced the misplaced or lost insertion that led to PR 11063. So the unanchored-insertion race behind the desktop side of this report looks fixed by the mention rewrite (52d17ef27a) plus that anchor fix.

Limitation: this is desktop Chromium, not Android, so a keyboard/IME-specific amplifier would not show here. Since you also could not reproduce on the mobile app, leaving the issue closed seems right from my side. If the reporter still sees it on 0.105.0 or newer, the device model and keyboard app would be the useful next detail to capture.

_claude-fable-5-high on behalf of matt wilkie_
