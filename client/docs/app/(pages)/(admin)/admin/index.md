# `app/(pages)/(admin)/admin/index.tsx`

[← app](../../../README.md)

## Route

`/admin` — the admin dashboard.

## Purpose

Tab switcher hosting the six admin surfaces: results, rankings,
statistics, schedule, tournament settings (+ feature flags), and data import.

## Exports

| Export | Signature | Purpose |
| --- | --- | --- |
| `AdminDashboard` (default) | `(): JSX.Element` | Screen component for `/admin`. Wraps `AdminDashboardContent` in `ImportActivityProvider` so import/delete activity state is available to both the tab bar and the import tab. |

### Internal: `AdminDashboardContent(): JSX.Element`

Renders the horizontal tab bar and the active tab's content. Holds `activeTab: Tab` (`useState`, default `"results"`) and reads `busy` from `useImportActivity()` to disable switching to any tab other than the currently-active one while an import/delete run is in progress.

### Types

| Type | Definition | Meaning |
| --- | --- | --- |
| `Tab` | `"results" \| "rankings" \| "statistics" \| "schedule" \| "tournamentSettings" \| "import"` | The six admin dashboard sections; also the key type for `TABS` and `activeTab`. |

### `makeStyles(colors: ReturnType<typeof useTheme>["colors"]): StyleSheet`

Builds all dashboard styles (tab bar, tab states, content area, settings scroll section) from theme colors; memoized via `useMemo` on `colors`.

## How it works

Wraps its content in
[`ImportActivityProvider`](../../../../lib/components/admin/ImportActivityContext.md)
so the tab bar itself can disable switching *away* from the import tab
while an import/delete run is active (`busy && activeTab !== tab.key`) —
the same guard the import tab's own internal sub-tab switcher uses.

Each tab is a plain conditional render (`{activeTab === "..." && <Tab
/>}`) — inactive tabs unmount entirely rather than staying mounted-but-hidden.

## Renders

- [`ResultsAdminTab`](../../../../lib/components/results/ResultsAdminTab.md)
- [`RankingsTab`](../../../../lib/components/admin/RankingsTab.md)
- [`StatisticsTab`](../../../../lib/components/admin/StatisticsTab.md)
- [`ScheduleList`](../../../../lib/components/schedule/Schedule.md)
- [`TournamentSettings`](../../../../lib/components/admin/TournamentSettings.md) + [`FeatureFlags`](../../../../lib/components/admin/FeatureFlags.md)
- [`ImportTab`](../../../../lib/components/admin/ImportTab.md)

## Related

- [`app/(pages)/(admin)/admin/_layout.tsx`](_layout.md) — the route guard above this screen
