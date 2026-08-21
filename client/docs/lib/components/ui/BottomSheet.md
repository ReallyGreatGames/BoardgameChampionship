# `lib/components/ui/BottomSheet.tsx`

[← lib/components/ui](README.md)

## Purpose

Shared bottom-sheet modal shell (backdrop + sliding sheet with header,
scrollable body, footer) used by every modal in the app.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `BottomSheet` | `(props: BottomSheetProps): JSX` | Renders a `Modal` with a dimmed backdrop, a sliding sheet (header + scrollable body + footer), and a `KeyboardAvoidingView` so the sheet rides above the keyboard on iOS. |
| `makeSheetStyles` | `(colors: ReturnType<typeof useTheme>["colors"]): StyleSheet` | Exported so consuming modals can reuse/extend the same style set (`saveBtn`, `input`, `inputError`, etc.) for their own content instead of redefining it. |

### `BottomSheetProps`

| Property | Type | Meaning |
|---|---|---|
| `visible` | `boolean` | Controls the underlying `Modal`'s visibility and whether the sheet's slide-in animation plays. |
| `onClose` | `() => void` | Called when the backdrop is pressed, the close (×) button is pressed, or the OS back gesture fires (`onRequestClose`). |
| `title` | `string` | Heading text shown in the sheet header. |
| `footer` | `React.ReactNode` | Content pinned below the scrollable body (typically a save/submit button row). |
| `children` | `React.ReactNode` | Scrollable body content. |

## How it works

### Orientation lock effect

```
useEffect(() => {
  if (visible) { ...lock to DEFAULT... }
  else if (prevOrientationLock.current !== null) { ...restore... }
}, [visible]);
```

While `visible`, temporarily overrides the screen's orientation lock to
`OrientationLock.DEFAULT` (allowing rotation), restoring whatever lock was
active beforehand once closed — so a sheet opened on a rotatable screen
(e.g. the timer) doesn't fight the screen's own orientation handling. The
previous lock is read asynchronously via `getOrientationLockAsync()` and
stashed in `prevOrientationLock` (a ref, not state, since it doesn't need to
trigger a re-render); the restore branch only runs if a previous lock was
actually captured, so closing a sheet that never became visible is a no-op.
Both `lockAsync` calls swallow errors with `.catch(() => {})` since locking
can fail on devices/platforms that don't support the requested orientation.

## Used by

[`PlayerColorSetupModal.tsx`](../onboarding/PlayerColorSetupModal.md), [`ResultsFilterDialog.tsx`](../results/ResultsFilterDialog.md), [`RuleModal.tsx`](../rules/RuleModal.md), [`ScheduleItemModal.tsx`](../schedule/ScheduleItemModal.md), [`TimerSettingsModal.tsx`](../schedule/TimerSettingsModal.md), [`CustomTimerModal.tsx`](../timer/CustomTimerModal.md), [`TimerDurationFields.tsx`](../timer/TimerDurationFields.md)
