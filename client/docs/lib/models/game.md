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
| `direction` | `"up" \| "down"` | Default display direction |
| `colors` | `string[]` | Default player colors |

## Used by

- [`lib/models/table.ts`](table.md) (as a field type)
- [`lib/stores/appwrite/timer-settings-store.ts`](../stores/appwrite/timer-settings-store.md)
