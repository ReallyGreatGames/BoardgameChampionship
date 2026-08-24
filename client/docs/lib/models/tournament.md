# `lib/models/tournament.ts`

[← lib/models](README.md)

## Purpose

Appwrite document type `Tournament` — the global tournament configuration
(exactly one document in the collection).

## Exports

### `type Tournament`

| Field | Type | Meaning |
|---|---|---|
| `locale` | `"de" \| "en"` | Language of the app instance |
| `active` | `boolean` | Whether the tournament is active |
| `pin` | `string` | Admin PIN for gated actions; verified by querying the `tournament` collection for a row matching both `pin` and `active: true` (see `verifyPinInDb` in [`lib/auth.tsx`](../../auth.md)), then cached locally for 24h so re-verification isn't required on every app open |
| `type` | `"dmmib" \| "europemasters"` | Tournament variant (controls e.g. rule set/branding) |

## Used by

- [`lib/components/admin/TournamentSettings.tsx`](../components/admin/TournamentSettings.md)
- [`lib/stores/appwrite/tournament-store.ts`](../stores/appwrite/tournament-store.md)
