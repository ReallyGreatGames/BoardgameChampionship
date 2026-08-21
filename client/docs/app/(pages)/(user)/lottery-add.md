# `app/(pages)/(user)/lottery-add.tsx`

[← app](../../README.md)

## Route

`/lottery-add?gameId=...`

## Purpose

Admin-only type picker reached from the "+" button on
[`lottery.tsx`](lottery.md): choose "Photos" or "Options" for what kind of
lottery to add.

## Exports

| Export | Signature | Purpose |
| --- | --- | --- |
| `LotteryAddScreen` (default) | `(): JSX.Element \| null` | Screen component for `/lottery-add?gameId=...`. Gates on `useRequireAuth()` and admin status, then shows a two-tile type picker ("Photos" / "Options"); selecting "Photos" reveals upload buttons, selecting "Options" navigates to `lottery-options-edit` in create mode. |

### Types

| Type | Definition | Meaning |
| --- | --- | --- |
| `LotteryType` | `"photo" \| "options"` | Which kind of lottery entry is being added; drives `selectedType` state and which panel renders. |

### `backToLottery(): void`

Replaces the route with `/(pages)/(user)/lottery?gameId=${gameId}`, returning to the lottery list for the current game. Used after a non-admin bounce, after a photo upload resolves, and as the fallback for the back button.

### `handleBack(): void`

If a type tile is already selected (`selectedType` non-null), clears the selection to return to the tile picker; otherwise calls `backToLottery()`. Wired to `BackButton`'s `onPress`.

### `handleTakePhoto(): Promise<void>`

Calls `photoActions.takePhoto(gameId)` (native-only camera capture via [`useLotteryActions`](../../../lib/hooks/useLotteryActions.md)) and then navigates back to the lottery list regardless of outcome.

### `handlePickFromLibrary(): Promise<void>`

Calls `photoActions.pickFromLibrary(gameId)` (image library picker, both web and native) and then navigates back to the lottery list regardless of outcome.

### `makeStyles(colors: ReturnType<typeof useTheme>["colors"]): StyleSheet`

Builds the tile-picker and upload-action-button styles (container, title, tiles, admin action buttons) from theme colors; memoized via `useMemo` on `colors`.

## How it works

- Not admin → immediately `router.back()`, renders nothing.
- "Photos" tile reveals the same Take Photo / Choose From Library buttons
  the old inline lottery.tsx admin row used (same
  [`useLotteryActions`](../../../lib/hooks/useLotteryActions.md) hook, same
  web/native branching — moved here verbatim, not duplicated logic); after
  the upload call resolves (success, failure, or cancel) it navigates back
  to the lottery list.
- "Options" tile navigates straight to
  [`lottery-options-edit.tsx`](lottery-options-edit.md) in create mode (no
  `instanceId`).

## Related

- [`lib/hooks/useLotteryActions.ts`](../../../lib/hooks/useLotteryActions.md)
- [`lottery.tsx`](lottery.md), [`lottery-options-edit.tsx`](lottery-options-edit.md)
