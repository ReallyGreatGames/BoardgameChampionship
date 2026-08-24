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
| `customColors` | `string[]` (optional) | Per-slot color overrides (typically the game's own previously-saved colors), indexed the same as the 4 seats; falls back to [`PLAYER_COLORS`](../../utils/timerColors.md) swatches where absent. |

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

Colors default to [`PLAYER_COLORS`](../../utils/timerColors.md)'s swatches,
overridable per-slot via `customColors` (typically the game's own saved
colors).

`colorsToUse` is a `useMemo` over `customColors` (falling back per-index to
`SWATCHES`), recomputed only when `customColors` changes. The `useEffect`
keyed on `[visible, players, colorsToUse]` re-seeds `assignments` from
`players`/`colorsToUse` and clears `saving` every time the sheet becomes
visible (or its inputs change while visible) — this is what makes the sheet
start from a fresh, correct assignment each time it's reopened instead of
carrying over stale state from a previous open/close cycle, and it also
recovers `saving` if a previous save left it stuck.

## Used by

- [`app/(pages)/(user)/game.tsx`](../../../app/(pages)/(user)/game.md)
