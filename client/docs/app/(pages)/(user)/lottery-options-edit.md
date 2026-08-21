# `app/(pages)/(user)/lottery-options-edit.tsx`

[← app](../../README.md)

## Route

`/lottery-options-edit?gameId=...&instanceId=...` (`instanceId` omitted = create mode)

## Purpose

Admin-only screen for both creating a new options lottery and managing an
existing one: name, `pullsPerTable`, the option pool (title, optional
description, weight, maxPerTable), save, pull-for-all-tables, a read-only
per-table results breakdown, and delete.

## How it works

- Not admin → immediately `router.back()`, renders nothing.
- Local form state (`name`, `pullsPerTable`, `options`) is seeded once from
  the existing instance (looked up by `instanceId` in
  [`useOptionsLotteryStore`](../../../lib/stores/appwrite/options-lottery-store.md)'s
  collection) if editing, or a single empty option row if creating.
- Inline validation via
  [`validateLotteryConfig`](../../../lib/utils/lottery-draw.md) disables
  Save and shows a translated error (`lotteryOptions.errors.<code>`) while
  the config isn't drawable.
- Removing an option row that's still referenced by an existing result is
  blocked (`useOptionsLotteryActions().canRemoveOption`) with an
  explanatory dialog instead of silently failing later on save.
- Saving in create mode calls `actions.create` then `router.replace`s to
  the same route with the new `instanceId` — this switches the screen into
  edit mode (revealing Pull/Delete) without leaving a stale create-mode
  entry in the navigation stack.
- "Pull for all tables" reads every table number for this game from
  [`useTableStore`](../../../lib/stores/appwrite/table-store.md) (matching
  the `game.$id === gameId` filter used elsewhere, e.g.
  [`usePlayerTable`](../../../lib/hooks/usePlayerTable.md)), confirms
  first only if results already exist (re-pull overwrites everything), and
  delegates the actual draw to `useOptionsLotteryActions().pull`.
- The results breakdown (table → resolved option titles) is this screen's
  admin "board" — there's no separate all-tables view elsewhere in the app.

## Related

- [`lib/hooks/useOptionsLotteryActions.ts`](../../../lib/hooks/useOptionsLotteryActions.md)
- [`lib/utils/lottery-draw.ts`](../../../lib/utils/lottery-draw.md), [`options-lottery.ts`](../../../lib/utils/options-lottery.md)
- [`lottery.tsx`](lottery.md), [`lottery-add.tsx`](lottery-add.md)
