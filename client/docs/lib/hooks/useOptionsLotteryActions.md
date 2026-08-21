# `lib/hooks/useOptionsLotteryActions.ts`

[← lib/hooks](README.md)

## Purpose

Create/edit/pull/delete actions for options lotteries, on top of
[`useOptionsLotteryStore`](../stores/appwrite/options-lottery-store.md) and
the pure draw algorithm in
[`lib/utils/lottery-draw.ts`](../utils/lottery-draw.md).

## Exports

### `useOptionsLotteryActions()`

Takes no parameters. Wires together [`useAuth`](../auth.md) (`isAdmin`),
[`useOptionsLotteryStore`](../stores/appwrite/options-lottery-store.md),
[`useDialog`](../components/ui/Dialog.md), and three local loading flags
(`saving`, `pullingId`, `deletingId`). `LotteryConfigInput` is
`{ name: string; pullsPerTable: number; options: LotteryOption[] }`, the
shape a caller edits in the config form before it's serialized for storage.
Returns:

| Property | Signature | Meaning |
|---|---|---|
| `isAdmin` | `boolean` | Passthrough from `useAuth` — gates every mutation below. |
| `saving` | `boolean` | `true` while `create` or `update` is in flight. |
| `canRemoveOption` | `(instance: OptionsLottery, optionId: string) => boolean` | `true` if no existing `LotteryTableResult` in `instance.results` references `optionId` — used to disable removing an option that's already been drawn. |
| `create` | `(gameId: string, config: LotteryConfigInput) => Promise<OptionsLottery \| null>` | Returns `null` immediately if not admin or `validateLotteryConfig` rejects the config. Otherwise creates a new row (`resultsJson: "[]"`, i.e. no draw yet), tracking `saving`, and returns the parsed `OptionsLottery` on success or `null` if the store write failed. |
| `update` | `(instance: OptionsLottery, config: LotteryConfigInput) => Promise<boolean>` | Returns `false` if not admin, the config fails validation, or the new `config.options` would drop an option id still referenced by `instance.results` (see How it works). Otherwise writes the updated name/pullsPerTable/options, tracking `saving`, and returns whether the store update succeeded. |
| `pull` | `(instance: OptionsLottery, tableNumbers: number[], confirmOpts?: DialogOptions) => Promise<boolean>` | Returns `false` if not admin. If `instance.results` is non-empty and `confirmOpts` is given, confirms before overwriting. Computes a fresh draw with `computeDraw(instance.options, instance.pullsPerTable, tableNumbers)` and writes it to `resultsJson`, tracking `pullingId`. Returns `false` (after showing an error dialog) if `computeDraw` throws, or the store update's success flag otherwise. |
| `remove` | `(instance: OptionsLottery, confirmOpts?: DialogOptions) => Promise<boolean>` | Returns `false` if not admin. Optionally confirms, then deletes the entire lottery row (which cascades to every table's embedded result — see How it works), tracking `deletingId`, and returns the store delete's success flag. |
| `isPulling` | `(id: string) => boolean` | `true` if `id` is the lottery instance currently mid-`pull`. |
| `isDeleting` | `(id: string) => boolean` | `true` if `id` is the lottery instance currently mid-`remove`. |

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
