# `lib/components/admin/ImportProgressBar.tsx`

[← lib/components/admin](README.md)

## Purpose

Shared progress bar for both import wizards: a two-color (success/error)
fill track, a count summary, and an optional retry button + per-item error list.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `ImportProgressBar` | `(props: ImportProgressBarProps): JSX.Element` | Renders a labeled two-color progress track, a `done/total` count (with a failed-count suffix), an optional retry button, and a per-item error list. |
| `FailedItem` | `type { id: string; label: string; message: string }` | One failed row/entry to list under the bar; `id` keys the list, `label` names the item, `message` is the failure reason shown next to it. |

### `ImportProgressBarProps`

| Property | Type | Meaning |
|---|---|---|
| `label` | `string` | Heading text for this progress bar (e.g. a team, a wipe group, or a game title). |
| `total` | `number` | Total item count the bar is tracking; used to compute fill percentages and the `done/total` label. |
| `succeeded` | `number` | Count of items that finished successfully; drives the green fill width (`succeeded / total`). |
| `failedItems` | `FailedItem[]` | Items that failed, rendered as the error list below the bar; its length also drives the red fill width and the `(N failed)` count suffix. |
| `active` | `boolean` | Whether this bar's operation is currently running; shows a spinner next to the count while true and not yet done. |
| `onRetry` | `(() => void) \| undefined` | Called when the retry button is pressed. The button only renders when both `failedItems.length > 0` and `onRetry` is provided. |

`done` is derived as `succeeded + failedItems.length`, and `isDone` as `total > 0 && done === total` — used to stop showing the spinner once every item has resolved one way or the other.

## Used by

- [`lib/components/admin/ImportPlayers.tsx`](ImportPlayers.md)
- [`lib/components/admin/ImportTables.tsx`](ImportTables.md)
