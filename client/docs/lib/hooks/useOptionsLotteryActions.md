# `lib/hooks/useOptionsLotteryActions.ts`

[← lib/hooks](README.md)

## Purpose

Create/edit/pull/delete actions for options lotteries, on top of
[`useOptionsLotteryStore`](../stores/appwrite/options-lottery-store.md) and
the pure draw algorithm in
[`lib/utils/lottery-draw.ts`](../utils/lottery-draw.md).

## Exports

### `useOptionsLotteryActions()`

Returns `{ isAdmin, saving, canRemoveOption(instance, optionId),
create(gameId, config), update(instance, config), pull(instance,
tableNumbers, confirmOpts?), remove(instance, confirmOpts?),
isPulling(id), isDeleting(id) }`.

## How it works

- `create`/`update` re-validate via `validateLotteryConfig` before writing
  (the config screen already validates inline for the Save-button-disabled
  state; this is a non-admin-safe backstop, not the primary UX).
- `update` additionally refuses if any option still referenced by an
  existing `LotteryTableResult` (`instance.results`) is missing from the
  new `config.options` — removing an option in use is blocked until the
  admin re-pulls, since results are a **live reference** to option ids, not
  a snapshot; deleting a referenced option out from under a result would
  leave a dangling id.
- `pull` computes a fresh draw via `computeDraw` and overwrites
  `resultsJson` — this is always a full overwrite (**re-pull is always
  allowed**, no immutability once pulled), optionally gated behind
  `confirmOpts` (the caller only passes a confirm dialog when
  `instance.results.length > 0`, i.e. this would overwrite an existing
  result). Catches any error `computeDraw` throws (e.g. exhausted retry
  budget on an edge-case `maxPerTable` config) and surfaces it via
  `useDialog`.
- `remove` deletes the whole row — since results are embedded JSON on the
  same row, this is the entire "delete the lottery = delete every table's
  result" cascade; there is no per-table delete.

## Used by

- [`app/(pages)/(user)/lottery-options-edit.tsx`](../../app/(pages)/(user)/lottery-options-edit.md)
