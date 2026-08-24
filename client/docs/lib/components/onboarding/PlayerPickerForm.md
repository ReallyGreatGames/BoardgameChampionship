# `lib/components/onboarding/PlayerPickerForm.tsx`

[← lib/components/onboarding](README.md)

## Purpose

Two-step "who are you" picker: search/select a team, then tap your player
number. The core of first-run and team-switching onboarding.

## Exports

### `PlayerPickerForm({ onConfirm, onBack }: Props): JSX.Element`

| Prop | Type | Meaning |
|---|---|---|
| `onConfirm` | `(player: Player) => void` | Called with the selected player (its `team` set to the resolved `Team` object) once the user confirms a player card. |
| `onBack` | `() => void` (optional) | If provided, renders a back button on the team-search step; omitted means this is the entry step of its flow with nowhere to go back to. |

### Internal helper components (not exported)

| Component | Signature | Behavior |
|---|---|---|
| `AnimatedTeamCard` | `({ team: Team, onPress: () => void }): JSX.Element` | Renders one team row with a press-in/press-out spring scale; calls `onPress` on tap. |
| `AnimatedPlayerCard` | `({ player: Player, onConfirm: () => void }): JSX.Element` | Renders one player row with the same spring-scale interaction; calls `onConfirm` only after the press-out animation finishes (see below). |

### Internal functions

| Function | Signature | Behavior |
|---|---|---|
| `handleTeamSelect` | `(team: Team): void` | Sets `selectedTeam`, resets `fadeAnim` to `0`, and switches `step` to `"player"`, kicking off the crossfade handled by the effect below. |

## How it works

`step: "team" | "player"` drives which list shows; selecting a team
crossfades into the player list (`fadeAnim`). `useFocusEffect` resets both
`step` and `selectedTeam` back to the start whenever this screen loses
focus (e.g. navigating away and back) — so returning to it never leaves it
stuck mid-flow on a stale team selection.

`AnimatedTeamCard`/`AnimatedPlayerCard` (local, unexported) share a
press-in/press-out spring-scale interaction. The player card in particular
tracks `confirmed` in a ref set on `onPress` and only actually calls
`onConfirm` from the `onPressOut` animation's completion callback — this
lets the "shrink then grow back" animation visibly finish before
navigating away, rather than firing `onConfirm` immediately on press and
potentially cutting the animation short.

Player matching against a team handles `player.team` being either a
hydrated object or a bare relation id string (`typeof p.team === "string"
? p.team : (p.team as Team).$id`).

`filteredTeams` (`useMemo` on `[teamStore.collection, teamSearch]`)
lowercase-trims the search query and filters the code-sorted team list by
name-or-code substring match — recomputed only when the underlying
collection or the search text changes, not on every render. `players`
(`useMemo` on `[allPlayers, selectedTeam]`) filters and player-number-sorts
`allPlayers` down to the selected team's roster; it returns `[]` with no
`selectedTeam`, which is what lets the `step === "player"` render branch
short-circuit into its own loading/empty states independently of whether
teams have finished loading.

The `useEffect` keyed on `[step, fadeAnim]` fires the fade-in timing
animation only when `step` becomes `"player"` — `fadeAnim` is set to `0`
synchronously inside `handleTeamSelect` (before the state update that
triggers the step change), so the effect's `Animated.timing` always starts
from a fully transparent view and fades it in, rather than animating from
whatever value was left over from a previous transition.

## Used by

- [`app/(pages)/(team-player)/choose-your-character.tsx`](../../../app/(pages)/(team-player)/choose-your-character.md)
