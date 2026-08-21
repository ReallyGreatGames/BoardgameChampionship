# `lib/components/results/ScoreNavBar.tsx`

[← lib/components/results](README.md)

## Purpose

Prev/next/jump-to-table navigation bar shown above the per-table input form.

## Exports

### `ScoreNavBar(props: Props): JSX.Element`

| Prop | Type | Meaning |
|---|---|---|
| `currentIdx` | `number` | Zero-based index of the currently shown table within the sequence. |
| `total` | `number` | Total number of tables in the sequence; used both for the `N of total` label and to compute `atEnd`. |
| `jumpText` | `string` | Current text in the jump-to-table input (controlled by the caller). |
| `onJumpTextChange` | `(v: string) => void` | Called on every keystroke in the jump input. |
| `onPrev` | `() => void` | Called when the previous-table button is pressed. |
| `onNext` | `() => void` | Called when the next-table button is pressed. |
| `onJump` | `() => void` | Called when the jump input's keyboard "go" action fires; parsing/validating `jumpText` into a table index is the caller's job. |
| `t` | `(key: string) => string` | Translation function, passed down rather than calling `useTranslation` internally. |

## How it works

Prev/next buttons disable at the first/last table (`atStart`/`atEnd`). The
jump field submits on the keyboard's "go" action; parsing/validating the
typed table number is the caller's responsibility (`onJump`).

## Used by

- [`lib/components/results/ResultsAdminTab.tsx`](ResultsAdminTab.md)
