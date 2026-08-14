# `lib/models/team.ts`

[← lib/models](README.md)

## Purpose

Appwrite document type `Team` — a team/nation in the tournament.

## Exports

### `type Team`

| Field | Type | Meaning |
|---|---|---|
| `name` | `string` | Display name |
| `code` | `string` | Short code |
| `country` | `string` | Country |

## Used by

- [`lib/components/onboarding/PlayerPickerForm.tsx`](../components/onboarding/PlayerPickerForm.md)
- [`lib/models/player.ts`](player.md) (as a field type)
- [`lib/stores/appwrite/team-store.ts`](../stores/appwrite/team-store.md)
