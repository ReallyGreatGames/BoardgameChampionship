# `lib/components/ui/SearchInput.tsx`

[← lib/components/ui](README.md)

## Purpose

Search box with a search icon and a clear ("×") button shown only while there's text.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `SearchInput` | `(props: SearchInputProps): JSX` | Renders a search icon, a `TextInput`, and (only while `value` is non-empty) a clear button that resets the text to `""`. |

### `SearchInputProps`

| Property | Type | Meaning |
|---|---|---|
| `value` | `string` | Current search text (controlled input). |
| `onChangeText` | `(v: string) => void` | Called with the new text on every keystroke, and with `""` when the clear button is tapped. |
| `placeholder` | `string?` | Placeholder text shown when empty. |
| `style` | `ViewStyle?` | Extra style merged onto the outer row. |

## Used by

- [`lib/components/results/ResultsAdminTab.tsx`](../results/ResultsAdminTab.md)
- [`lib/components/rules/RuleList.tsx`](../rules/RuleList.md)
