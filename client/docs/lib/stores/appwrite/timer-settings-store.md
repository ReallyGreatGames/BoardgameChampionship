# `lib/stores/appwrite/timer-settings-store.ts`

[← lib/stores/appwrite](README.md)

## Purpose

Zustand store for the `games` collection ([`Game`](../../models/game.md) —
a game's default timer settings, despite the file's name).

## Exports

### `useTimerSettingsStore` (zustand hook)

| State/Method | Purpose |
|---|---|
| `collection: Game[]` | All `Game` documents |
| `init()` | Loads the collection |
| `add(data)` | Creates a `Game` |
| `update(item, silent?)` | Partial update by `$id` |

### Types

- `PartialGame` — `Partial<Game> & { $id: string }`, the shape `update` expects.
- `PartialTimerSettings` — `@deprecated` alias of `PartialGame`, kept for
  backwards compatibility with older call sites.

## Used by

- [`lib/hooks/useTimerState.ts`](../../hooks/useTimerState.md) — reads a game's default duration/round-time/direction/colors
- [`lib/components/results/ResultsAdminTab.tsx`](../../components/results/ResultsAdminTab.md)
- [`lib/components/schedule/TimerSettingsModal.tsx`](../../components/schedule/TimerSettingsModal.md)
- [`lib/bootstrap/RealTimeStoreProvider.tsx`](../../bootstrap/RealTimeStoreProvider.md)

## Related

- [`lib/models/game.ts`](../../models/game.md)
- [`lib/utils.ts`](../../utils.md) — `resolveEffectiveTimer` merges this with a table's own [`Timer`](../../models/timer.md) override
