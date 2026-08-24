# `app/(pages)/(user)/schedule.tsx`

[← app](../../README.md)

## Route

`/schedule`

## Purpose

Thin screen wrapper: [`ScheduleList`](../../../lib/components/schedule/Schedule.md)
behind [`useRequireAuth`](../../../lib/hooks/useRequireAuth.md).

## Exports

| Export | Signature | Purpose |
| --- | --- | --- |
| `ScheduleScreen` (default) | `(): JSX.Element` | Screen component for `/schedule`. Calls `useRequireAuth()` to gate access (redirects unauthenticated users), then renders `ScheduleList` inside a themed, padded full-screen container. |

### `makeStyles(colors: ReturnType<typeof useTheme>["colors"]): StyleSheet`

Builds the single `container` style (flex fill, themed background, screen padding/top-inset) from the current theme's colors. Wrapped in `useMemo` keyed on `colors` so the stylesheet object is only rebuilt when the theme changes.

## Related

- [`lib/components/schedule/Schedule.tsx`](../../../lib/components/schedule/Schedule.md)
