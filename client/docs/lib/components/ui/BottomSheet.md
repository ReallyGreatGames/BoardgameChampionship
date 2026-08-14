# `lib/components/ui/BottomSheet.tsx`

[← lib/components/ui](README.md)

## Purpose

Shared bottom-sheet modal shell (backdrop + sliding sheet with header,
scrollable body, footer) used by every modal in the app.

## Exports

| Export | Purpose |
|---|---|
| `BottomSheet` (component) | Props: `{ visible, onClose, title, footer, children }` |
| `makeSheetStyles(colors)` | Exported so consuming modals can reuse/extend the same style set (`saveBtn`, `input`, etc.) for their own content |

## How it works

While `visible`, temporarily overrides the screen's orientation lock to
`OrientationLock.DEFAULT` (allowing rotation), restoring whatever lock was
active beforehand once closed — so a sheet opened on a rotatable screen
(e.g. the timer) doesn't fight the screen's own orientation handling.

## Used by

[`PlayerColorSetupModal.tsx`](../onboarding/PlayerColorSetupModal.md), [`ResultsFilterDialog.tsx`](../results/ResultsFilterDialog.md), [`RuleModal.tsx`](../rules/RuleModal.md), [`ScheduleItemModal.tsx`](../schedule/ScheduleItemModal.md), [`TimerSettingsModal.tsx`](../schedule/TimerSettingsModal.md), [`CustomTimerModal.tsx`](../timer/CustomTimerModal.md), [`TimerDurationFields.tsx`](../timer/TimerDurationFields.md)
