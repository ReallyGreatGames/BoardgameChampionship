# `lib/components/participants`

[← lib/components](../README.md)

The participant directory screen
([`app/(pages)/(user)/participants.tsx`](../../../app/(pages)/(user)/participants.md)):
a branded header carrying the team count, and the searchable, country-grouped
team list underneath it. Both are presentational — the data and the search
state come from [`useTeamDirectory`](../../hooks/useTeamDirectory.md).

## Files

| File | Purpose |
|---|---|
| [ParticipantList.md](ParticipantList.md) | Search box + `SectionList` of teams grouped by country, with sticky country headers |
| [ParticipantListHeader.md](ParticipantListHeader.md) | Branded header band: menu button, tournament name, "Participants" title, team count |
