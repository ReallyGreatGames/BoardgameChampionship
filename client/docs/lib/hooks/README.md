# `lib/hooks`

[← lib](../README.md)

Reusable React hooks that aren't tied to one specific UI component — mostly
either device-persisted preferences, cross-store lookups, or the app's
biggest single piece of client-side state: the timer.

## Files

| File | Purpose |
|---|---|
| [useDurationRoundFields.md](useDurationRoundFields.md) | Shared form state/validation for duration + round-time + direction fields |
| [useLotteryActions.md](useLotteryActions.md) | Take/pick/upload/delete lottery photos |
| [usePlayerTable.md](usePlayerTable.md) | Looks up which table the current player sits at for a game |
| [useRequireAuth.md](useRequireAuth.md) | Redirects to login if there's no authenticated user |
| [useSecureStoragePerGame.md](useSecureStoragePerGame.md) | Generic per-game, per-device preference storage |
| [useTableBellActions.md](useTableBellActions.md) | Ring/dismiss/acknowledge table bells |
| [useTimerLocalSettings.md](useTimerLocalSettings.md) | Local (non-synced) timer orientation/pause-mode preference |
| [useTimerState.md](useTimerState.md) | The entire interactive timer — the most complex piece of logic in the app |
