# `lib/components/ui/ChipGroup.tsx`

[← lib/components/ui](README.md)

## Purpose

A row of chips for picking one value out of a small option set, in either
of two interaction styles.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `ChipGroup<T extends string>` | `(props: ChipGroupProps<T>): JSX` | Generic component; behavior branches on `props.mode` (see below). |
| `ChipOption<T extends string = string>` | type | One selectable option; see property table below. |
| `ChipGroupProps<T extends string>` | `SelectProps<T> \| CycleProps<T>` | Discriminated union on `mode`, both variants sharing `{ options, value, onChange, style? }`. |

### `ChipOption<T>` properties

| Property | Type | Meaning |
|---|---|---|
| `value` | `T` | The option's underlying value, passed to `onChange` when selected. |
| `label` | `string` | Text shown on the chip. |
| `icon` | `string?` | Optional `Ionicons` icon name rendered before the label. |
| `color` | `string?` | Optional tint color for the chip's icon/border/background when active; falls back to theme defaults if omitted. |
| `isLive` | `boolean?` | When true, renders a small colored dot on the chip (e.g. to mark "currently in progress"). |

### `SelectProps<T>` / `CycleProps<T>`

| Property | Type | Meaning |
|---|---|---|
| `mode` | `"select" \| "cycle"` | Selects which of the two interaction styles to render (see below). |
| `options` | `ChipOption<T>[]` | The full set of selectable options. |
| `value` | `T` | Currently selected value. |
| `onChange` | `(v: T) => void` | Called with the newly selected value when the user picks/advances a chip. |
| `style` | `ViewStyle?` | Extra style applied to the outer row (`"select"`) or the single chip (`"cycle"`). |

## How it works

Two `mode`s, picked via the `mode` prop:
- **`"select"`** — renders every option as its own chip; tapping one calls
  `onChange` with its value directly.
- **`"cycle"`** — renders a single chip showing the current value; tapping
  it advances to the next option in the array (wrapping around). The first
  option (`idx === 0`) is treated as the "neutral" state and rendered
  without a tint color.

`isLive` on an option renders a small colored dot (e.g. for "currently in progress").

In `"cycle"` mode, `idx` is computed with
`Math.max(0, options.findIndex(...))`, so if `value` doesn't match any
option (e.g. stale state), it silently falls back to rendering the first
option as "neutral" rather than crashing on a `-1` index.

## Used by

- [`lib/components/results/ResultsAdminTab.tsx`](../results/ResultsAdminTab.md)
- [`lib/components/results/ResultsFilterDialog.tsx`](../results/ResultsFilterDialog.md)
