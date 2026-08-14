# `lib/components/ui/ResizableTextInput.tsx`

[← lib/components/ui](README.md)

## Purpose

Multiline `TextInput` with a drag handle in the corner to resize its height.

## Props

`{ value, onChangeText, placeholder?, style?, resetOn: boolean }` —
`resetOn` resets the height back to `MIN_HEIGHT` (96) whenever it becomes
`true` (typically a modal's `visible` prop, so the field starts fresh each
time the modal reopens).

## How it works

Uses a `PanResponder` on the drag handle: `onPanResponderGrant` captures
the height at drag start, `onPanResponderMove` adds the vertical drag delta
(`gesture.dy`) to it, clamped to never go below `MIN_HEIGHT`.

## Used by

- [`lib/components/rules/RuleModal.tsx`](../rules/RuleModal.md)
- [`lib/components/schedule/ScheduleItemModal.tsx`](../schedule/ScheduleItemModal.md)
