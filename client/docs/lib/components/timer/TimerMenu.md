# `lib/components/timer/TimerMenu.tsx`

[← lib/components/timer](README.md)

## Purpose

Two-stage overflow dialog for the timer screen, opened from
[`TimerControlPanel`](TimerControlPanel.md)'s gear button. The "options"
stage holds layout (orientation) and mode (pause mode) toggles, the table
bell, exit timer, and is the entry point to the "settings" stage (reset,
custom timer, revert to default). Also hosts (renders) the
[`CustomTimerModal`](CustomTimerModal.md) itself.

## Exports

### `TimerMenu(props: Props): JSX.Element`

| Prop | Type | Meaning |
| --- | --- | --- |
| `stage` | `"options" \| "settings" \| null` | Which dialog card is shown, if any. Owned by the parent (`app/(pages)/(user)/timer.tsx`'s `menuStage` state). |
| `onClose` | `() => void` | Dismisses whichever stage is open (backdrop tap or the header's close icon). |
| `onOpenSettings` | `() => void` | "Timer Settings" button in the options stage; advances to `stage === "settings"`. |
| `onBackToOptions` | `() => void` | Header back-arrow in the settings stage; returns to `stage === "options"`. |
| `onReset` | `() => Promise<void>` | "Reset Timer" button handler; resets all seats' clocks. |
| `onOpenCustomTimer` | `() => void` | "Custom Timer" button handler; opens the hosted [`CustomTimerModal`](CustomTimerModal.md) by setting `customTimerOpen`. |
| `onUseDefaultTimer` | `() => Promise<void>` | "Default Timer" button handler; discards the table's custom override in favor of the game's default settings. |
| `onCloseTimer` | `() => void` | "Exit Timer" button handler in the options stage (styled with the `danger` `Button` variant); ends the timer session for the table. |
| `orientationMode` | `TimerOrientationMode` | `"center"` or `"side"`; selects the layout toggle card's icon/value. |
| `onToggleOrientation` | `() => void` | Flips `orientationMode` (the layout toggle card's press handler). |
| `pauseMode` | `TimerPauseMode` | `"quickplay"` or `"simultaneous"`; selects the mode toggle card's icon/value. |
| `onTogglePauseMode` | `() => void` | Flips `pauseMode` (the mode toggle card's press handler). |
| `bell` | `TableBell \| undefined` | Current table-bell record, if any; drives the bell button's color/icon/label. |
| `bellElapsedLabel` | `string \| undefined` | Formatted elapsed-time-since-rung label, appended to the bell button's label when a bell exists. |
| `onToggleBell` | `() => void` | Rings the bell (if none exists) or dismisses it. |
| `bellLoading?` | `boolean` | Forwarded to the bell `Button`'s `loading` prop while the ring/dismiss request is in flight. |
| `bellDisabled?` | `boolean` | Forwarded to the bell `Button`'s `disabled` prop (e.g. while a request is already pending). |
| `customTimerOpen` | `boolean` | Visibility flag forwarded to the hosted `CustomTimerModal`. |
| `onCloseCustomTimer` | `() => void` | Forwarded to `CustomTimerModal`'s `onClose`. |
| `initialDuration` | `number \| undefined` | Forwarded to `CustomTimerModal`'s `initialDuration`. |
| `initialDirection` | `"up" \| "down" \| undefined` | Forwarded to `CustomTimerModal`'s `initialDirection`. |
| `initialRoundSeconds` | `number \| undefined` | Forwarded to `CustomTimerModal`'s `initialRoundSeconds`. |
| `onSaveCustomTimer` | `(duration: number, dir: "up" \| "down", roundSeconds: number) => Promise<void>` | Forwarded to `CustomTimerModal`'s `onSave`. |

### `ToggleCard({ label, icon, value, accessibilityLabel, onPress }: ToggleCardProps): JSX.Element`

Unexported helper rendering one of the two toggle cards in the options
stage (layout, mode): a small eyebrow `label` ("Layout"/"Mode") with a
decorative swap icon in the top row, and the current state's `icon` +
short `value` text ("Centre"/"Side", "Quickplay"/"Simultaneous") in the
bottom row. `accessibilityLabel` carries the fuller sentence (e.g.
"Orientation: Centered") that the old icon-toggle buttons used, since the
visible text is now intentionally terse. `onPress` flips the underlying
setting.

## How it works

Renders as a full-screen backdrop + centered card (`card`, `90%` width
capped at `420px`), conditionally on `stage`. Tapping the backdrop calls
`onClose`; the card itself stops propagation (`stopPropagation`) so taps
inside it don't bubble to the backdrop.

Both stages reuse [`Button`](../ui/Button.md) (the same
`BoardgameChampionship.Button` used elsewhere) for their action rows, laid
out via the shared `grid`/`gridButton` styles — two per row where there are
an even number of buttons, a single full-width `Button` on its own `grid`
row otherwise (the options stage's trailing "Exit Timer" row; the settings
stage's trailing "Default Timer" row). The options stage's "Exit Timer"
button uses the `danger` variant to signal it's a different kind of action
from the others, and sits at the options level (not behind "Timer
Settings") since ending the session is a decision independent of the
reset/custom/default timer actions. The bell button uses `primary` while a
bell is ringing and unacknowledged (`bellRinging`), `secondary` otherwise,
since `Button` has no dedicated warning color.

The bell button's label concatenates the translated state text
(`ringBell`/`bellRinging`/`bellAcknowledged`) with `bellElapsedLabel` when a
bell exists (`Button` only takes a single label, unlike the old
`TimerControlPanel`'s bell bar which had a separate trailing-label slot).

## Used by

- [`app/(pages)/(user)/timer.tsx`](../../../app/(pages)/(user)/timer.md)
