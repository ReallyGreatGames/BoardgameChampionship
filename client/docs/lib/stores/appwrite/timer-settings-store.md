# `lib/stores/appwrite/timer-settings-store.ts`

[← lib/stores/appwrite](README.md)

## Purpose

Zustand store for the `games` collection ([`Game`](../../models/game.md) —
a game's default timer settings, despite the file's name).

## Exports

### `useTimerSettingsStore` (zustand hook)

| State/Method | Purpose |
|---|---|
| `collection: Game[]` | All `Game` documents — default timer duration/round-time/direction/colors per game |
| `init(): Promise<void>` | `fetchCollection(key, set)` — loads the full `games` collection with no query filter |
| `add(data: GameInput): Promise<Game \| null>` | Creates a `Game` via `addToCollection<Game>(key, data)` with an auto-generated (`ID.unique()`) id, where `GameInput = Omit<Game, keyof Models.Document \| keyof Models.Row>`; returns the created document or `null` (with an `Alert`) on failure |
| `update(item: PartialGame, silent?: boolean): Promise<boolean>` | `updateInCollection(key, item, silent)` — partial update by `item.$id`; `silent` (default `false`) suppresses the failure `Alert`; returns whether the update succeeded |

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
