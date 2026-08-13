# `lib/theme/ui.ts`

[← lib/theme](README.md)

## Purpose

Miscellaneous shared UI constants that don't fit under colors/spacing/typography.

## Exports

### `ui` (`const` object)

| Field | Value | Meaning |
|---|---|---|
| `backdropColor` | `rgba(0,0,0,0.6)` | Dimming behind modals/sheets |
| `disabledOpacity` | `0.4` | Opacity of disabled elements |
| `cardRadius` | `12` | Corner radius for cards |
| `sheetRadius` | `20` | Corner radius for bottom sheets |
| `inputRadius` | `10` | Corner radius for input fields |
| `buttonRadius` | `10` | Corner radius for buttons |
| `breakpointTablet` | `600` | Window width at/above which a device is treated as tablet+ rather than phone |

## Used by

Among others: [`BottomSheet.tsx`](../components/ui/BottomSheet.md),
[`Dialog.tsx`](../components/ui/Dialog.md),
[`SelectPicker.tsx`](../components/ui/SelectPicker.md),
[`TimerMenu.tsx`](../components/timer/TimerMenu.md), and several screens
for `breakpointTablet` (responsive layout).
