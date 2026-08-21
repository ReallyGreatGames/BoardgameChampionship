# `app/(pages)/(user)/lottery-add.tsx`

[← app](../../README.md)

## Route

`/lottery-add?gameId=...`

## Purpose

Admin-only type picker reached from the "+" button on
[`lottery.tsx`](lottery.md): choose "Photos" or "Options" for what kind of
lottery to add.

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
