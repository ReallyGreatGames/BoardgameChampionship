# `app/(pages)/(user)/lottery.tsx`

[← app](../../README.md)

## Route

`/lottery?gameId=...`

## Purpose

Photo gallery for a game's lottery draw, with admin upload (camera or
library) and delete, and a swipeable full-screen viewer.

## How it works

On web, only "choose from library" is shown — `launchCameraAsync` has no
real camera-capture affordance in desktop browsers and just falls back to
the same file picker as the library option, so showing both buttons there
would just be confusing; native (iOS/Android) shows both.

The full-screen viewer is a horizontal, paging `FlatList` seeded at
`viewerIndex` via `initialScrollIndex` + a manually supplied
`getItemLayout` (required for `initialScrollIndex` to jump directly to the
right offset instead of only working after a layout pass reaches it).

Column count (2 on compact/phone widths, 3 otherwise) is passed as the
`FlatList`'s `key` — changing `numColumns` on a live `FlatList` is
otherwise unsupported by React Native and silently ignored; re-keying
forces a full remount instead.

## Related

- [`lib/hooks/useLotteryActions.ts`](../../../lib/hooks/useLotteryActions.md)
- [`lib/stores/appwrite/lottery-store.ts`](../../../lib/stores/appwrite/lottery-store.md)
- [`lib/utils/lottery.ts`](../../../lib/utils/lottery.md)
