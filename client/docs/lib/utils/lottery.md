# `lib/utils/lottery.ts`

[← lib/utils](README.md)

## Purpose

Lottery photos have no database row of their own — the game a photo
belongs to is encoded directly in the storage file's name
(`lottery_<gameId>_<uploadedAt>.<ext>`); the bucket listing itself is the
source of truth.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `buildLotteryFileName(gameId, extension)` | `(string, string) => string` | Builds the filename for a new upload |
| `parseLotteryFileName(name)` | `(string) => { gameId: string } \| null` | Extracts the game id from a filename |
| `getLotteryPhotosForGame(files, gameId)` | `(Models.File[], string) => NumberedLotteryPhoto[]` | Filters a bucket listing down to one game's photos, numbered by upload order (oldest = 1), newest first |
| `NumberedLotteryPhoto` | Type | `{ fileId, gameId, createdAt, number }` |

## Used by

- [`app/(pages)/(user)/game.tsx`](../../app/(pages)/(user)/game.md)
- [`app/(pages)/(user)/lottery.tsx`](../../app/(pages)/(user)/lottery.md)
- [`lib/hooks/useLotteryActions.ts`](../hooks/useLotteryActions.md)
- [`lib/notifications/useLotteryNotifications.ts`](../notifications/useLotteryNotifications.md)
