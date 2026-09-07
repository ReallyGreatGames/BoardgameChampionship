# `lib/hooks/useTeamDirectory.ts`

[← lib/hooks](README.md)

## Purpose

Backs the participant directory screen: holds the search text and turns the
flat [`Team`](../models/team.md) collection into search-filtered,
country-grouped `SectionList` sections plus a total result count.

## Exports

### `type CountrySection`

| Property | Type | Meaning |
|---|---|---|
| `country` | `string` | The group's ISO-3166 alpha-2 country code (`"DE"`), or `"?"` for teams whose `country` is empty — rendered as the sticky section header |
| `label` | `string` | Translated count for that country ("3 teams" / "1 team"), from the `participants.teamCount` plural key |
| `data` | `Team[]` | The country's matching teams, sorted by `code` then `name`. Named `data` because `SectionList` requires that key |

### `type TeamDirectory`

| Property | Type | Meaning |
|---|---|---|
| `sections` | `CountrySection[]` | The grouped, filtered teams, countries sorted alphabetically by code |
| `count` | `number` | Total number of teams across all sections — i.e. how many teams currently match the search (all of them when the box is empty) |
| `search` | `string` | Current search text |
| `setSearch` | `(value: string) => void` | Replaces the search text |
| `isLoading` | `boolean` | `true` until the team store's initial fetch has resolved — lets consumers hold back the "no teams" message while the collection is merely not loaded yet |

### `useTeamDirectory(): TeamDirectory`

Takes no arguments; reads the whole `teams` collection and its `initialized`
flag from [`useTeamStore`](../stores/appwrite/team-store.md). A team matches
the search when its `code`, `name`, or `country` contains the trimmed,
lower-cased query as a substring, so "at" finds both the Austrian teams and
any team whose name contains "at".

## How it works

The grouping runs inside a `useMemo` keyed on `[collection, search, t]` —
`t` is a dependency because each section's `label` is a translated plural
string, so the labels have to be rebuilt when the language changes, not just
when the data does.

Empty `country` values are bucketed under `"?"` rather than dropped, so a
team with a missing country still shows up in the directory instead of
silently disappearing.

## Used by

- [`app/(pages)/(user)/participants.tsx`](../../app/(pages)/(user)/participants.md)

## Related

- [`lib/components/participants/ParticipantList.tsx`](../components/participants/ParticipantList.md) — renders `sections`
