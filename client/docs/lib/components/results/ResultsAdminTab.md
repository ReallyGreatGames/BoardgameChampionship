# `lib/components/results/ResultsAdminTab.tsx`

[← lib/components/results](README.md)

## Purpose

The admin results dashboard for one game: a filterable/sortable overview
grid of every table's [`TableCard`](TableCard.md), plus a per-table input
mode for entering placements/scores/notes and reviewing signatures. The
single largest and most stateful component in the app.

## Exports

| Export | Purpose |
|---|---|
| `ResultsAdminTab` (component) | No props — reads everything from stores itself |
| `BellFilter` | `"any" \| "active" \| "acknowledged"` |
| `SubmitFilter` | `"all" \| "submitted" \| "notSubmitted"` |
| `TimerFilter` | `"any" \| "running" \| "noTimer"` |
| `SortOrder` | `"table" \| "totalTimer" \| "minTimer" \| "resultStatus" \| "bellFirst" \| "sigsFirst"` |

These filter/sort types are re-exported for
[`ResultsFilterDialog`](ResultsFilterDialog.md), which is otherwise a pure
controlled-props component with no store access of its own.

### Internal handlers and helpers

| Function | Signature | Behavior |
|---|---|---|
| `globalPos` | `(tableNumber: number): number` | Converts a per-game table number into its position across the whole tournament (`tableNumber + tablesPerGame * gameIndex`), used for the `globalLabel` header text in input mode. |
| `resultForTable` | `(tableNumber: number): Result \| undefined` | Looks up the `Result` document for a table number within `selectedGameId`; called from several memos so it's a stable `useCallback`. |
| `resetFilters` | `(): void` | Resets `bellFilter`/`submitFilter`/`timerFilter`/`sortOrder` to their defaults; wired to the filter dialog's Reset button. |
| `handleSave` | `(): Promise<void>` | Confirms via `useDialog()`, then builds a `Result` payload from the current form state (`placements`, `scores` parsed with `parseFloat(s) \|\| 0`, trimmed `note`, existing or blank `signatureIds`, `submitted`) and either `update`s or `add`s it through `resultStore`, guarded by `saving` against double-submit. No-ops if there's no current table/game or a save is already in flight. |
| `handleSetPlacement` | `(seatIdx: number, value: string): void` | Sets seat `seatIdx`'s entry in the `placements` array. |
| `handleSetScore` | `(idx: number, value: string): void` | Sets seat `idx`'s entry in the `scores` array (string form; parsed to a number only at save time). |
| `handleJump` | `(): void` | Parses `jumpText` as an integer, finds the matching table by `tableNumber` in `gameTables`, and jumps `currentTableIdx` to it, clearing `jumpText`; silently no-ops if the text isn't a valid number or no table matches. |
| `handleBellPress` | `(bell: TableBell): Promise<void>` | Dismisses (if already acknowledged) or acknowledges (otherwise) the bell via [`useTableBellActions`](../../hooks/useTableBellActions.md), each with its own confirmation dialog copy; dismiss is marked `destructive`. |
| `handleCloseModal` | `(): void` | Closes the signature modal and resets `confirmingReset` to `false`. |
| `handleResetSingleSignature` | `(): Promise<void>` | Clears the signature at `sigModalIdx` in `currentResult.signatureIds` and persists the update via `resultStore.update`, then closes the modal. No-ops if there's no current result or no signature slot selected. |

## How it works

### Two modes, one header

`mode: "overview" | "input"` toggles between the table grid and the
per-table entry form; both share a sticky header (search + filters button
in overview, a game `Combobox` + progress stats in both).

### Building `TableEntry[]`

`seatsByTable` groups the (all-games) timer-seats collection by table
**once per `selectedGameId` change**, rather than re-filtering the whole
collection inside the per-table map below — avoids rescanning every seat of
every game for every table on every render. `tableEntries` then maps each
of the current game's tables into a [`TableEntry`](types.md), resolving the
effective timer settings via
[`resolveEffectiveTimer`](../../utils.md) — the exact same function the
live timer ([`useTimerState`](../../hooks/useTimerState.md)) uses, so the
two can never resolve a table's duration/round-time/direction differently.

### Filtering and sorting

`filteredEntries` applies the search query (table number, team name,
player name) and the three filters independently; `sortedEntries` then
sorts by whichever `SortOrder` is active — several orders (`totalTimer`,
`minTimer`) push tables with no timer at all to the end rather than
sorting them as if they had zero time remaining.

### Responsive grid

`numColumns` (1 or 2) is derived from the grid's own **measured** width
(`onLayout`), not `window`/`Dimensions` width — window width shifts with
browser zoom on web, which made the column count flicker between 1 and 2
at the same physical, zoom-independent layout size.

### Input mode: keyboard navigation (web only)

A global `keydown` listener (skipped while an `<input>`/`<textarea>` has
focus) lets ←/→ step between tables. Within a row,
[`PlayerResultRow`](PlayerResultRow.md)'s own Tab-handling wires each
row's score field and chip group into a single tab sequence across all 4
seats via `rowRefs` (an array of imperative handles) — see that
component's docs for why native DOM listeners are needed for this on web.

### Resetting the input form on table change

A `useEffect` keyed on `[currentResult, currentTableIdx]` re-seeds
`placements`/`scores`/`note`/`submitted` from `currentResult` (or blanks
them if there's none) every time either changes. `currentTableIdx` is
included even though `currentResult` is the actual data source, because
`currentResult` can be `undefined` for two different tables in a row (no
result saved yet) — without `currentTableIdx` in the dependency array,
switching from one empty table to another empty table wouldn't re-fire the
effect, and the previous table's already-blank-but-since-edited form state
would silently carry over into the new one.

### Saving a result

`handleSave` always confirms first, then either `update`s the existing
[`Result`](../../models/result.md) or `add`s a new one; `scores` are parsed
with `parseFloat(s) || 0` (a non-numeric or empty entry becomes `0`, not
left `undefined`).

### Validation warnings

Three independent, non-blocking warnings can show above the note field:
missing signature (`missingSig`), a score/placement conflict
([`hasScorePlacementConflict`](../../utils/placements.md)), and an invalid
placement combination
([`isValidPlacementCombo`](../../utils/placements.md)) — none of them
prevent saving, they're advisory only.

### Signature viewing/reset

Tapping a filled signature slot opens
[`ScoreSignatureModal`](ScoreSignatureModal.md) with that signature's SVG
(fetched from the `signatures` storage bucket); resetting one requires an
extra in-modal confirmation step (`confirmingReset`) on top of the modal's
own reset button.

## Used by

- [`app/(pages)/(admin)/admin/index.tsx`](../../../app/(pages)/(admin)/admin/index.md)

## Related

Composes nearly every other file in this directory, plus
[`ChipGroup`](../ui/ChipGroup.md), [`Combobox`](../ui/Combobox.md),
[`Dialog`](../ui/Dialog.md), [`EmptyState`](../ui/EmptyState.md),
[`SearchInput`](../ui/SearchInput.md), and
[`useTableBellActions`](../../hooks/useTableBellActions.md).
