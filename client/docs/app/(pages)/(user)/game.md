# `app/(pages)/(user)/game.tsx`

[← app](../../README.md)

## Route

`/game?gameId=...&from=...`

Registered with `headerShown: false` in
[`app/_layout.tsx`](../../_layout.md) — the screen brings its own header
([`GameHeader`](../../../lib/components/game/GameHeader.md)) instead of the
drawer navigator's.

## Purpose

Per-game hub: a colored header with the game's name and round/table line,
the player's table seating, a row of action tiles (lottery, rules, timer,
results — each gated by table assignment, active-game status, and feature
flags), and a table-bell bar pinned to the bottom of the screen.

## Layout

| Region | Component | Notes |
|---|---|---|
| Header | [`GameHeader`](../../../lib/components/game/GameHeader.md) | Full-bleed, opens the drawer via its hamburger button |
| Fixed row below header | [`BackButton`](../../../lib/components/ui/BackButton.md) + [`Badge`](../../../lib/components/ui/Badge.md) | Stays in place while the body scrolls; the badge shows the game's state (running / scheduled / finished) |
| Scroll body | [`GameSeatingList`](../../../lib/components/game/GameSeatingList.md) or [`PlayerSelectionCard`](../../../lib/components/ui/PlayerSelectionCard.md) | The selection card replaces the seating list while the player has no table for this game |
| Scroll body | [`GameActionRow`](../../../lib/components/game/GameActionRow.md) | The four action tiles |
| Fixed footer | [`TableBellBar`](../../../lib/components/game/TableBellBar.md) | Outside the `ScrollView`, so the bell stays reachable |

## Exports

| Export | Signature | Purpose |
| --- | --- | --- |
| `GamePage` (default) | `(): JSX.Element` | Screen component for `/game?gameId=...&from=...`. Renders the header, the player's table (or a table-selection prompt), the action row, and the table-bell bar; also owns the first-time timer color setup flow. |

### Types

| Type | Fields | Meaning |
| --- | --- | --- |
| `ActionButton` | `key: string`, `icon: React.ComponentProps<typeof Ionicons>["name"]`, `labelKey: string`, `onPress: (gameId: string, origin: string) => void`, `requiresActiveGame?: boolean`, `featureFlag?: (typeof FeatureFlagSlugs)[keyof typeof FeatureFlagSlugs]` | The screen's static description of one action tile: its icon/label, navigation handler, and the two gating conditions (must be the active game / must have a feature flag enabled) evaluated against player and game state. Translated and resolved into a [`GameAction`](../../../lib/components/game/GameActionRow.md) at render time. |

### Module constants

| Constant | Type | Meaning |
| --- | --- | --- |
| `ACTION_BUTTONS` | `ActionButton[]` | The four fixed action buttons (lottery, rules, timer, results) with their icons, labels, gating flags, and navigation targets. Each `onPress` receives the screen's `selfHref` as `origin` and passes it to `goTo`, which records it so the sub-screen's back button returns here. |

### `formatElapsed(seconds: number): string`

Formats a duration in whole seconds as `MM:SS` (zero-padded). Interpolated into the table bell's hint line.

### `handleBack(): void`

Pops the recorded origin via [`goBackTo`](../../../lib/utils/navigation.md), falling back to the `from` query param and then to `/(pages)/(user)/schedule`. As the hub of most flows this screen also builds `selfHref` (`/(pages)/(user)/game?gameId=...`) and passes it as the `origin` argument of [`goTo`](../../../lib/utils/navigation.md) when opening rules, lottery, results or the timer, so each of them returns here.

### `openMenu(): void`

Dispatches `DrawerActions.openDrawer()`; bound to `GameHeader`'s hamburger button. Memoized with `useCallback` on `[navigation]` so the header doesn't get a new handler identity on every render.

### `handleTimerPress(): Promise<void>`

Checks `secureStorage` for previously-saved player colors keyed by `playerColors_{gameId}_{tableNumber}`; if none exist and a `currentTable` is resolved, opens `PlayerColorSetupModal` (`colorSetupVisible`) instead of navigating; otherwise goes straight to `/(pages)/(user)/timer?gameId=...` via `goTo`, recording `selfHref` as the origin. Bound as the "timer" action's press handler (overriding its plain `onPress` from `ACTION_BUTTONS`).

### `handleSaveSetup(playerIds: (string | null)[], hexColors: string[]): Promise<void>`

Called by `PlayerColorSetupModal.onSave`. Persists `hexColors` to `secureStorage` under the per-table key, filters `playerIds` down to non-null ids, and either updates the existing `Timer` document's `playerPositions` for this table/game or creates a new `Timer` document if none exists yet. Closes the modal and pushes to the timer screen once done.

### `toggleBell(): Promise<void>`

If a bell is currently ringing for this table, calls `bellActions.dismiss(bell, ...)` with a translated destructive confirm dialog; otherwise, if `tableNumber` is known, calls `bellActions.ring(tableNumber, undefined, ...)` with its own confirm dialog.

### `makeStyles(colors: ReturnType<typeof useTheme>["colors"]): StyleSheet`

Builds the screen's container/scroll-content/top-row styles from theme colors; memoized via `useMemo` on `colors`. All other styling lives in the four `lib/components/game/` components.

## How it works

### Game identity and state

[`useGameScheduleInfo`](../../../lib/hooks/useGameScheduleInfo.md) resolves
`gameId` to the schedule item that plays it, giving the header its title
and round number and the screen its `isActiveGame` / `isFinished` flags.
[`Game`](../../../lib/models/game.md) carries no name of its own, so the
schedule item's `title` *is* the game's display name.

`badge` maps that state onto [`Badge`](../../../lib/components/ui/Badge.md):
finished → `success`, active → `info`, otherwise → `neutral`.

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

`bellState` is derived for presentation only — `unavailable` (no table or
game not running), `acknowledged` (a judge is on the way), `ringing`, or
`idle` — and `bellHint` picks the matching translated line, interpolating
`formatElapsed(elapsedSeconds)` for the two active states. Whether the
pill can actually be pressed is a separate `disabled` expression, since
the `TABLE_BELL` feature flag deliberately unlocks the bell outside a
running game even though it still *looks* unavailable.

### Bell elapsed-time ticker

A `useEffect` keyed on `[bell]` resets `elapsedSeconds` to `0` and clears any running interval when there's no active bell for this table; otherwise it computes elapsed seconds from `bell.startTime` immediately and refreshes every second via `setInterval`, cleaned up on unmount or when `bell` changes.

### Lottery badge

The lottery tile's numeric badge is `getLotteryPhotosForGame(...).length`
plus the count of options-lottery instances (from
[`getOptionsLotteriesForGame`](../../../lib/utils/options-lottery.md)) that
have a pulled result for the player's own table
(`getResultForTable(instance, tableNumber) !== null`) — a player with no
table yet contributes `0` from that half.

### Memoized derivations

`currentTable` (`useMemo`, deps `[tableStore.collection, tableNumber, gameId]`) finds this player's `Table` document for the current game, used for `GameSeatingList`, for `PlayerColorSetupModal`'s `players`/`customColors` props, and to gate `handleTimerPress`.

`bell` (`useMemo`, deps `[tableBellStore.collection, tableNumber]`) finds the active `TableBell` for this player's table, if any.

## Related

- [`lib/components/game/`](../../../lib/components/game/README.md) — the four components this screen is assembled from
- [`lib/hooks/usePlayerTable.ts`](../../../lib/hooks/usePlayerTable.md), [`useGameScheduleInfo.ts`](../../../lib/hooks/useGameScheduleInfo.md), [`useTableBellActions.ts`](../../../lib/hooks/useTableBellActions.md)
- [`lib/stores/appwrite/timer-store.ts`](../../../lib/stores/appwrite/timer-store.md), [`options-lottery-store.ts`](../../../lib/stores/appwrite/options-lottery-store.md)
