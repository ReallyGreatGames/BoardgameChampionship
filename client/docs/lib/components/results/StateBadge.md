# `lib/components/results/StateBadge.tsx`

[← lib/components/results](README.md)

## Purpose

Small badge summarizing a table's result status.

## Exports

### `StateBadge({ result, t }: Props): JSX.Element`

| Prop | Type | Meaning |
|---|---|---|
| `result` | [`Result`](../../models/result.md) `\| undefined` | The table's result document, if one exists yet; `undefined` renders the "none" state. |
| `t` | `(key: string) => string` | Translation function, passed down rather than calling `useTranslation` internally. |

## How it works

Four mutually exclusive states, checked in order: no result yet
("none") → submitted ("submitted") → has at least one signature but not
submitted ("signed", showing the signature count) → has a result row but
no signatures yet ("saved").

## Used by

- [`lib/components/results/ResultsAdminTab.tsx`](ResultsAdminTab.md)
- [`lib/components/results/TableCard.tsx`](TableCard.md)
