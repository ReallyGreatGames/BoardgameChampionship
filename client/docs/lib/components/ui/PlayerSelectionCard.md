# `lib/components/ui/PlayerSelectionCard.tsx`

[← lib/components/ui](README.md)

## Purpose

Card showing the current player's team/name (via
[`usePlayer`](../../bootstrap/PlayerProvider.md)), with a row to navigate
to [`choose-your-character`](../../../app/(pages)/(team-player)/choose-your-character.md)
to change or (if none set) pick a player.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `PlayerSelectionCard` | `(props: Props): JSX` | Renders the current team/player (or a "select player" prompt if none set) and, when allowed, a row that navigates to `choose-your-character`. |

### Props

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

`activeItem` is memoized on `[scheduleCollection]`, scanning the collection
for the item with `isActive === true` (there should be at most one).

### `handlePress(): void`

If `onPress` was passed, calls it and returns — the caller has opted out of
navigation entirely. Otherwise builds a `URLSearchParams` with `from`
(defaulting to `"settings"`) and, when `gameId` is set, a `gameId` param,
then pushes to `choose-your-character` with that query string. Both the
"change team" row and the "select player" prompt call this same handler.

## Used by

- [`app/(pages)/(team-player)/choose-your-character.tsx`](../../../app/(pages)/(team-player)/choose-your-character.md)
- [`app/(pages)/(user)/game.tsx`](../../../app/(pages)/(user)/game.md)
- [`app/(pages)/settings.tsx`](../../../app/(pages)/settings.md)
