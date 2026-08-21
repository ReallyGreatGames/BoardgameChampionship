# `lib/models/game.ts`

[← lib/models](README.md)

## Purpose

Appwrite document type `Game` — a game/title of the tournament, with its
default timer settings.

## Exports

### `type Game`

| Field | Type | Meaning |
|---|---|---|
| `durationMinutesTotal` | `number` | Default total duration in minutes |
| `roundSecondsTotal` | `number` | Default round/turn time budget per seat, in seconds. `0` disables the round-timer feature for tables using this game's default settings |
| `direction` | `"up" \| "down"` | Default timer display direction (counting up from 0, or down from the pool duration) |
| `colors` | `string[]` | Default per-seat player colors (hex strings), indexed by seat position; overridden per-device by a locally-stored per-(game, table) color choice — see `storedHexColors`/`playerColors` in [`useTimerState`](../hooks/useTimerState.md) |

## Used by

- [`lib/models/table.ts`](table.md) (as a field type)
- [`lib/stores/appwrite/timer-settings-store.ts`](../stores/appwrite/timer-settings-store.md)
