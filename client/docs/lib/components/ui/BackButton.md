# `lib/components/ui/BackButton.tsx`

[← lib/components/ui](README.md)

## Purpose

Themed back-navigation button (arrow icon + translated "back" label).
Uses a 40-point minimum height with vertically centered content, keeping the
label at the same height on game screens with or without adjacent controls.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `BackButton` | `(props: Props): JSX` | Pressable row with a back arrow icon and the translated "back" label; renders nothing else, all layout/behavior lives on the parent screen. |

### Props

| Property | Type | Meaning |
|---|---|---|
| `onPress` | `() => void` | Called when the button is pressed; the component has no navigation logic of its own, so the caller decides what "back" means (usually `router.back()`). |

## Used by

[`game.tsx`](../../../app/(pages)/(user)/game.md), [`lottery.tsx`](../../../app/(pages)/(user)/lottery.md), [`results.tsx`](../../../app/(pages)/(user)/results.md), [`rules.tsx`](../../../app/(pages)/(user)/rules.md), [`signature.tsx`](../../../app/(pages)/(user)/signature.md), [`PlayerPickerForm.tsx`](../onboarding/PlayerPickerForm.md)
