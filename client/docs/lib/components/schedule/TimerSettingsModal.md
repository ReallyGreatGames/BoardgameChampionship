# `lib/components/schedule/TimerSettingsModal.tsx`

[← lib/components/schedule](README.md)

## Purpose

Add/edit modal for a game's default timer settings
([`Game`](../../models/game.md) — duration, round-time, direction, and the
game's available player colors, 4 to 6 of them), reached from a schedule
item's "timer" action.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `TimerSettingsModal` (component) | `TimerSettingsModal({ visible: boolean, gameId: string \| null, onClose: () => void, onCreated?: (newGameId: string) => void }): JSX` | Bottom-sheet form for a game's timer defaults (duration, round seconds, count direction, 4–6 player colors); creates a new `Game`-backed timer-settings document if `gameId` doesn't resolve to one. |

### Props

| Prop | Type | Meaning |
|---|---|---|
| `visible` | `boolean` | Whether the sheet is shown; gates the form-reset effect. |
| `gameId` | `string \| null` | The game id to look up in the timer-settings collection. `null` (or a non-matching id) means "add new". |
| `onClose` | `() => void` | Dismisses the sheet. |
| `onCreated` | `((newGameId: string) => void) \| undefined` | Called with the newly created document's `$id` after an add (not an update), so the caller can attach the freshly-minted id back onto whatever it's associated with. |

### Internal functions

| Function | Signature | Behavior |
|---|---|---|
| `setColor` | `setColor(playerIdx: number, hex: string): void` | Replaces `playerColors[playerIdx]` with `hex` via an immutable array copy. |
| `addColor` | `addColor(): void` | Appends a color to the palette (no-op at `MAX_PLAYER_COLOR_COUNT`), picking the first [`PLAYER_COLOR_OPTIONS`](../../utils/timerColors.md) entry not already in use; collapses any expanded picker. |
| `removeColor` | `removeColor(index: number): void` | Drops the color at `index` (no-op at `MIN_PLAYER_COLOR_COUNT`); collapses any expanded picker. |
| `handleSave` | `handleSave(): Promise<void>` | No-ops if invalid or already saving. Builds `{ durationMinutesTotal: durNum * 4, roundSecondsTotal: roundSecondsNum, direction, colors: playerColors }`; if `existing`, calls `update` with `$id: existing.$id`, otherwise calls `add` and, on success, invokes `onCreated(doc.$id)`. Closes on success; shows a generic `Alert` on failure. Always clears `saving` in `finally`. |

### Derived values

| Value | Type | Computed as |
|---|---|---|
| `existing` | `Game \| undefined` | `collection.find(s => s.$id === gameId)` when `gameId` is set, else `undefined`. The store's collection is keyed on Appwrite's `games` collection, so this is a `Game` document, not a separate timer-settings type. Recomputed on `[collection, gameId]`. |

## How it works

Looks up `gameId` in [`useTimerSettingsStore`](../../stores/appwrite/timer-settings-store.md)'s
collection (`existing`); if found, pre-fills the form (via
[`useDurationRoundFields`](../../hooks/useDurationRoundFields.md)'s
`reset`, converting stored total-duration back to per-player minutes) and
`playerColors` from `existing.colors` (falling back to the 4
[`PLAYER_COLORS`](../../utils/timerColors.md) defaults when the stored list
isn't between [`MIN_PLAYER_COLOR_COUNT` and `MAX_PLAYER_COLOR_COUNT`](../../utils/timerColors.md)).
If no `gameId` or no matching document, starts blank.

On save, either `update`s the existing `Game` document or `add`s a new
one — for a new one, `onCreated(newId)` lets the caller
([`Schedule.tsx`](Schedule.md)) attach the freshly-created game id back
onto the schedule item being edited.

Each player color is edited via a collapsible row containing a
`reanimated-color-picker` panel + hue slider — only one player's picker can
be expanded at a time (`expandedPlayer`). A trailing "Add color" row appends
a slot while under 6 colors, and each row shows a remove control while above
4, so admins can set a game's palette (for example five colors) rather than
being fixed at four.

## Used by

- [`lib/components/schedule/Schedule.tsx`](Schedule.md)
