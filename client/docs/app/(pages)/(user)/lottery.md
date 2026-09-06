# `app/(pages)/(user)/lottery.tsx`

[← app](../../README.md)

## Route

`/lottery?gameId=...&from=...`

## Purpose

Sectioned lottery list for a game: a photo gallery (admin upload via camera
or library, delete, swipeable full-screen viewer) plus one section per
options-lottery instance that has been pulled, showing the current
player's own table's result. Admin management (add/edit/pull/delete) lives
on separate screens reached from here, not inline.

## Exports

| Export | Signature | Purpose |
| --- | --- | --- |
| `LotteryScreen` (default) | `(): JSX.Element` | Screen component for `/lottery?gameId=...`. Gates on `useRequireAuth()`; renders the photo grid (`FlatList`) and options-lottery sections, a full-screen swipeable photo viewer `Modal`, and an admin "+" entry point. |

### Internal: `fileUrl(fileId: string): string`

Resolves an Appwrite storage file id to a viewable image URL via `storage.getFileViewURL(LOTTERY_BUCKET_ID, fileId).toString()`. Used for both grid thumbnails and the full-screen viewer.

### Internal: `OptionsLotterySection(props): JSX.Element`

Renders one options-lottery instance's card: its `name`, and either "not pulled yet" (no results at all), "not assigned to a table" (player has no table), or the pulled options for the current player's table. Wraps itself in a `Pressable` (navigating to `lottery-options-edit`) only when `isAdmin` is true; otherwise renders the card content directly, non-interactive.

| Prop | Type | Meaning |
| --- | --- | --- |
| `instance` | `OptionsLottery` | The lottery instance to render. |
| `playerTable` | `number \| null` | The current player's table number, or `null` if unassigned. |
| `isAdmin` | `boolean` | Whether to make the card tappable (admin edit) and show the chevron affordance. |
| `gameId` | `string` | Game id, used to build the edit-screen navigation URL. |
| `styles` | `ReturnType<typeof makeStyles>` | Shared stylesheet passed down from the parent screen. |
| `colors` | `ReturnType<typeof useTheme>["colors"]` | Current theme colors, for the chevron icon. |
| `t` | `(key: string, opts?: any) => string` | Translation function bound to the `lotteryOptions` namespace. |

### `handleBack(): void`

Pops the recorded origin via [`goBackTo`](../../../lib/utils/navigation.md), returning to whichever screen opened the lottery list. Falls back to the `from` query param, then `/game?gameId=${gameId}` (or `/`). The screen also builds its own `selfHref` and passes it as the `origin` when opening `lottery-add` or the options editor (the latter through `OptionsLotterySection`'s `origin` prop).

### `handleDelete(fileId: string): Promise<void>`

Calls `actions.remove(fileId, ...)` with a translated destructive confirm dialog to delete a lottery photo.

### `makeStyles(colors: ReturnType<typeof useTheme>["colors"], numColumns: number): StyleSheet`

Builds all grid/card/viewer styles; `tileWidth` is derived from `numColumns` (`"48%"` for 2 columns, `"31%"` for 3) so tiles fit their row with even gaps. Memoized via `useMemo` on `[colors, numColumns]` — recomputes when either the theme or the column count (driven by screen width crossing the tablet breakpoint) changes.

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

### Memoized derivations

`photos` (`useMemo`, deps `[collection, gameId]`) filters the raw lottery store collection down to this game's photo entries via `getLotteryPhotosForGame`.

`visibleOptionsLotteries` (`useMemo`, deps `[optionsLotteryRows, gameId, isAdmin]`) resolves this game's options-lottery instances and, for non-admins, filters out any instance with zero results (not yet pulled) — recomputes whenever the raw rows, the game, or the viewer's admin status changes.

## Related

- [`lib/hooks/useLotteryActions.ts`](../../../lib/hooks/useLotteryActions.md), [`usePlayerTable.ts`](../../../lib/hooks/usePlayerTable.md)
- [`lib/stores/appwrite/lottery-store.ts`](../../../lib/stores/appwrite/lottery-store.md), [`options-lottery-store.ts`](../../../lib/stores/appwrite/options-lottery-store.md)
- [`lib/utils/lottery.ts`](../../../lib/utils/lottery.md), [`options-lottery.ts`](../../../lib/utils/options-lottery.md)
- [`lottery-add.tsx`](lottery-add.md), [`lottery-options-edit.tsx`](lottery-options-edit.md)
