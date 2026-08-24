# `lib/components/timer/TimerMenu.tsx`

[← lib/components/timer](README.md)

## Purpose

Overflow menu for the timer screen: reset, open the custom-timer modal,
revert to the game's default timer, or close the timer entirely. Also
hosts (renders) the [`CustomTimerModal`](CustomTimerModal.md) itself.

## Exports

### `TimerMenu(props: Props): JSX.Element`

| Prop | Type | Meaning |
| --- | --- | --- |
| `open` | `boolean` | Whether the overflow menu card is shown. |
| `onClose` | `() => void` | Dismisses the menu (backdrop tap). |
| `onReset` | `() => Promise<void>` | "Reset timers" row handler; resets all seats' clocks. |
| `onOpenCustomTimer` | `() => void` | "Custom timer" row handler; opens the hosted [`CustomTimerModal`](CustomTimerModal.md) by setting `customTimerOpen`. |
| `onUseDefaultTimer` | `() => Promise<void>` | "Use default timer" row handler; discards the table's custom override in favor of the game's default settings. |
| `onCloseTimer` | `() => void` | "Close timer" row handler (styled in the error color); ends the timer session for the table. |
| `customTimerOpen` | `boolean` | Visibility flag forwarded to the hosted `CustomTimerModal`. |
| `onCloseCustomTimer` | `() => void` | Forwarded to `CustomTimerModal`'s `onClose`. |
| `initialDuration` | `number \| undefined` | Forwarded to `CustomTimerModal`'s `initialDuration`. |
| `initialDirection` | `"up" \| "down" \| undefined` | Forwarded to `CustomTimerModal`'s `initialDirection`. |
| `initialRoundSeconds` | `number \| undefined` | Forwarded to `CustomTimerModal`'s `initialRoundSeconds`. |
| `onSaveCustomTimer` | `(duration: number, dir: "up" \| "down", roundSeconds: number) => Promise<void>` | Forwarded to `CustomTimerModal`'s `onSave`. |

### `MenuButton({ icon, label, color, onPress, disabled, loading }: MenuButtonProps): JSX.Element`

Unexported helper rendering one row of the menu card. `icon:
React.ComponentProps<typeof Ionicons>["name"]` selects the glyph; `label:
string` is the row text; `color: string` colors both the icon and text
(used to give "close timer" its distinct error-red styling); `onPress: ()
=> void` fires on tap; `disabled?: boolean` dims the row and blocks
`onPress`; `loading?: boolean` swaps the icon for an `ActivityIndicator`
(unused by any current caller, but supported for a pending-action state).

## How it works

Renders as a full-screen backdrop + centered card, conditionally on `open`
(no animation library involvement — a plain conditional render). The
"close timer" menu item is styled in the error color to signal it's a
different kind of action from the others. `MenuButton` is a local,
unexported helper for the individual rows.

## Used by

- [`app/(pages)/(user)/timer.tsx`](../../../app/(pages)/(user)/timer.md)
