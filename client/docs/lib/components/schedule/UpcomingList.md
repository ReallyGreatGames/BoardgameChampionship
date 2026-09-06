# `lib/components/schedule/UpcomingList.tsx`

[← lib/components/schedule](README.md)

## Purpose

Home-screen list of upcoming [`Schedule`](../../models/schedule.md) items
(title + start time), with the first entry styled more prominently than the rest.

On the participant start page it renders only while no match is running —
mid-round, [`PlayerGameList`](../home/PlayerGameList.md) already shows what
is still to come.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `UpcomingList` (component) | `UpcomingList({ items: Schedule[] }): JSX` | Renders a vertical list of the given schedule items (title + `t("startsAt", { time })`), styling the first item (`index === 0`) with larger/bolder text than the rest. |

### Props

| Prop | Type | Meaning |
|---|---|---|
| `items` | `Schedule[]` | The upcoming items to display, in the order given — this component does no filtering or sorting of its own. |

## Used by

- [`app/index.tsx`](../../../app/index.md)
