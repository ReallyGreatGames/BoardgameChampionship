# `lib/components/schedule/ScheduleItemModal.tsx`

[← lib/components/schedule](README.md)

## Purpose

Add/edit modal for a single [`Schedule`](../../models/schedule.md) item.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `ScheduleItemModal` (component) | `ScheduleItemModal({ visible, item?, nextSortIndex, onClose, onSave, onRules?, onLotteries?, onTimer? }: Props): JSX` | Bottom-sheet add/edit form for a schedule item: title, icon, start time, duration, description, game id, and a user-change toggle, plus footer shortcuts to the timer/rules/lotteries flows for that item's game. |
| `ScheduleFormData` | `type ScheduleFormData = Omit<Schedule, keyof Models.Document>` | The shape passed to `onSave` — a `Schedule` stripped of Appwrite's `Models.Document` fields. |

### Props (`Props`)

| Prop | Type | Meaning |
|---|---|---|
| `visible` | `boolean` | Whether the sheet is shown; also gates the form-reset effect. |
| `item` | `Schedule \| undefined` | The item being edited, or `undefined` to add a new one. |
| `nextSortIndex` | `number` | The `sortIndex` assigned to a newly created item (ignored when editing). |
| `onClose` | `() => void` | Dismisses the sheet, called both on cancel and after a successful save. |
| `onSave` | `(data: ScheduleFormData) => Promise<void>` | Called with the built payload on save; awaited, with failures shown via `Alert`. |
| `onRules` | `((gameId: string) => void) \| undefined` | Called when the "rules" footer action is pressed (only enabled when editing an item that has a `gameId`). |
| `onLotteries` | `((gameId: string) => void) \| undefined` | Called when the "lotteries" footer action is pressed (only enabled when editing an item that has a `gameId`); same gating pattern as `onRules`. |
| `onTimer` | `((gameId: string) => void) \| undefined` | Called when the "timer" footer action is pressed (only enabled when editing an item that has a `gameId`); same gating pattern as `onRules`/`onLotteries`. |

### Internal functions

| Function | Signature | Behavior |
|---|---|---|
| `isValidTime` | `isValidTime(v: string): boolean` | Module-level helper. True if `v` matches `HH:MM` and hours `< 24`, minutes `< 60`. |
| `isValidDuration` | `isValidDuration(v: string): boolean` | Module-level helper. True if `v` parses to a positive integer. |
| `handleSave` | `handleSave(): Promise<void>` | No-ops if invalid or already saving. Otherwise builds the `ScheduleFormData` payload (trimmed title/description/gameId, parsed duration, and `sortIndex`/`isActive`/`isFinished` carried over from `item` when editing or defaulted for a new item) and awaits `onSave`, closing on success or alerting on failure. Always clears `saving` in `finally`. |
| `IconPicker` (local component) | `IconPicker({ value: string, onChange: (name: string) => void }): JSX` | Horizontal scroll row of icon chips built from the fixed `SCHEDULE_ICONS` list (trophy, dice, pause/break, info, document); tapping a chip calls `onChange` with its icon name. |

### Derived values

| Value | Type | Computed as |
|---|---|---|
| `timeValid` | `boolean` | `isValidTime(startTime)`. |
| `durValid` | `boolean` | `isValidDuration(duration)`. |
| `isValid` | `boolean` | `title` non-blank AND `icon` chosen AND `timeValid` AND `durValid` — gates the save button. |

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

The footer's three action buttons ("timer", "rules", "lotteries") all use
the same gating: disabled unless the item being edited has a `gameId` and
the corresponding handler prop was passed —
`disabled={!item?.gameId || !onTimer}` and likewise for `onRules`/
`onLotteries`. "Lotteries" calls `onLotteries(item.gameId)`, the same
navigation target [`Schedule.tsx`](Schedule.md) wires up as tapping the "+"
button on [`lottery.tsx`](../../../app/(pages)/(user)/lottery.md) would.
New items always get `sortIndex: nextSortIndex`, `isActive: false`,
`isFinished: false`.

## Used by

- [`lib/components/schedule/Schedule.tsx`](Schedule.md)
