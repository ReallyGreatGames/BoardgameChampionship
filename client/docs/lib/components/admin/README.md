# `lib/components/admin`

[← lib/components](../README.md)

The tabs of the admin dashboard
([`app/(pages)/(admin)/admin/index.tsx`](../../../app/(pages)/(admin)/admin/index.md)):
results (delegated to [`lib/components/results`](../results/README.md)),
rankings, statistics, data import, feature flags, and tournament settings.

## Files

| File | Purpose |
|---|---|
| [RankingsTab.md](RankingsTab.md) | Team/player tournament-points ranking |
| [StatisticsTab.md](StatisticsTab.md) | Per-game seat statistics + team performance |
| [ImportTab.md](ImportTab.md) | Sub-tab switcher for the three import flows |
| [ImportPlayers.md](ImportPlayers.md) | Bulk teams/players import wizard |
| [ImportTables.md](ImportTables.md) | Bulk table-seating import wizard |
| [ImportRules.md](ImportRules.md) | Bulk rule-clarification import wizard |
| [ImportProgressBar.md](ImportProgressBar.md) | Shared success/fail progress bar for all three import wizards |
| [ImportActivityContext.md](ImportActivityContext.md) | Tracks whether an import/delete run is active, app-wide |
| [FeatureFlags.md](FeatureFlags.md) | Feature-flag toggle list with a batched save |
| [TournamentSettings.md](TournamentSettings.md) | Tournament row editor (active/PIN/type) |
