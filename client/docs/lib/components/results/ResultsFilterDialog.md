# `lib/components/results/ResultsFilterDialog.tsx`

[← lib/components/results](README.md)

## Purpose

Bottom-sheet with the overview grid's filter (bell/submit/timer) and sort
controls, as four independent [`ChipGroup`](../ui/ChipGroup.md)s.

## Props

`{ visible, onClose, bellFilter, onBellFilterChange, submitFilter,
onSubmitFilterChange, timerFilter, onTimerFilterChange, sortOrder,
onSortOrderChange, onReset }` — the filter/sort value types (`BellFilter`,
`SubmitFilter`, `TimerFilter`, `SortOrder`) are imported from
[`ResultsAdminTab.tsx`](ResultsAdminTab.md), which owns the actual state.

## How it works

Purely a controlled component — no store access, no local filtering logic;
every change is reported straight to the parent via the `on*Change` props.

## Used by

- [`lib/components/results/ResultsAdminTab.tsx`](ResultsAdminTab.md)
