# `app/(pages)/(user)/game.tsx`

[← app](../../README.md)

## Route

`/game?gameId=...&from=...`

## Purpose

Per-game hub: shows the player's table seating, a grid of action buttons
(lottery, rules, timer, results — each gated by table assignment, active-game
status, and feature flags), and the table-bell toggle.

## How it works

### Action button gating

Each entry in `ACTION_BUTTONS` declares `requiresActiveGame?` and
`featureFlag?`; a button is disabled if the player has no table yet
(except "rules"/"lottery", which don't need one), the game isn't the
currently active one but the action requires it, or its feature flag
([`useFeatureFlags`](../../../lib/feature-flags/useFeatureFlags.md)) is off.

### First-time timer setup detour

Pressing "timer" checks whether this table already has saved player
colors (`playerColors_{gameId}_{tableNumber}` in
[`secureStorage`](../../../lib/secureStorage.md)) — if not, it opens
[`PlayerColorSetupModal`](../../../lib/components/onboarding/PlayerColorSetupModal.md)
first instead of navigating straight to `/timer`. Saving that modal writes
the colors locally **and** persists `playerPositions` onto the
[`Timer`](../../../lib/models/timer.md) document (creating it if it
doesn't exist yet) before finally navigating to the timer screen.

The storage key is deliberately `(gameId, tableNumber)`-scoped, not just
`gameId` — a game can have several tables, each needing its own
independent setup; keying by `gameId` alone would silently skip this setup
for every table but the first one touched.

### Table bell

Bell color/icon/disabled state mirrors
[`TimerControlPanel`](../../../lib/components/timer/TimerControlPanel.md)'s
own bell styling logic (duplicated here rather than shared, since the two
screens' surrounding layout differs enough that extracting a shared
component wasn't worth it).

### Lottery badge

The lottery action button's numeric badge is `getLotteryPhotosForGame(...).length`
plus the count of options-lottery instances (from
[`getOptionsLotteriesForGame`](../../../lib/utils/options-lottery.md)) that
have a pulled result for the player's own table
(`getResultForTable(instance, tableNumber) !== null`) — a player with no
table yet contributes `0` from that half.

## Related

- [`lib/hooks/usePlayerTable.ts`](../../../lib/hooks/usePlayerTable.md), [`useTableBellActions.ts`](../../../lib/hooks/useTableBellActions.md)
- [`lib/components/game/Table.tsx`](../../../lib/components/game/Table.md)
- [`lib/stores/appwrite/timer-store.ts`](../../../lib/stores/appwrite/timer-store.md), [`options-lottery-store.ts`](../../../lib/stores/appwrite/options-lottery-store.md)
