# `lib/stores/appwrite/lottery-store.ts`

[← lib/stores/appwrite](README.md)

## Purpose

Zustand store mirroring the `lottery` storage bucket's file list. Read-only
— uploads go through [`useLotteryActions`](../../hooks/useLotteryActions.md)
directly against Appwrite storage, not through this store.

## Exports

### `useLotteryStore` (zustand hook)

| State/Method | Purpose |
|---|---|
| `collection: Models.File[]` | All files in the `lottery` bucket |
| `init()` | Loads the file list (up to 500) |

## How it works

Lottery photos have no database row — the bucket listing itself is the
source of truth (see [`lib/utils/lottery.ts`](../../utils/lottery.md) for
the filename convention that encodes which game a photo belongs to). This
store sets `channel: buckets.{LOTTERY_BUCKET_ID}.files` instead of the
default `databases.*.collections.*.documents` channel, so it stays live via
the bucket's own realtime events rather than a database collection's.

## Used by

- [`lib/hooks/useLotteryActions.ts`](../../hooks/useLotteryActions.md)
- [`lib/notifications/useLotteryNotifications.ts`](../../notifications/useLotteryNotifications.md)
- [`lib/bootstrap/RealTimeStoreProvider.tsx`](../../bootstrap/RealTimeStoreProvider.md)
- Screens: [`game.tsx`](../../../app/(pages)/(user)/game.md), [`lottery.tsx`](../../../app/(pages)/(user)/lottery.md)
