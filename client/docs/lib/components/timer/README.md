# `lib/components/timer`

[← lib/components](../README.md)

The UI half of the interactive timer screen — all consumers of
[`useTimerState`](../../hooks/useTimerState.md), which owns all the actual
state/logic. See [`app/(pages)/(user)/timer.tsx`](../../../app/(pages)/(user)/timer.md)
for how they're assembled.

## Files

| File | Purpose |
|---|---|
| [TimerCell.md](TimerCell.md) | One seat's clock face — the most visually complex component in the app |
| [TimerControlPanel.md](TimerControlPanel.md) | Floating hub (pause/resume-all disc, gear to open the menu, table-elapsed pill) |
| [TimerMenu.md](TimerMenu.md) | Two-stage overflow dialog: table options (layout, mode, bell, exit, entry to timer settings) and timer settings (reset, custom timer, revert to default) |
| [CustomTimerModal.md](CustomTimerModal.md) | Modal for setting a per-table custom timer override |
| [TimerDurationFields.md](TimerDurationFields.md) | Shared duration/round-time/direction form fields |
