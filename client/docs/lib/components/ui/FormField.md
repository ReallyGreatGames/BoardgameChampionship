# `lib/components/ui/FormField.tsx`

[← lib/components/ui](README.md)

## Purpose

Labeled wrapper around a form input: icon + label (+ optional required
marker), the input itself as `children`, and an optional error message below.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `FormField` | `(props: FormFieldProps): JSX` | Renders an icon+label row, `children` (the actual input), and an optional error line below. |

### `FormFieldProps`

| Property | Type | Meaning |
|---|---|---|
| `icon` | `string` | `Ionicons` icon name shown before the label. |
| `label` | `string` | Field label text (rendered uppercase via style). |
| `required` | `boolean?` | When true, appends a red `*` after the label. |
| `error` | `string?` | Validation error text; rendered below `children` when present, omitted entirely otherwise. |
| `children` | `React.ReactNode` | The actual input control the field wraps. |

## Used by

- [`lib/components/rules/RuleModal.tsx`](../rules/RuleModal.md)
- [`lib/components/schedule/ScheduleItemModal.tsx`](../schedule/ScheduleItemModal.md)
- [`lib/components/timer/TimerDurationFields.tsx`](../timer/TimerDurationFields.md)
