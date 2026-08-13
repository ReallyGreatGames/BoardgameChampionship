# `lib/components/ui/SelectPicker.tsx`

[← lib/components/ui](README.md)

## Purpose

Simple dropdown select rendered as a centered modal list.

## Exports

| Export | Purpose |
|---|---|
| `SelectPicker<T>` (component) | Props: `{ value: T, options: SelectOption<T>[], onChange }` |
| `SelectOption<T>` | `{ value: T, label: string }` |

## Related

- [`lib/components/ui/Combobox.tsx`](Combobox.md) — near-identical, adds a "live" status dot

## Used by

- [`app/(pages)/(team-player)/choose-your-character.tsx`](../../../app/(pages)/(team-player)/choose-your-character.md)
- [`app/(pages)/settings.tsx`](../../../app/(pages)/settings.md)
