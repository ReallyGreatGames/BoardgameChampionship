# `lib/components/results/SignatureStatusIcon.tsx`

[← lib/components/results](README.md)

## Purpose

Tiny per-seat icon summarizing signature status on a [`TableCard`](TableCard.md).

## Exports

### `SignatureStatusIcon({ index, sigIds, isSubmitted }: Props): JSX.Element | null`

| Prop | Type | Meaning |
|---|---|---|
| `index` | `number` | Seat index to check within `sigIds`. |
| `sigIds` | `string[]` | The table's signature file ids, one slot per seat (falsy/empty entries mean unsigned). |
| `isSubmitted` | `boolean` | Whether the table's result has been submitted. |

## How it works

Four states, purely derived: signed + submitted → green checkmark-circle;
signed + not submitted → plain checkmark; not signed + submitted → red
question-mark-circle (a submitted result missing a signature); not signed +
not submitted → renders nothing.

## Used by

- [`lib/components/results/TableCard.tsx`](TableCard.md)
