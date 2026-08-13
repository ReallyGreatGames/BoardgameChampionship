# `lib/bootstrap/PlayerProvider.tsx`

[← lib/bootstrap](README.md)

## Purpose

Tracks which [`Player`](../models/player.md) this device is currently
"acting as" — set once during onboarding
([`choose-your-character.tsx`](../../app/(pages)/(team-player)/choose-your-character.md))
and persisted locally so it survives app restarts.

## Exports

| Export | Purpose |
|---|---|
| `PLAYER_INFO_KEY` | `"player_info"` — the [`secureStorage`](../secureStorage.md) key the player is persisted under |
| `PlayerProvider` | Context provider |
| `usePlayer()` | Hook returning `{ player, playerLoading, assignPlayer, clearPlayer }` |
| `Team` | A locally-declared `{ name, code, country }` type (superseded by [`lib/models/team.ts`](../models/team.md) — not used elsewhere in this file) |
| `PlayerContext` | The context value type |

## How it works

On mount, reads the persisted player from secure storage. If the stored
JSON doesn't even have a string `$id`, it's discarded as corrupt.

A second effect re-validates the stored player once
[`usePlayerStore`](../stores/appwrite/player-store.md)'s collection first
goes from empty to populated (`storeWasEmpty` ref) — if the stored
player's `$id` no longer exists in the live collection (e.g. removed by an
admin), it's cleared both from state and storage. This check deliberately
only fires on that one empty→populated transition, not on every
subsequent store update, so it doesn't repeatedly re-validate during normal use.

`assignPlayer`/`clearPlayer` update both React state and secure storage
together, so the two never go out of sync.

## Used by

- [`app/(pages)/(team-player)/choose-your-character.tsx`](../../app/(pages)/(team-player)/choose-your-character.md)
- [`app/(pages)/settings.tsx`](../../app/(pages)/settings.md)
- [`lib/bootstrap/BootstrapProvider.tsx`](BootstrapProvider.md)
- [`lib/components/game/Table.tsx`](../components/game/Table.md), [`ActiveScheduleCard.tsx`](../components/schedule/ActiveScheduleCard.md), [`Schedule.tsx`](../components/schedule/Schedule.md), [`PlayerSelectionCard.tsx`](../components/ui/PlayerSelectionCard.md)
- [`lib/hooks/usePlayerTable.ts`](../hooks/usePlayerTable.md)
- [`lib/routing/useRouter.ts`](../routing/useRouter.md)
