# `app/(pages)/(user)/lottery-options-edit.tsx`

[← app](../../README.md)

## Route

`/lottery-options-edit?gameId=...&instanceId=...&draft=...&from=...`
(`instanceId` omitted = create mode)

## Purpose

Admin-only screen for both creating a new options lottery and managing an
existing one: name, `pullsPerTable`, a "same result for all tables" switch,
the option pool (title, optional description, weight, maxPerTable), save,
pull-for-all-tables, a button to the full-screen results board, and delete.

## Exports

| Export | Signature | Purpose |
| --- | --- | --- |
| `LotteryOptionsEditScreen` (default) | `(): JSX.Element \| null` | Screen component for `/lottery-options-edit?gameId=...&instanceId=...&draft=...`. Resolves the existing instance (if any) and this game's table numbers, gates on admin status, then renders `LotteryOptionsEditForm` keyed to force a remount on each logically distinct visit. |

### Internal: `emptyOption(): LotteryOption`

Builds a fresh, blank `LotteryOption` row (`id: ID.unique()`, empty title/description, `weight: 1`, `maxPerTable: 1`) — used to seed a brand-new instance's option list and for "add option".

### Internal: `LotteryOptionsEditForm(props): JSX.Element`

The actual form: name/pullsPerTable fields, the option-row list with add/remove, save, and — once an `instance` exists — pull, delete, and (once results exist) a button to [`lottery-results.tsx`](lottery-results.md), the full-screen results board.

| Prop | Type | Meaning |
| --- | --- | --- |
| `gameId` | `string` | Game this instance belongs (or will belong) to. |
| `draft` | `string \| undefined` | Fresh id minted by `lottery-add.tsx` for a new-instance attempt; preserved through the create→edit-mode redirect. |
| `from` | `string \| undefined` | Where "back" should return to, forwarded from whichever screen navigated here (see "How it works" on [`lottery-add.tsx`](lottery-add.md#why-from-exists)); carried through the create→edit-mode redirect alongside `draft`. |
| `instance` | `OptionsLottery \| null` | The parsed existing instance being edited, or `null` in create mode. |
| `tableNumbers` | `number[]` | Every table number for this game, used for "pull for all tables" and to disable Pull when there are no tables yet. |
| `colors` | `ReturnType<typeof useTheme>["colors"]` | Current theme colors. |
| `styles` | `ReturnType<typeof makeStyles>` | Shared stylesheet. |
| `backToLottery` | `() => void` | Navigates back to `from` if present, otherwise the lottery list; used by the back button and after a successful delete. |

### `updateOption(id: string, patch: Partial<LotteryOption>): void`

Merges `patch` into the option matching `id` within local `options` state, leaving other rows untouched.

### `addOption(): void`

Appends a fresh `emptyOption()` row to `options`.

### `removeOption(id: string): Promise<void>`

If editing an existing `instance` and `actions.canRemoveOption(instance, id)` is false (the option is still referenced by a saved result), shows a blocking explanatory dialog and leaves `options` unchanged; otherwise removes the row with that `id` from `options`.

### `handleSave(): Promise<void>`

No-ops if `validationError` is set. Otherwise builds a `LotteryConfigInput` (`{ name, pullsPerTable: pullsPerTableNumber, sameForAllTables, options }`) and either calls `actions.update(instance, config)` (editing) or `actions.create(gameId, config)` (creating); on successful create, replaces the route to the same screen with the new `instanceId` attached (keeping `draft` so the form doesn't remount — see "How it works").

### `handlePull(): Promise<void>`

No-ops if there's no `instance`. Calls `actions.pull(instance, tableNumbers, confirmOptions)`, where `confirmOptions` is a translated destructive re-pull confirmation if `instance.results.length > 0` (an existing pull would be overwritten), or `undefined` for a first pull (no confirmation needed).

### `handleDelete(): Promise<void>`

No-ops if there's no `instance`. Calls `actions.remove(instance, ...)` with a translated destructive confirm dialog; if it resolves truthy, calls `backToLottery()`.

### `makeStyles(colors: ReturnType<typeof useTheme>["colors"]): StyleSheet`

Builds all form/card/button styles from theme colors; memoized via `useMemo` on `colors`.

## How it works

- Not admin → immediately calls `backToLottery()`, renders nothing.
- Local form state (`name`, `pullsPerTable`, `sameForAllTables`, `options`)
  is seeded once from the existing instance (looked up by `instanceId` in
  [`useOptionsLotteryStore`](../../../lib/stores/appwrite/options-lottery-store.md)'s
  collection) if editing, or blank/`false`/a single empty option row if
  creating.
- The "same result for all tables" switch controls
  [`computeDraw`](../../../lib/utils/lottery-draw.md)'s draw mode: off
  (default), each table gets an independently-dealt hand; on, one hand is
  drawn and copied to every table. It doesn't change validation — the same
  `sum(maxPerTable) >= pullsPerTable` capacity check applies either way.
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
- Once `instance.results.length > 0`, a "view fullscreen" button replaces
  the "not pulled yet" placeholder and navigates to
  [`lottery-results.tsx`](lottery-results.md) (`?gameId=...` — no
  `instanceId`, since that page is game-scoped and merges every pulled
  instance for the game, not just this one). The actual per-table results
  board lives entirely on that dedicated full-screen page now, not inline
  here, so it can use the whole screen (e.g. for projecting onto a wall)
  without competing for space with the config form above it.

### `key={draft ?? instanceId ?? "new"}` remount strategy

`LotteryOptionsEditForm` is deliberately remounted (all local form state reset) whenever the visit is logically different: a different existing `instanceId`, or a fresh create attempt (`draft` is a new id minted by `lottery-add.tsx` on every tap of the "Options" tile, so two separate create attempts never collide even though both lack an `instanceId`). Crucially, `draft` (and `from`, URL-encoded) is carried through the create→edit-mode redirect in `handleSave` (`&draft=${draft}&instanceId=${created.$id}&from=...`), so the key stays the same across that transition and the form does *not* remount — preserving whatever the admin just saved instead of discarding it back to a blank/seeded state, while `backToLottery()` still knows where to return to afterward.

### Validation-gated Save

`validationError` (`useMemo`, deps `[options, pullsPerTableNumber]`) runs `validateLotteryConfig` on every options/pulls-per-table change; a non-null result disables Save and Pull and renders a translated error string (`t(\`errors.${validationError.code}\`, validationError.meta)`) — this keeps the form from ever submitting a config the draw algorithm couldn't actually resolve (e.g. not enough total weight/capacity to satisfy `pullsPerTable` across all tables).

## Related

- [`lib/hooks/useOptionsLotteryActions.ts`](../../../lib/hooks/useOptionsLotteryActions.md)
- [`lib/utils/lottery-draw.ts`](../../../lib/utils/lottery-draw.md), [`options-lottery.ts`](../../../lib/utils/options-lottery.md)
- [`lottery.tsx`](lottery.md), [`lottery-add.tsx`](lottery-add.md), [`lottery-results.tsx`](lottery-results.md)
