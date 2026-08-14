# `lib/components/ui/FormField.tsx`

[← lib/components/ui](README.md)

## Purpose

Labeled wrapper around a form input: icon + label (+ optional required
marker), the input itself as `children`, and an optional error message below.

## Props

`{ icon: string, label: string, required?: boolean, error?: string, children: React.ReactNode }`

## Used by

- [`lib/components/rules/RuleModal.tsx`](../rules/RuleModal.md)
- [`lib/components/schedule/ScheduleItemModal.tsx`](../schedule/ScheduleItemModal.md)
- [`lib/components/timer/TimerDurationFields.tsx`](../timer/TimerDurationFields.md)
