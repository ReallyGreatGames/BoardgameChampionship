# `lib/components/ui/PlayerSelectionCard.tsx`

[← lib/components/ui](README.md)

## Purpose

Card showing the current player's team/name (via
[`usePlayer`](../../bootstrap/PlayerProvider.md)), with a row to navigate
to [`choose-your-character`](../../../app/(pages)/(team-player)/choose-your-character.md)
to change or (if none set) pick a player.

## Props

`{ from?: "settings" | "game", onPress?: () => void, forceAllow?: boolean, gameId?: string }`

- `from` — where `choose-your-character` should return to after selection.
- `onPress` — if set, called instead of navigating (e.g. an inline step
  transition in a setup wizard).
- `forceAllow` — bypasses the schedule's `allowUserChange` flag, always
  showing the change option.
- `gameId` — passed through when `from === "game"`.

## How it works

The "change team" row is only shown if `canChange` is true:
`forceAllow || isAdmin || !player || activeItem?.allowUserChange !== false`
— i.e. admins and players with no team yet can always change, but a
regular player with a team already set can be locked out by the currently
active [`Schedule`](../../models/schedule.md) item's `allowUserChange: false`.

## Used by

- [`app/(pages)/(team-player)/choose-your-character.tsx`](../../../app/(pages)/(team-player)/choose-your-character.md)
- [`app/(pages)/(user)/game.tsx`](../../../app/(pages)/(user)/game.md)
- [`app/(pages)/settings.tsx`](../../../app/(pages)/settings.md)
