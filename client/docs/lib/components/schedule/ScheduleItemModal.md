# `lib/components/schedule/ScheduleItemModal.tsx`

[← lib/components/schedule](README.md)

## Purpose

Add/edit modal for a single [`Schedule`](../../models/schedule.md) item.

## Exports

| Export | Purpose |
|---|---|
| `ScheduleItemModal` (component) | Props: `{ visible, item?, nextSortIndex, onClose, onTimer?, onSave, onRules? }` |
| `ScheduleFormData` | `Omit<Schedule, keyof Models.Document>` — the shape passed to `onSave` |

## How it works

Local form state (`title`, `icon`, `startTime`, `duration`, `description`,
`gameId`, `allowUserChange`) is (re)initialized from `item` (or blanked)
whenever the modal opens (`visible` changes to `true`). `IconPicker` (local
helper) offers a fixed set of icons (trophy, dice, pause, info, document).

Validation: `title` non-empty, `icon` chosen, `startTime` matching
`HH:MM` with valid ranges (`isValidTime`), `duration` a positive integer
(`isValidDuration`) — each field's error only shows after that field has
been blurred at least once, same blur-then-clear-on-fix UX pattern as
[`useDurationRoundFields`](../../hooks/useDurationRoundFields.md) (though
this form implements it inline rather than via that shared hook, since it
has different fields).

The footer's three action buttons (timer/rules/lotteries) are only enabled
when editing an existing item with a `gameId` — "lotteries" has no handler
wired up yet (button renders but has no `onPress`). New items always get
`sortIndex: nextSortIndex`, `isActive: false`, `isFinished: false`.

## Used by

- [`lib/components/schedule/Schedule.tsx`](Schedule.md)
