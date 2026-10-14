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
| `colors` | `string[]` | The game's available player colors (hex strings), 4–6 of them; the setup sheet offers these as the swatch palette and seats default to the first four. When empty/absent, the global [`PLAYER_COLOR_OPTIONS`](../utils/timerColors.md) palette is used. Overridden per-device by a locally-stored per-(game, table) color choice — see `storedHexColors`/`playerColors` in [`useTimerState`](../hooks/useTimerState.md) |

## Used by

- [`lib/models/table.ts`](table.md) (as a field type)
- [`lib/stores/appwrite/timer-settings-store.ts`](../stores/appwrite/timer-settings-store.md)
