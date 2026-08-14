# `lib/components/onboarding/PlayerPickerForm.tsx`

[← lib/components/onboarding](README.md)

## Purpose

Two-step "who are you" picker: search/select a team, then tap your player
number. The core of first-run and team-switching onboarding.

## Props

`{ onConfirm: (player: Player) => void, onBack?: () => void }`

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

## Used by

- [`app/(pages)/(team-player)/choose-your-character.tsx`](../../../app/(pages)/(team-player)/choose-your-character.md)
