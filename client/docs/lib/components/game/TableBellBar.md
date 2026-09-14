# `lib/components/game/TableBellBar.tsx`

[← lib/components/game](README.md)

## Purpose

The game page's fixed bottom bar holding the table-bell pill: icon, title
and a state-dependent hint line ("call a judge", "called 01:12 ago — tap
to cancel", "only while the game is running"). Sits outside the page's
`ScrollView` so the bell is always reachable, however long the seating
list gets.

## Exports

### `TableBellState`

`"idle" | "ringing" | "acknowledged" | "unavailable"` — the four looks of
the pill:

| State | Meaning | Tint |
|---|---|---|
| `idle` | No bell for this table; pressing rings one | `colors.primary` |
| `ringing` | A bell is active and no judge has acknowledged it yet | `colors.accent` |
| `acknowledged` | A judge acknowledged the bell (a `walk-outline` icon is added) | `colors.success` |
| `unavailable` | The game isn't running or the player has no table | `colors.textSecondary` |

### `TableBellBar(props: Props): JSX.Element`

| Prop | Type | Meaning |
|---|---|---|
| `state` | `TableBellState` | Which of the four looks to render |
| `hint` | `string` | Already-translated second line, including any interpolated elapsed time; also used as the pill's `accessibilityHint` |
| `disabled` | `boolean` | Blocks presses and dims the pill to `ui.disabledOpacity` |
| `isLoading` | `boolean` | Shows a trailing `ActivityIndicator` while a ring/dismiss request is in flight |
| `locked` | `boolean` | Shows a trailing padlock — the bell exists but this player may not dismiss it (see [`useTableBellActions.canDelete`](../../hooks/useTableBellActions.md)) |
| `onPress` | `() => void` | Toggles the bell (ring or dismiss, with a confirm dialog, in the caller) |

The title itself is not a prop — it's always `game:actions.tableBell`,
translated inside the component.

## How it works

`state` is presentation only: it says how the pill *looks*, while
`disabled` says whether it can be pressed. The two deliberately don't
imply each other — an `unavailable`-looking bell is still pressable while
the `TABLE_BELL` feature flag is on, which is how judges test the bell
outside a running game.

`paddingBottom` is `insets.bottom + space[3]` (via `useSafeAreaInsets`)
since the bar is anchored to the bottom edge and has to clear the home
indicator itself.

## Used by

- [`app/(pages)/(user)/game.tsx`](../../../app/(pages)/(user)/game.md)

## Related

- [`lib/hooks/useTableBellActions.ts`](../../hooks/useTableBellActions.md) — ring/dismiss/acknowledge and the `canDelete` permission behind `locked`
- [`lib/components/timer/TimerControlPanel.tsx`](../timer/TimerControlPanel.md) — the timer screen's own bell control, styled to the same color logic
