# `app/(pages)/(user)/game.tsx`

[← app](../../README.md)

## Route

`/game?gameId=...&from=...`

## Purpose

Per-game hub: shows the player's table seating, a grid of action buttons
(lottery, rules, timer, results — each gated by table assignment, active-game
status, and feature flags), and the table-bell toggle.

## Exports

| Export | Signature | Purpose |
| --- | --- | --- |
| `GamePage` (default) | `(): JSX.Element` | Screen component for `/game?gameId=...&from=...`. Renders the player's table (or a table-selection prompt), the action button grid, and the table-bell toggle; also owns the first-time timer color setup flow. |

### Types

| Type | Fields | Meaning |
| --- | --- | --- |
| `ActionButton` | `key: string`, `icon: React.ComponentProps<typeof Ionicons>["name"]`, `labelKey: string`, `onPress: (gameId: string) => void`, `requiresActiveGame?: boolean`, `featureFlag?: (typeof FeatureFlagSlugs)[keyof typeof FeatureFlagSlugs]` | Describes one action-grid button: its icon/label, navigation handler, and the two gating conditions (must be the active game / must have a feature flag enabled) evaluated against player and game state. |

### Module constants

| Constant | Type | Meaning |
| --- | --- | --- |
| `ACTION_BUTTONS` | `ActionButton[]` | The four fixed action buttons (lottery, rules, timer, results) with their icons, labels, gating flags, and navigation targets. |

### `formatElapsed(seconds: number): string`

Formats a duration in whole seconds as `MM:SS` (zero-padded). Used for the table-bell's elapsed-time label.

### `handleBack(): void`

Replaces the route with the `from` query param if present, otherwise `/(pages)/(user)/schedule`.

### `handleTimerPress(): Promise<void>`

Checks `secureStorage` for previously-saved player colors keyed by `playerColors_{gameId}_{tableNumber}`; if none exist and a `currentTable` is resolved, opens `PlayerColorSetupModal` (`colorSetupVisible`) instead of navigating; otherwise pushes straight to `/(pages)/(user)/timer?gameId=...`. Bound as the "timer" action button's press handler (overriding its plain `onPress` from `ACTION_BUTTONS`).

### `handleSaveSetup(playerIds: (string | null)[], hexColors: string[]): Promise<void>`

Called by `PlayerColorSetupModal.onSave`. Persists `hexColors` to `secureStorage` under the per-table key, filters `playerIds` down to non-null ids, and either updates the existing `Timer` document's `playerPositions` for this table/game or creates a new `Timer` document if none exists yet. Closes the modal and pushes to the timer screen once done.

### `toggleBell(): Promise<void>`

If a bell is currently ringing for this table, calls `bellActions.dismiss(bell, ...)` with a translated destructive confirm dialog; otherwise, if `tableNumber` is known, calls `bellActions.ring(tableNumber, undefined, ...)` with its own confirm dialog.

### `makeStyles(colors: ReturnType<typeof useTheme>["colors"]): StyleSheet`

Builds the action-grid, bell-button, and badge styles from theme colors; memoized via `useMemo` on `colors`.

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

### Bell elapsed-time ticker

A `useEffect` keyed on `[bell]` resets `elapsedSeconds` to `0` and clears any running interval when there's no active bell for this table; otherwise it computes elapsed seconds from `bell.startTime` immediately and refreshes every second via `setInterval`, cleaned up on unmount or when `bell` changes.

### Memoized derivations

`currentTable` (`useMemo`, deps `[tableStore.collection, tableNumber, gameId]`) finds this player's `Table` document for the current game, used both for `PlayerColorSetupModal`'s `players`/`customColors` props and to gate `handleTimerPress`.

`isActiveGame` (`useMemo`, deps `[scheduleStore.collection, gameId]`) checks whether the schedule's currently-active item's `gameId` matches this screen's `gameId` — drives both the `requiresActiveGame` button gating and the bell's disabled/color state.

`bell` (`useMemo`, deps `[tableBellStore.collection, tableNumber]`) finds the active `TableBell` for this player's table, if any.

## Related

- [`lib/hooks/usePlayerTable.ts`](../../../lib/hooks/usePlayerTable.md), [`useTableBellActions.ts`](../../../lib/hooks/useTableBellActions.md)
- [`lib/components/game/Table.tsx`](../../../lib/components/game/Table.md)
- [`lib/stores/appwrite/timer-store.ts`](../../../lib/stores/appwrite/timer-store.md), [`options-lottery-store.ts`](../../../lib/stores/appwrite/options-lottery-store.md)
