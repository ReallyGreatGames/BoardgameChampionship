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
| `playerCode` | `string` | Unique code of the form `{team.code}-{playerNumber}` (e.g. `"GER-2"`), assigned during TSV import (see [`lib/import/player-import-service.ts`](../../import/player-import-service.md)) and later used to match players into tables when importing table assignments by code (see [`lib/import/table-import-service.ts`](../../import/table-import-service.md)) |

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
