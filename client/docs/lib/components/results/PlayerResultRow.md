# `lib/components/results/PlayerResultRow.tsx`

[← lib/components/results](README.md)

## Purpose

One player's result-entry row: name/team, a score input, 4 placement
chips, and a caller-supplied signature slot. Used both by the admin's
per-table input mode and the participant-facing self-entry screen.

## Exports

| Export | Purpose |
|---|---|
| `PlayerResultRow` (component, `forwardRef`) | See props below |
| `PlayerResultRowHandle` | `{ focusScore(), focusChips() }` — imperative handle for cross-row keyboard navigation |

Props: `playerName`, `playerTeam?`, `placement`, `score`, `onSetPlacement`,
`onSetScore`, `onScoreSubmitEditing?`, `onScoreTabForward?` (web),
`onScoreTabBackward?` (web), `onChipTabForward?` (web),
`onChipTabBackward?` (web), `signatureSlot: ReactNode` (caller owns this
UI), `disabled?`, `placementError?` (highlights the chips in the error color).

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

## Used by

- [`app/(pages)/(user)/results.tsx`](../../../app/(pages)/(user)/results.md) — participant self-entry
- [`lib/components/results/ResultsAdminTab.tsx`](ResultsAdminTab.md) — admin input mode
