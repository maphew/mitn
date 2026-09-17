Observed from reading the code, not from a reproduction (no Windows host available).

Neither v0.102.1 nor current main has logic that closes other windows when one window closes. On main:

- The only `close` handler is the main window's close-to-tray interceptor (`apps/desktop/src/services/window.ts`), and it hides the window instead of quitting.
- Extra windows have no `close` handler.
- The `close-window` IPC closes only the sender's window.
- `window-all-closed` calls `app.quit()` only after every window is already gone.
- No Alt+F4 key binding exists in the client or the main process.

So "all windows freeze for a few seconds, then all close" looks more like the main process stalling or exiting than an intended close-all.

Two things changed since 0.102.1: `@electron/remote` was removed, and since 642f95b769 extra windows are opened through `window.open` with `outlivesOpener: true`. The behaviour could differ on a current nightly.

Details that would help narrow it down:

1. Does it still happen on a current nightly?
2. Was Alt+F4 pressed in the main window or in an extra window, and does it differ between the two?
3. Does the title-bar X button behave the same as Alt+F4?
4. The backend log lines from the moment of the close.

Uncertainty: the cause is not established. This rules out the obvious code paths and does not confirm a crash.
