# `lib/components/onboarding/PlayerColorSetupModal.tsx`

[← lib/components/onboarding](README.md)

## Purpose

Modal for assigning the 4 timer seats to specific players and colors,
laid out to mirror the physical timer grid.

## Exports

### `PlayerColorSetupModal(props: Props): JSX.Element`

| Prop | Type | Meaning |
|---|---|---|
| `visible` | `boolean` | Whether the sheet is shown; also gates the reset effect (see below). |
| `onClose` | `() => void` | Called when the sheet is dismissed without saving. |
| `players` | [`Player[]`](../../models/player.md) | Candidate players to cycle through for each of the 4 seats. |
| `onSave` | `(playerIds: (string \| null)[], colors: string[]) => Promise<void>` | Called with the 4 seats' assigned player ids (in seat order, `null` for an unassigned seat) and their hex colors; awaited while `saving` is shown. |
| `customColors` | `string[]` (optional) | The game's available colors ([`Game.colors`](../../models/game.md), 4–6 hex strings). When present and non-empty it becomes the swatch palette; otherwise the global [`PLAYER_COLOR_OPTIONS`](../../utils/timerColors.md) palette is offered. Seats default to its first four entries. |
| `initialColors` | `string[]` (optional) | Current seat assignments, separate from the available palette; falls back per seat to the game's colors or the default palette. |
| `allowPlayerReassignment` | `boolean` (optional, default `true`) | When false, player names remain fixed and only colors can change. |
| `title`, `saveLabel` | `string` (optional) | Override the setup title and "Save & Open Timer" label when editing an active timer. |

`Assignment` (internal, not exported): `{ playerId: string | null; color: string }` — one seat's current player/color pairing, held 4-wide in `assignments` state.

### Internal functions

| Function | Signature | Behavior |
|---|---|---|
| `cyclePlayer` | `(posIdx: number): void` | Advances seat `posIdx` to the next player in `players` (wrapping via modulo); no-ops if `players` is empty. |
| `setColor` | `(posIdx: number, hex: string): void` | Sets seat `posIdx`'s color to `hex` in `assignments`. |
| `handleSave` | `(): Promise<void>` | Guards against double-submit via `saving`, then calls `onSave` with the assignments split into parallel `playerIds`/`colors` arrays, toggling `saving` around the call. |

## How it works

`GRID_ROWS = [[0,1],[3,2]]` deliberately mirrors the timer's own visual
grid layout (top row seats 0/1, bottom row seats 3/2) rather than a plain
sequential 0-1-2-3, so this setup screen's spatial layout matches what
players will actually see on the timer screen.

Tapping a seat's player name cycles to the next player in `players`
(`cyclePlayer`) rather than opening a picker — the small, always-4-slot UI
doesn't need a full selection modal. `hasDuplicatePlayers` disables saving
(with an explanatory message) if the same player got assigned to more than
one seat.

The swatch palette comes from `customColors` (the game's configured colors)
when present, and otherwise from the global
[`PLAYER_COLOR_OPTIONS`](../../utils/timerColors.md) 6-color list — so a game
configured with five colors offers exactly those five. Seats default to the
first four palette entries (`defaultColors`). `initialColors` seeds seat
selections without changing the available palette. Duplicate palette entries
render once; swatches expose their player, hex color, and selected state for
accessibility.

`palette` and `defaultColors` are `useMemo`s over `customColors`, recomputed
only when it changes. The `useEffect` keyed on
`[visible, players, defaultColors, initialColors]` re-seeds `assignments` from
`players`/`initialColors`/`defaultColors` and clears `saving` every time the sheet becomes
visible (or its inputs change while visible) — this is what makes the sheet
start from a fresh, correct assignment each time it's reopened instead of
carrying over stale state from a previous open/close cycle, and it also
recovers `saving` if a previous save left it stuck.

## Used by

- [`app/(pages)/(user)/game.tsx`](../../../app/(pages)/(user)/game.md)
- [`app/(pages)/(user)/timer.tsx`](../../../app/(pages)/(user)/timer.md) — edits colors with fixed player positions
