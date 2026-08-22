# `lib/utils/lottery-draw.ts`

[← lib/utils](README.md)

## Purpose

Pure draw algorithm for options lotteries — no Appwrite or React imports, so
it's trivially testable on its own. Given a weighted option pool and a
table count, produces either one independent result per table (the room-wide
mix stays close to the configured weight ratio) or one shared result copied
to every table, depending on `sameForAllTables`.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `validateLotteryConfig(options, pullsPerTable)` | `(LotteryOption[], number) => LotteryValidationError \| null` | Checks the config is drawable; returns an error code (for i18n lookup) or `null` |
| `computeDraw(options, pullsPerTable, tableNumbers, sameForAllTables?)` | `(LotteryOption[], number, number[], boolean) => LotteryTableResult[]` | Computes a fresh draw. `sameForAllTables` defaults to `false` |
| `LotteryValidationError` | Type | `{ code: "no-options" \| "invalid-pulls-per-table" \| "missing-title" \| "invalid-weight" \| "invalid-max-per-table" \| "insufficient-capacity"; meta? }` |

### `computeDraw` parameters

| Parameter | Type | Meaning |
|---|---|---|
| `options` | `LotteryOption[]` | The option pool (title, weight, maxPerTable per option). |
| `pullsPerTable` | `number` | How many options each table receives. |
| `tableNumbers` | `number[]` | Every table to produce a result for. |
| `sameForAllTables` | `boolean` (default `false`) | `false` (default): apportion-and-deal mode — each table gets an independently-dealt hand, room-wide mix close to the weight ratio. `true`: shared mode — one hand is drawn via weighted-random selection and copied identically to every table. |

`LotteryValidationError` properties:

| Property | Type | Meaning |
|---|---|---|
| `code` | `"no-options" \| "invalid-pulls-per-table" \| "missing-title" \| "invalid-weight" \| "invalid-max-per-table" \| "insufficient-capacity"` | Which validation rule failed, used as an i18n lookup key by callers |
| `meta` | `Record<string, string \| number>` (optional) | Extra context for the message, e.g. the offending option's `title`, or `capacity`/`pullsPerTable` for `insufficient-capacity` |

Validation rule per `code`:

| `code` | Triggered when |
|---|---|
| `no-options` | `options` is empty |
| `invalid-pulls-per-table` | `pullsPerTable` isn't a positive integer |
| `missing-title` | An option's `title` is blank |
| `invalid-weight` | An option's `weight` isn't a positive integer |
| `invalid-max-per-table` | An option's `maxPerTable` isn't a positive integer |
| `insufficient-capacity` | `sum(maxPerTable)` across all options is less than `pullsPerTable` |

## How it works

### Default mode (`sameForAllTables: false`)

1. **Apportion**: `totalSlots = tableNumbers.length * pullsPerTable` is split
   across options proportional to `weight`, using the largest-remainder
   method so the split stays as close to the configured ratio as integer
   math allows.
2. **Shuffle**: the resulting multiset of option ids is Fisher-Yates
   shuffled.
3. **Deal**: `pullsPerTable` items are dealt to each table in turn, greedily
   taking the first remaining pool item that doesn't exceed that option's
   `maxPerTable` *within this table's own hand so far* (each table's cap
   usage resets per table — `maxPerTable` isn't a global cap, only a
   per-table one).
4. If a table can't be completed from what's left (a dead end — only
   reachable with `maxPerTable` configs pushed to the edge relative to
   `pullsPerTable`), the whole shuffle-and-deal is retried (bounded at 50
   attempts) before `computeDraw` throws.

`validateLotteryConfig`'s `insufficient-capacity` check
(`sum(maxPerTable) >= pullsPerTable`) is a *necessary* condition for a
table to be fillable at all, not a guarantee — the retry loop in step 4 is
what actually handles the harder case of the global apportionment leaving a
late table with too little variety left in the pool.

### Shared mode (`sameForAllTables: true`)

`computeDraw` skips apportionment entirely and calls the internal
`drawSharedHand(options, pullsPerTable)`: for each of `pullsPerTable` slots,
it filters `options` down to those not yet at their `maxPerTable` *within
this one shared hand*, then picks one via the internal
`weightedRandomPick` — a roulette-wheel selection where each eligible
option's chance of being picked is proportional to its `weight`. The
resulting `string[]` of option ids is then copied verbatim into every
table's `LotteryTableResult`.

This is deliberately **not** the same code path as apportion-and-deal with
`tableNumbers` collapsed to a single entry — apportion-by-largest-remainder
is a *deterministic* allocation (for a single hand it would always pick the
same highest-weight option, with no randomness at all), which is wrong for
a mode whose entire point is "one random draw for everyone." Because
`drawSharedHand` never depletes a shared pool (each slot re-filters the
full `options` list by the running per-option count), it can never hit the
apportion-and-deal path's "dead end" case, so there's no retry loop here.

## Used by

- [`lib/hooks/useOptionsLotteryActions.ts`](../hooks/useOptionsLotteryActions.md)
- [`app/(pages)/(user)/lottery-options-edit.tsx`](../../app/(pages)/(user)/lottery-options-edit.md)
