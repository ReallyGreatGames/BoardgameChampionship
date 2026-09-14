# `app/(pages)/(user)/schedule.tsx`

[← app](../../README.md)

## Route

`/schedule`

## Purpose

Screen shell for the schedule: [`ScheduleHeader`](../../../lib/components/schedule/ScheduleHeader.md)
above [`ScheduleList`](../../../lib/components/schedule/Schedule.md),
behind [`useRequireAuth`](../../../lib/hooks/useRequireAuth.md).

## Exports

| Export | Signature | Purpose |
| --- | --- | --- |
| `ScheduleScreen` (default) | `(): JSX.Element` | Screen component for `/schedule`. Calls `useRequireAuth()` to gate access (redirects unauthenticated users), then renders the hero and the list. |

### `makeStyles(colors: ReturnType<typeof useTheme>["colors"]): StyleSheet`

Builds `container` (flex fill, themed background, no padding — the hero
paints edge to edge and under the status bar) and `body` (the list's
gutter). Wrapped in `useMemo` keyed on `colors` so the stylesheet object is
only rebuilt when the theme changes.

## How it works

The navigator header is off for this route (`headerShown: false` in
[`app/_layout.tsx`](../../_layout.md)); the hero replaces it and opens the
drawer itself via `DrawerActions.openDrawer()`.

The item count and total planned duration for the hero's eyebrow are read
straight off the schedule store with selectors (`(s) => s.collection.length`
and `(s) => s.collection.reduce((sum, item) => sum + item.durationPlanned, 0)`),
so the screen re-renders when either changes but not on every unrelated
item edit — `ScheduleList` subscribes to the collection itself.

The horizontal gutter lives here rather than in `ScheduleList` because the
admin dashboard embeds the same list inside its own, wider one.

## Related

- [`lib/components/schedule/Schedule.tsx`](../../../lib/components/schedule/Schedule.md)
- [`lib/components/schedule/ScheduleHeader.tsx`](../../../lib/components/schedule/ScheduleHeader.md)
