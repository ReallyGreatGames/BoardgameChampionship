# `lib/components/ui/ChipGroup.tsx`

[← lib/components/ui](README.md)

## Purpose

A row of chips for picking one value out of a small option set, in either
of two interaction styles.

## Exports

| Export | Purpose |
|---|---|
| `ChipGroup<T>` (component) | See below |
| `ChipOption<T>` | `{ value, label, icon?, color?, isLive? }` |
| `ChipGroupProps<T>` | Discriminated union of the two modes |

## How it works

Two `mode`s, picked via the `mode` prop:
- **`"select"`** — renders every option as its own chip; tapping one calls
  `onChange` with its value directly.
- **`"cycle"`** — renders a single chip showing the current value; tapping
  it advances to the next option in the array (wrapping around). The first
  option (`idx === 0`) is treated as the "neutral" state and rendered
  without a tint color.

`isLive` on an option renders a small colored dot (e.g. for "currently in progress").

## Used by

- [`lib/components/results/ResultsAdminTab.tsx`](../results/ResultsAdminTab.md)
- [`lib/components/results/ResultsFilterDialog.tsx`](../results/ResultsFilterDialog.md)
