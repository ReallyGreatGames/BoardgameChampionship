# `lib/models/team.ts`

[← lib/models](README.md)

## Purpose

Appwrite document type `Team` — a team/nation in the tournament.

## Exports

### `type Team`

| Field | Type | Meaning |
|---|---|---|
| `name` | `string` | Display name |
| `code` | `string` | Short team code from the import sheet (distinct from `country`) — shown as a badge in team pickers |
| `country` | `string` | ISO-3166 alpha-2 country code (e.g. `"DE"`), used for display; defaults to `"DE"` during TSV import when the column is blank (see `DEFAULT_COUNTRY` in [`lib/import/tsv-parser.ts`](../../import/tsv-parser.md)) |

## Used by

- [`lib/components/onboarding/PlayerPickerForm.tsx`](../components/onboarding/PlayerPickerForm.md)
- [`lib/models/player.ts`](player.md) (as a field type)
- [`lib/stores/appwrite/team-store.ts`](../stores/appwrite/team-store.md)
