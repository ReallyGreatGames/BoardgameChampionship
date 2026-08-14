# `lib/models/player.ts`

[← lib/models](README.md)

## Purpose

Appwrite document type `Player` — a tournament player.

## Exports

### `type Player`

| Field | Type | Meaning |
|---|---|---|
| `name` | `string` | Display name |
| `team` | [`Team`](team.md) | Associated team (Appwrite relation) |
| `playerNumber` | `number` | Start number |
| `playerCode` | `string` | Unique code (e.g. for import/matching) |

## Used by

- [`app/(pages)/(team-player)/choose-your-character.tsx`](../../app/(pages)/(team-player)/choose-your-character.md)
- [`lib/bootstrap/PlayerProvider.tsx`](../bootstrap/PlayerProvider.md)
- [`lib/components/onboarding/PlayerColorSetupModal.tsx`](../components/onboarding/PlayerColorSetupModal.md)
- [`lib/components/onboarding/PlayerPickerForm.tsx`](../components/onboarding/PlayerPickerForm.md)
- [`lib/components/results/types.ts`](../components/results/types.md)
- [`lib/models/table.ts`](table.md), [`lib/models/timer.ts`](timer.md) (as a field type)
- [`lib/stores/appwrite/player-store.ts`](../stores/appwrite/player-store.md)
- [`lib/utils.ts`](../utils.md)

## Related

- [`lib/models/team.ts`](team.md)
