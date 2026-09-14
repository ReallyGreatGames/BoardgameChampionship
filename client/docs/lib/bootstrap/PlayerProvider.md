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

### `Team`

| Property | Type | Meaning |
|---|---|---|
| `name` | `string` | Team's display name. |
| `code` | `string` | Short team code/abbreviation. |
| `country` | `string` | Country the team represents. |

Unused within this file — declared but superseded by
[`lib/models/team.ts`](../models/team.md).

### `PlayerContext`

| Property | Type | Meaning |
|---|---|---|
| `player` | `Player \| null` | The [`Player`](../models/player.md) this device currently acts as, or `null` before onboarding / after `clearPlayer`. |
| `playerLoading` | `boolean` | `true` until the initial read from secure storage finishes; lets callers distinguish "no player yet" from "still loading". |
| `assignPlayer` | `(player: Player) => Promise<void>` | Adopts `player` as this device's active player. |
| `clearPlayer` | `() => Promise<void>` | Drops the active player. |

### `PlayerProvider(props: PropsWithChildren): JSX.Element`

`props.children: ReactNode` — the subtree given access to `playerContext`.
Owns the `player`/`playerLoading` state, runs the two effects described
below, and supplies `assignPlayer`/`clearPlayer` as context value.

### `usePlayer(): PlayerContext`

No parameters. Thin `useContext(playerContext)` wrapper; returns whatever
value the nearest `PlayerProvider` currently provides (or the context's
default stub if none is mounted).

### `assignPlayer(player: Player): Promise<void>`

`player` — the [`Player`](../models/player.md) document to make active.
Sets it into React state synchronously, then awaits writing the
JSON-serialized player to secure storage under `PLAYER_INFO_KEY`; callers
that `await` the call know the value has actually been persisted, not just
queued into state.

### `clearPlayer(): Promise<void>`

No parameters. Resets `player` state to `null` and deletes
`PLAYER_INFO_KEY` from secure storage, undoing whatever `assignPlayer`
wrote.

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
- [`lib/components/game/Table.tsx`](../components/game/Table.md), [`ActiveScheduleCard.tsx`](../components/schedule/ActiveScheduleCard.md), [`useOpenGame.ts`](../components/schedule/useOpenGame.md), [`PlayerSelectionCard.tsx`](../components/ui/PlayerSelectionCard.md)
- [`lib/hooks/usePlayerTable.ts`](../hooks/usePlayerTable.md), [`useParticipantOverview.ts`](../hooks/useParticipantOverview.md)
- [`lib/components/home/ParticipantHero.tsx`](../components/home/ParticipantHero.md), [`NowPlayingCard.tsx`](../components/home/NowPlayingCard.md)
- [`lib/routing/useRouter.ts`](../routing/useRouter.md)
