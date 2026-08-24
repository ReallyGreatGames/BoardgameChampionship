# `lib/components/results/PlayerResultRow.tsx`

[← lib/components/results](README.md)

## Purpose

One player's result-entry row: name/team, a score input, 4 placement
chips, and a caller-supplied signature slot. Used both by the admin's
per-table input mode and the participant-facing self-entry screen.

## Exports

| Export | Purpose |
|---|---|
| `PlayerResultRow` (component, `forwardRef<PlayerResultRowHandle, Props>`) | See props below |
| `PlayerResultRowHandle` | `{ focusScore(): void; focusChips(): void }` — imperative handle for cross-row keyboard navigation |

### `Props`

| Prop | Type | Meaning |
|---|---|---|
| `playerName` | `string` | Display name for the row. |
| `playerTeam` | `string` (optional) | Team label shown under/next to the name; hidden if absent. |
| `placement` | `string` | Currently-selected placement chip value (`"1"`-`"4"`, or `""` for none). |
| `score` | `string` | Current score input text (kept as a string so the caller controls formatting/precision). |
| `onSetPlacement` | `(value: string) => void` | Called with the new placement (or `""` to clear) whenever a chip is tapped or set via keyboard. |
| `onSetScore` | `(value: string) => void` | Called with the filtered score text (digits and at most one `.`) on every keystroke. |
| `onScoreSubmitEditing` | `() => void` (optional) | Called when the score field's "next" keyboard action fires. |
| `onScoreTabForward` | `() => void` (optional, web) | Called when Tab is pressed while the score field is focused. |
| `onScoreTabBackward` | `() => void` (optional, web) | Called when Shift+Tab is pressed while the score field is focused. |
| `onChipTabForward` | `() => void` (optional, web) | Called when Tab (or a digit key) advances focus out of the chip row. |
| `onChipTabBackward` | `() => void` (optional, web) | Called when Shift+Tab moves focus back from the chip row. |
| `signatureSlot` | `ReactNode` | Caller-owned signature UI rendered at the end of the row; this component has no signature logic of its own. |
| `disabled` | `boolean` (optional, default `false`) | Dims the row and makes the score input/chips non-interactive. |
| `placementError` | `boolean` (optional, default `false`) | Highlights the active placement chip in the error color (e.g. duplicate placement across the table). |

### `PlayerResultRowHandle`

| Method | Signature | Behavior |
|---|---|---|
| `focusScore` | `(): void` | Focuses the score `TextInput` via `scoreInputRef`. |
| `focusChips` | `(): void` | Web only: focuses the chip row's `View` (a no-op on native, since chips aren't keyboard-focusable there). |

## How it works

### Responsive layout

Below `ui.breakpointTablet`, the name/team pair moves to its own row above
the score+chips row instead of sitting inline — `isCompact`, derived from
`useWindowDimensions()`.

### Score input filtering

`onChangeText` strips everything except digits and `.`, and collapses any
second decimal point (`v.replace(/[^0-9.]/g, "").replace(/(\..*)\./g,
"$1")`) — lets the OS decimal keypad through without needing a custom parser.

### Web keyboard navigation

This is the one place in the UI with real custom tab-order wiring. Two
separate mechanisms:

- **Score field Tab/Shift+Tab** — handled via a **native DOM**
  `addEventListener("keydown", ...)` on the underlying `HTMLInputElement`
  (in React Native Web, `scoreInputRef.current` *is* that element),
  because React's synthetic `onKeyDown` + `preventDefault()` fires too late
  to reliably stop the browser's own Tab-driven focus movement. The
  attached handler always reads the *latest* callbacks via refs
  (`scoreTabForwardRef`/`scoreTabBackwardRef`), so the listener (attached
  once via an empty-dependency effect) doesn't need to be torn down and
  re-attached whenever the callback props change.
- **Chip row keys** — a `focusable` `View` (web only) with an `onKeyDown`
  handler: digit keys `1`-`4` set/clear that placement directly (typing the
  already-active digit clears it) and advance focus; `Tab`/`Shift+Tab` move
  to the next/previous row. Individual chip `TouchableOpacity`s get
  `tabIndex={-1}` on web so they don't also appear in the natural tab order.

`focusScore`/`focusChips` (exposed via `ref`) are what let a parent
([`ResultsAdminTab`](ResultsAdminTab.md)) chain focus across all 4 rows —
each row's own tab-forward callback calls the next row's imperative handle.

`handleChipKeyDown(e: KeyboardEvent): void` (internal, `useCallback` on
`[placement, onSetPlacement, onChipTabForward, onChipTabBackward]`) is the
chip row's `onKeyDown` handler described above: digit keys toggle
`placement` and advance focus, `Tab`/`Shift+Tab` move focus without
touching `placement`. It's a `useCallback` (not inlined) so the identity
stays stable across renders where its dependencies haven't changed, since
it's attached directly as a DOM event prop via `chipRowWebProps`.

## Used by

- [`app/(pages)/(user)/results.tsx`](../../../app/(pages)/(user)/results.md) — participant self-entry
- [`lib/components/results/ResultsAdminTab.tsx`](ResultsAdminTab.md) — admin input mode
