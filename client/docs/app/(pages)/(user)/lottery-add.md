# `app/(pages)/(user)/lottery-add.tsx`

[← app](../../README.md)

## Route

`/lottery-add?gameId=...&from=...`

## Purpose

Admin-only type picker reached from the "+" button on
[`lottery.tsx`](lottery.md), or directly from the schedule item modal's
"lotteries" action (see [`Schedule.tsx`](../../../lib/components/schedule/Schedule.md)):
choose "Photos" or "Options" for what kind of lottery to add.

## Exports

| Export | Signature | Purpose |
| --- | --- | --- |
| `LotteryAddScreen` (default) | `(): JSX.Element \| null` | Screen component for `/lottery-add?gameId=...&from=...`. Gates on `useRequireAuth()` and admin status, then shows a two-tile type picker ("Photos" / "Options"); selecting "Photos" reveals upload buttons, selecting "Options" navigates to `lottery-options-edit` in create mode. |

### Types

| Type | Definition | Meaning |
| --- | --- | --- |
| `LotteryType` | `"photo" \| "options"` | Which kind of lottery entry is being added; drives `selectedType` state and which panel renders. |

### `backToLottery(): void`

Pops the recorded origin via [`goBackTo`](../../../lib/utils/navigation.md), falling back to the `from`
query param and then to `/(pages)/(user)/lottery?gameId=${gameId}` (the
lottery list for the current game). Used after a photo upload resolves and
as the fallback for the back button — see "How it works" for why `from`
exists. The non-admin bounce uses `redirectTo` instead, since a
render-phase redirect must not consume a back-history entry.

### `handleBack(): void`

If a type tile is already selected (`selectedType` non-null), clears the selection to return to the tile picker; otherwise calls `backToLottery()`. Wired to `BackButton`'s `onPress`.

### `handleTakePhoto(): Promise<void>`

Calls `photoActions.takePhoto(gameId)` (native-only camera capture via [`useLotteryActions`](../../../lib/hooks/useLotteryActions.md)) and then navigates back to the lottery list regardless of outcome.

### `handlePickFromLibrary(): Promise<void>`

Calls `photoActions.pickFromLibrary(gameId)` (image library picker, both web and native) and then navigates back to the lottery list regardless of outcome.

### `makeStyles(colors: ReturnType<typeof useTheme>["colors"]): StyleSheet`

Builds the tile-picker and upload-action-button styles (container, title, tiles, admin action buttons) from theme colors; memoized via `useMemo` on `colors`.

## How it works

- Not admin → immediately calls `backToLottery()`, renders nothing.
- "Photos" tile reveals the same Take Photo / Choose From Library buttons
  the old inline lottery.tsx admin row used (same
  [`useLotteryActions`](../../../lib/hooks/useLotteryActions.md) hook, same
  web/native branching — moved here verbatim, not duplicated logic); after
  the upload call resolves (success, failure, or cancel) it navigates back
  via `backToLottery()`.
- "Options" tile navigates to [`lottery-options-edit.tsx`](lottery-options-edit.md)
  in create mode (no `instanceId`, a fresh `draft` id), forwarding `from`
  (URL-encoded) if one was passed to this screen.

### Why `from` exists

This screen has two entry points with different "back" expectations: the
"+" button on [`lottery.tsx`](lottery.md) (no `from` — back should return
to that game's lottery list, the historical default) and the schedule item
modal's "lotteries" action (`from=/(pages)/(user)/schedule` — back should
return to the schedule, not detour through a lottery list the admin never
visited). Without `from`, `backToLottery()` always went to
`/(pages)/(user)/lottery?gameId=...`, which for the schedule entry point
made "back" land on that game's hub screen after one more back-press
instead of the schedule the admin actually came from — the same `?from=...`
pattern [`game.tsx`](game.md) already uses for the same reason. `from` is
also carried through to `lottery-options-edit.tsx` (both on navigating to
it and through its own create→edit-mode redirect) so the whole chain
reachable from this screen returns to the correct origin.

## Related

- [`lib/hooks/useLotteryActions.ts`](../../../lib/hooks/useLotteryActions.md)
- [`lottery.tsx`](lottery.md), [`lottery-options-edit.tsx`](lottery-options-edit.md)
