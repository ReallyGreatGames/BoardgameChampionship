# `app/(pages)/(user)/lottery-results.tsx`

[← app](../../README.md)

## Route

`/lottery-results?gameId=...&from=...`

## Purpose

Admin-only, full-screen results board for a game — merges every
options-lottery instance for that game that has been pulled, pulled out of
[`lottery-options-edit.tsx`](lottery-options-edit.md) onto its own page so
it can use the entire screen (e.g. for projecting onto a wall) instead of
competing for space with the config form. Reached via a "view fullscreen"
button on any of the game's options-lottery config screens, but is itself
game-scoped, not instance-scoped — it always shows every pulled instance
for the game, regardless of which instance's edit screen the admin came
from. `headerShown: false` in `app/_layout.tsx`'s `Drawer.Screen` entry for
this route, so the Drawer's own header never appears — this screen renders
its own header (title + close button) instead.

## Exports

| Export | Signature | Purpose |
| --- | --- | --- |
| `LotteryResultsScreen` (default) | `(): JSX.Element \| null` | Screen component for `/lottery-results?gameId=...`. Gates on `useRequireAuth()` and admin status, resolves every pulled options-lottery instance for the game, and renders the merged shared-results section plus the merged per-table grid. |

### Internal: `resolveResultDisplay(instance: OptionsLottery, optionIds: string[]): { titles: string; descriptions: string }`

Resolves an array of pulled option ids against `instance.options` into two display strings: comma-joined titles (`"?"` for any id that no longer resolves to an option), and `" · "`-joined descriptions (options with no description are skipped, not shown as empty).

### Internal: `type TableCard`

| Field | Type | Meaning |
|---|---|---|
| `table` | `number` | Table number this merged card represents. |
| `titles` | `string` | Every per-table-mode instance's resolved titles for this table, joined with `", "`. |
| `descriptions` | `string` | Every per-table-mode instance's resolved descriptions for this table, joined with `" · "`. |

### `handleClose(): void`

Pops the recorded origin via [`goBackTo`](../../../lib/utils/navigation.md), returning to the options editor that opened this board. Falls back to the `from` query param and then `/(pages)/(user)/lottery?gameId=${gameId}` (the game's lottery list) — a game-scoped destination, since this page no longer belongs to any single instance. Wired to the header's close button. The non-admin bounce uses `redirectTo` instead, since a render-phase redirect must not consume a back-history entry.

### `makeStyles(colors: ReturnType<typeof useTheme>["colors"], cardWidth: number): StyleSheet`

Builds the header/shared-section/grid/card styles from theme colors and the current per-card pixel width; memoized via `useMemo` on `[colors, cardWidth]`.

## How it works

- Not admin → immediately calls `handleClose()`, renders nothing.
- `numColumns` is derived from `useWindowDimensions()`'s width against two
  breakpoints (`ui.breakpointTablet` = 600, and 1100) giving 2/3/4 columns
  — more columns than [`lottery-options-edit.tsx`](lottery-options-edit.md)'s
  old inline grid ever used, since this page has the whole screen to
  itself and a wide projector/TV display is exactly the case it's
  designed for. `cardWidth` is then computed in exact pixels —
  `(screenWidth - inset.screen*2 - gridGap*(numColumns-1)) / numColumns` —
  rather than a percentage string; a percentage-based column width doesn't
  account for the `gap` between cards, so a naive `${100/numColumns}%`
  either overflows the row (forcing an uneven wrap) or leaves the last
  column short of the right edge, breaking the left/right symmetry a
  projected results board needs.
- `pulledInstances` (`useMemo`, deps `[rows, gameId]`) is every
  [`getOptionsLotteriesForGame`](../../../lib/utils/options-lottery.md)
  result for this game filtered to `results.length > 0` — the same
  store/filter pattern [`lottery.tsx`](lottery.md) uses for players, so
  this stays live: a re-pull from any device flows into the store's
  realtime update and this screen re-renders automatically.
- Instances split into two groups, rendered as two separate sections:
  - **`sharedInstances`** (`sameForAllTables === true`) render at the top,
    one block per instance (labeled with the instance's `name` since more
    than one can exist), each showing only `results[0]` — every table's
    result is identical by construction for a shared-mode instance, see
    [`computeDraw`](../../../lib/utils/lottery-draw.md) — at a large,
    centered, `type.display`-sized title with a `type.h2` description
    underneath.
  - **`tableCards`** (`useMemo`, deps `[pulledInstances]`) merges every
    *non*-shared instance's results per table: for each per-table-mode
    instance's `results`, resolves that instance's display strings for
    each table and appends them into a `Map<table, {titles[],
    descriptions[]}>` keyed by table number, so if two different
    instances (e.g. "Scenario Sheet" and "Starting Resources") both have a
    result for table 5, that table gets **one** merged card showing both
    instances' titles/descriptions concatenated, not two separate cards.
    Cards below the shared section, one per table, sorted ascending.
- If there's nothing to show at all (no pulled instances of either kind),
  shows a centered "not pulled yet" placeholder instead of empty sections.
- Each per-table card mirrors the "spot the table from afar, then read the
  result" design from `lottery-options-edit.tsx`'s original inline cards,
  sized up for a full-screen/projector context: a large, bold,
  accent-colored table-number tile on the left and the result text on the
  right (title line then description line, each `numberOfLines={2}`).

## Related

- [`lib/stores/appwrite/options-lottery-store.ts`](../../../lib/stores/appwrite/options-lottery-store.md)
- [`lib/utils/options-lottery.ts`](../../../lib/utils/options-lottery.md), [`lottery-draw.ts`](../../../lib/utils/lottery-draw.md)
- [`lottery-options-edit.tsx`](lottery-options-edit.md), [`lottery.tsx`](lottery.md)
