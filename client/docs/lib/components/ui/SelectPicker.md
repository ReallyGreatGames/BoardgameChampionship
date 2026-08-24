# `lib/components/ui/SelectPicker.tsx`

[← lib/components/ui](README.md)

## Purpose

Simple dropdown select rendered as a centered modal list.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `SelectPicker<T extends string>` | `(props: Props<T>): JSX` | Renders the closed trigger (current label + chevron) and, on press, a centered modal dropdown list of options with a checkmark on the active one. |
| `SelectOption<T extends string>` | `{ value: T, label: string }` | One selectable option: `value` is passed to `onChange`, `label` is the displayed text. |

### `Props<T>`

| Property | Type | Meaning |
|---|---|---|
| `value` | `T` | Currently selected value; used to find the option shown in the closed trigger and to mark the active row. |
| `options` | `SelectOption<T>[]` | Full list of selectable options rendered in the dropdown. |
| `onChange` | `(value: T) => void` | Called with the new value when an option is tapped; the dropdown also closes (`setOpen(false)`) immediately after. |

## Related

- [`lib/components/ui/Combobox.tsx`](Combobox.md) — near-identical, adds a "live" status dot

## Used by

- [`app/(pages)/(team-player)/choose-your-character.tsx`](../../../app/(pages)/(team-player)/choose-your-character.md)
- [`app/(pages)/settings.tsx`](../../../app/(pages)/settings.md)
- [`lib/components/admin/ImportRules.tsx`](../admin/ImportRules.md) — game picker on the paste screen
