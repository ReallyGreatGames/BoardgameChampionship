# `lib/components/results/ResultsFilterDialog.tsx`

[← lib/components/results](README.md)

## Purpose

Bottom-sheet with the overview grid's filter (bell/submit/timer) and sort
controls, as four independent [`ChipGroup`](../ui/ChipGroup.md)s.

## Exports

### `ResultsFilterDialog(props: ResultsFilterDialogProps): JSX.Element`

The filter/sort value types (`BellFilter`, `SubmitFilter`, `TimerFilter`,
`SortOrder`) are imported from [`ResultsAdminTab.tsx`](ResultsAdminTab.md),
which owns the actual state.

| Prop | Type | Meaning |
|---|---|---|
| `visible` | `boolean` | Whether the bottom sheet is shown. |
| `onClose` | `() => void` | Called to dismiss the sheet (backdrop tap or the Done button). |
| `bellFilter` | `BellFilter` | Current bell filter value (`"any" \| "active" \| "acknowledged"`). |
| `onBellFilterChange` | `(v: BellFilter) => void` | Called when the bell `ChipGroup` selection changes. |
| `submitFilter` | `SubmitFilter` | Current submit-status filter value (`"all" \| "submitted" \| "notSubmitted"`). |
| `onSubmitFilterChange` | `(v: SubmitFilter) => void` | Called when the submit `ChipGroup` selection changes. |
| `timerFilter` | `TimerFilter` | Current timer filter value (`"any" \| "running" \| "noTimer"`). |
| `onTimerFilterChange` | `(v: TimerFilter) => void` | Called when the timer `ChipGroup` selection changes. |
| `sortOrder` | `SortOrder` | Current sort order (`"table" \| "totalTimer" \| "minTimer" \| "resultStatus" \| "bellFirst" \| "sigsFirst"`). |
| `onSortOrderChange` | `(v: SortOrder) => void` | Called when the sort `ChipGroup` selection changes. |
| `onReset` | `() => void` | Called when the Reset footer button is pressed; the dialog does not decide what "reset" means, it just forwards the tap. |

## How it works

Purely a controlled component — no store access, no local filtering logic;
every change is reported straight to the parent via the `on*Change` props.

## Used by

- [`lib/components/results/ResultsAdminTab.tsx`](ResultsAdminTab.md)
