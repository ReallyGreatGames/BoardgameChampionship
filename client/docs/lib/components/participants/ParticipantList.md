# `lib/components/participants/ParticipantList.tsx`

[← lib/components/participants](README.md)

## Purpose

The participant directory's body: a search box over a `SectionList` of teams
grouped by country, each row showing the team code as a badge next to the
team name, with sticky country headers and a two-line empty state.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `ParticipantList` (component) | `ParticipantList({ sections, search, onSearchChange, isLoading }: Props): JSX.Element` | Renders the search box and the grouped team list. Purely presentational — all state comes from props. |

### Props

| Prop | Type | Meaning |
|---|---|---|
| `sections` | `CountrySection[]` | Grouped teams from [`useTeamDirectory`](../../hooks/useTeamDirectory.md); each section renders a sticky header (country code + "N teams") followed by its rows |
| `search` | `string` | Current search text for the [`SearchInput`](../ui/SearchInput.md) |
| `onSearchChange` | `(value: string) => void` | Called on every keystroke and when the clear button resets the box |
| `isLoading` | `boolean` | While `true`, the empty state is suppressed — the list is blank rather than claiming there are no teams |

## How it works

### Empty state wording

The empty state renders one of two hints depending on whether `search` is
non-empty: with a query it suggests searching differently ("try a country
shorthand like AT"), without one it explains that teams appear after import.
Showing the search hint when nothing has been typed would be misleading —
that case means the tournament has no teams yet, not that the search failed.

### Sticky headers

`stickySectionHeadersEnabled` keeps the current country pinned while
scrolling — the point of grouping is knowing which country you're looking at
in a list long enough to scroll. `keyboardShouldPersistTaps="handled"` lets a
scroll or tap land while the search keyboard is up instead of only dismissing
it.

## Used by

- [`app/(pages)/(user)/participants.tsx`](../../../app/(pages)/(user)/participants.md)

## Related

- [`lib/hooks/useTeamDirectory.ts`](../../hooks/useTeamDirectory.md) — produces `sections` and owns the search state
- [`lib/components/ui/SearchInput.tsx`](../ui/SearchInput.md)
