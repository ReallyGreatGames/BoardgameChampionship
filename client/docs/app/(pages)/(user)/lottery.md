# `app/(pages)/(user)/lottery.tsx`

[← app](../../README.md)

## Route

`/lottery?gameId=...`

## Purpose

Sectioned lottery list for a game: a photo gallery (admin upload via camera
or library, delete, swipeable full-screen viewer) plus one section per
options-lottery instance that has been pulled, showing the current
player's own table's result. Admin management (add/edit/pull/delete) lives
on separate screens reached from here, not inline.

## How it works

### Sections

- **Photos** — unchanged from before: a `FlatList` grid (2 cols
  compact/phone, 3 cols tablet — re-keyed on `numColumns` since React
  Native doesn't support changing that prop on a live list), plus a
  swipeable full-screen `Modal` viewer.
- **Options lotteries** — one section per instance from
  [`getOptionsLotteriesForGame`](../../../lib/utils/options-lottery.md).
  Non-admins only see instances with `results.length > 0` (an instance is
  invisible to players until the admin's first pull); admins see every
  instance for the game, including not-yet-pulled drafts, showing a "not
  pulled yet" placeholder instead — otherwise a freshly-created,
  not-yet-pulled instance would be unreachable (no other screen lists
  drafts) and couldn't be pulled or deleted. Each section shows the
  instance's `name` and the current player's own table's result, resolved
  via [`usePlayerTable(gameId)`](../../../lib/hooks/usePlayerTable.md) →
  `getResultForTable`. If the player has no table yet, the section shows a
  "not assigned to a table" placeholder instead of a result. Tapping a
  section (admin only) navigates to
  [`lottery-options-edit.tsx`](lottery-options-edit.md) for that instance.

Options sections render as the photo `FlatList`'s `ListFooterComponent` (to
avoid nesting a `FlatList` inside a `ScrollView`) when there are photos, or
directly when there are none. A group header ("Options"/`typeOptions`)
precedes the options-lottery cards, symmetric with the "Photos" header
shown above the photo grid when both kinds of content are present.

### Admin entry point

A single admin-only "+" button navigates to
[`lottery-add.tsx`](lottery-add.md) (the type picker) instead of the old
always-visible Take Photo / Choose From Library buttons, which moved there.

## Related

- [`lib/hooks/useLotteryActions.ts`](../../../lib/hooks/useLotteryActions.md), [`usePlayerTable.ts`](../../../lib/hooks/usePlayerTable.md)
- [`lib/stores/appwrite/lottery-store.ts`](../../../lib/stores/appwrite/lottery-store.md), [`options-lottery-store.ts`](../../../lib/stores/appwrite/options-lottery-store.md)
- [`lib/utils/lottery.ts`](../../../lib/utils/lottery.md), [`options-lottery.ts`](../../../lib/utils/options-lottery.md)
- [`lottery-add.tsx`](lottery-add.md), [`lottery-options-edit.tsx`](lottery-options-edit.md)
