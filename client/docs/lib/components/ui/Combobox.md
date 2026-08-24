# `lib/components/ui/Combobox.tsx`

[← lib/components/ui](README.md)

## Purpose

Dropdown select rendered as a centered modal list, with an optional "live"
status dot per option and per selected value.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `Combobox<T extends string>` | `(props: ComboboxProps<T>): JSX` | Renders the closed trigger (current label + chevron) and, on press, a centered modal dropdown list of options. |
| `ComboboxOption<T extends string>` | type | One selectable option; see property table below. |

### `ComboboxOption<T>` properties

| Property | Type | Meaning |
|---|---|---|
| `value` | `T` | The option's underlying value. |
| `label` | `string` | Text shown for the option, in both the trigger (when selected) and the dropdown list. |
| `isLive` | `boolean?` | When true, renders a small green dot next to the option (and next to the trigger label when it's the selected value). |

### `ComboboxProps<T>`

| Property | Type | Meaning |
|---|---|---|
| `value` | `T` | Currently selected value; used to find the option shown in the closed trigger and to mark the active row with a checkmark. |
| `options` | `ComboboxOption<T>[]` | Full list of selectable options rendered in the dropdown. |
| `onChange` | `(value: T) => void` | Called with the new value when an option is tapped; the component also closes the dropdown (`setOpen(false)`) immediately after. |

## How it works

Nearly identical to [`SelectPicker`](SelectPicker.md), but adds the
`isLive` dot and centers the dropdown as a modal overlay rather than
anchoring it. The two weren't consolidated into one component.

Internal `open` state (`useState(false)`) controls the dropdown `Modal`'s
visibility; it's local rather than lifted because nothing outside the
component needs to know whether the dropdown is open. `selected` is
recomputed on every render via `options.find(...)` rather than memoized —
the option list is small, so this isn't worth a `useMemo`.

## Used by

- [`lib/components/admin/StatisticsTab.tsx`](../admin/StatisticsTab.md)
- [`lib/components/admin/TournamentSettings.tsx`](../admin/TournamentSettings.md)
- [`lib/components/results/ResultsAdminTab.tsx`](../results/ResultsAdminTab.md)
