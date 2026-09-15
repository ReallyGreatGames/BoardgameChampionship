# `lib/components/timer/TimerControlPanel.tsx`

[← lib/components/timer](README.md)

## Purpose

Floating hub overlaid on the timer screen: a big pause/resume-all disc dead
center, a small gear beside it that opens [`TimerMenu`](TimerMenu.md), and a
pill below showing how much time is left in this game's scheduled round —
the same countdown shown on the home screen's "now playing" card. The
single primary control (pause/resume everyone) is large and central;
everything else — orientation, pause mode, the table bell,
reset/custom/default/exit — lives behind the gear.

## Exports

### `TimerControlPanel(props: Props): JSX.Element`

| Prop | Type | Meaning |
| --- | --- | --- |
| `onOpenMenu` | `() => void` | Opens [`TimerMenu`](TimerMenu.md)'s "options" stage. |
| `allPaused` | `boolean` | Whether every seat is currently paused; selects the disc's icon (play vs pause) and its accessibility label. |
| `onToggleAllPause` | `() => void` | Pauses or resumes every seat at once (the disc's press handler). |
| `roundCountdown` | [`RoundCountdown`](../../hooks/useRoundCountdown.md) | The game's scheduled-round time-left state (`label`, `isOvertime`, `isPaused`), shown in the pill; caller resolves it via `useRoundCountdown(scheduleItem)` on the [`Schedule`](../../models/schedule.md) item whose `gameId` matches this table's game. |
| `spamProtectionActive` | `boolean` | Whether rapid seat/pause-all presses have tripped the anti-spam guard; shows a warning banner above the hub and disables the disc. |

## How it works

Renders as a background-less cluster rather than a bordered card, built
around a fixed-size `anchor` box (`DISC_SIZE × DISC_SIZE`) whose own center
is the true dead-center point of the overlay. The disc is absolutely
positioned exactly on that point (`top/left: "50%"` plus a negative
`margin` of half its own size); the gear and the round-countdown pill are
satellites offset from the *same* anchor point (`marginLeft: DISC_SIZE / 2
+ GAP` for the gear, `marginTop: DISC_SIZE / 2 + GAP` for the pill's
full-width centering row), not from each other. This means the disc stays
pinned to dead-center regardless of whether the gear or pill are present —
the gear and pill "flow around" it rather than the three being centered as
a group, which would drag the disc off-center. This replaces the older
wider panel (icon row + full-width bell/pause-all bars) — those controls
moved into [`TimerMenu`](TimerMenu.md)'s "options" stage so the
always-visible surface only shows the one primary action plus the entry
point to everything else.

The `spamProtectionActive` banner sits above the anchor box as a normal
flow sibling (not another anchor-relative satellite) — when it appears it
nudges the whole cluster down slightly as `root`'s centered block grows
taller, which is an acceptable trade-off for that rare, transient state
rather than adding more anchor-math to solve for it.

The pill's value text has a fixed `width` (`PILL_VALUE_WIDTH`) and
right-aligned (`textAlign: "right"`) text, so it stays flush against the
pill's trailing edge and the pill doesn't visibly resize/jitter every
second as the countdown's digits change (e.g. `"09:59"` → `"10:00"`) or
when it switches to/from the `"--:--"` idle placeholder. It's colored `colors.error` when `roundCountdown.isOvertime`,
`colors.textMuted` when `roundCountdown.isPaused` (and neither), and
`colors.text` otherwise — the same three states the home screen's
"now playing" card badges. Note this is deliberately *not* derived from
anything in `useTimerState` (the per-seat chess-clock timer) — it's the
tournament schedule's round budget for this game, a separate concept from
the four seats' individual clocks, computed by
[`useRoundCountdown`](../../hooks/useRoundCountdown.md) from the
[`Schedule`](../../models/schedule.md) document whose `gameId` matches.

When `spamProtectionActive` is true (see
[`useTimerState`](../../hooks/useTimerState.md)'s `registerPressAndCheckSpam`
doc — too many seat/pause-all presses in a short window), a banner appears
above the hub and the disc is disabled/dimmed. Per-seat cells aren't
disabled here — `handlePress` itself already no-ops while protection is
active, and the banner is the single, centrally-visible indicator rather
than restyling all four [`TimerCell`](TimerCell.md)s.

## Used by

- [`app/(pages)/(user)/timer.tsx`](../../../app/(pages)/(user)/timer.md)
