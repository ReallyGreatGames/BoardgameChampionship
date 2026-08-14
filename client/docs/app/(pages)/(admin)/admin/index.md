# `app/(pages)/(admin)/admin/index.tsx`

[← app](../../../README.md)

## Route

`/admin` — the admin dashboard.

## Purpose

Tab switcher hosting the six admin surfaces: results, rankings,
statistics, schedule, tournament settings (+ feature flags), and data import.

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
