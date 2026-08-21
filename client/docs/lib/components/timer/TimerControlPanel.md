# `lib/components/timer/TimerControlPanel.tsx`

[← lib/components/timer](README.md)

## Purpose

Floating control panel overlaid on the timer screen: table-elapsed-time
readout, a row of icon toggles (orientation, overflow menu, pause mode),
and two full-width action bars (table bell, pause/resume all). Replaces an
older, smaller round menu-trigger button.

## Exports

### `TimerControlPanel(props: Props): JSX.Element`

| Prop | Type | Meaning |
| --- | --- | --- |
| `onOpenMenu` | `() => void` | Opens the [`TimerMenu`](TimerMenu.md) overflow menu. |
| `orientationMode` | `TimerOrientationMode` | `"center"` or `"side"`; selects which icon is shown for the orientation toggle. |
| `onToggleOrientation` | `() => void` | Flips `orientationMode`. |
| `pauseMode` | `TimerPauseMode` | `"auto"` or `"manual"`; selects which icon is shown for the pause-mode toggle. |
| `onTogglePauseMode` | `() => void` | Flips `pauseMode`. |
| `bell` | `TableBell \| undefined` | Current table-bell record, if any; drives the bell bar's color and label. |
| `bellElapsedLabel` | `string \| undefined` | Formatted elapsed-time-since-rung label, shown as the bell bar's trailing text. |
| `onToggleBell` | `() => void` | Rings the bell (if none exists) or dismisses it. |
| `bellLoading?` | `boolean` | Shows a spinner in place of the bell icon while the ring/dismiss request is in flight. |
| `bellDisabled?` | `boolean` | Disables the bell bar (e.g. while a request is already pending). |
| `allPaused` | `boolean` | Whether every seat is currently paused; selects the pause/resume-all bar's icon and label. |
| `onToggleAllPause` | `() => void` | Pauses or resumes every seat at once. |
| `tableElapsedLabel` | `string` | Formatted total-table-elapsed-time text shown in the small header row. |
| `spamProtectionActive` | `boolean` | Whether rapid seat/pause-all presses have tripped the anti-spam guard; shows a warning banner and disables the pause/resume-all bar. |

### `IconToggle({ icon, accessibilityLabel, onPress }: IconToggleProps): JSX.Element`

Unexported helper rendering one square icon button in the top icon row.
`icon: React.ComponentProps<typeof Ionicons>["name"]` selects the glyph,
`accessibilityLabel: string` is the screen-reader label (also used as
visual context for which state — e.g. `"center"` vs `"side"` — the icon
represents), and `onPress: () => void` fires on tap.

### `PanelBar({ icon, color, label, trailingLabel, onPress, loading, disabled }: PanelBarProps): JSX.Element`

Unexported helper rendering one full-width bar (bell / pause-all).
`icon` and `color` (`string`) set the leading glyph and shared
icon/text color; `label: string` is the primary text; `trailingLabel?:
string` is optional right-aligned text (e.g. the bell's elapsed time);
`onPress: () => void` fires on tap; `loading?: boolean` swaps the icon for
an `ActivityIndicator`; `disabled?: boolean` dims the bar and blocks
`onPress`.

## How it works

The table-elapsed-time row is deliberately small and non-interactive — see
[`useTimerState`](../../hooks/useTimerState.md)'s `tableElapsedSeconds` doc
comment: it's useful context, not a focal element.

When `spamProtectionActive` is true (see
[`useTimerState`](../../hooks/useTimerState.md)'s `registerPressAndCheckSpam`
doc — too many seat/pause-all presses in a short window), a banner appears
between the table-elapsed row and the icon row, and the pause/resume-all
bar is disabled. Per-seat cells aren't disabled here — `handlePress` itself
already no-ops while protection is active, and the banner is the single,
centrally-visible indicator rather than restyling all four
[`TimerCell`](TimerCell.md)s.

The bell action bar's color/label depend on
[`TableBell`](../../models/table-bell.md) state: gray/"ring bell" if no
bell exists, accent-colored/"ringing" if one exists unacknowledged,
success-colored/"acknowledged" if it's been acknowledged.

Internal helper components `IconToggle` (small square icon buttons) and
`PanelBar` (full-width icon+label+optional-trailing-label bars, with a
loading/disabled state) aren't exported — local to this file only.

## Used by

- [`app/(pages)/(user)/timer.tsx`](../../../app/(pages)/(user)/timer.md)
