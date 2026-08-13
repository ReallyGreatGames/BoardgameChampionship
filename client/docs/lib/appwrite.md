# `lib/appwrite.ts`

[← docs](../README.md)

## Purpose

Central Appwrite client configuration. Reads connection details from
environment variables and exports the ready-configured SDK services.

## Exports

| Export | Type | Meaning |
|---|---|---|
| `DATABASE_ID` | `string` | Appwrite database id (from `EXPO_PUBLIC_APPWRITE_DATABASE_ID`) |
| `SIGNATURES_BUCKET_ID` | `"signatures"` | Storage bucket for signatures |
| `LOTTERY_BUCKET_ID` | `"lottery"` | Storage bucket for lottery photos |
| `account` | `Account` | Appwrite Account service (sessions, users) |
| `client` | `Client` | Configured Appwrite client |
| `ID` | re-export of `react-native-appwrite` | ID generator (`ID.unique()`) |
| `storage` | `Storage` | Appwrite Storage service |
| `tablesDB` | `TablesDB` | Appwrite database service (CRUD on tables/rows) |

## How it works

`requireEnv` throws immediately at module load, with a hint pointing at
`.env.example`, if `EXPO_PUBLIC_APPWRITE_ENDPOINT`,
`EXPO_PUBLIC_APPWRITE_PROJECT_ID`, or `EXPO_PUBLIC_APPWRITE_DATABASE_ID` are
missing — this prevents a silent failure only surfacing on the first
Appwrite request.

## Used by

Widely used: [`lib/auth.tsx`](auth.md), every
[`lib/stores/appwrite/*`](stores/appwrite/README.md) store (indirectly via
[`real-time-store.ts`](stores/real-time-store.md)), [`lib/import/*`](import/README.md),
[`lib/hooks/useLotteryActions.ts`](hooks/useLotteryActions.md),
[`TournamentSettings.tsx`](components/admin/TournamentSettings.md),
[`ResultsAdminTab.tsx`](components/results/ResultsAdminTab.md),
[`SignatureSlot.tsx`](components/results/SignatureSlot.md),
and the screens [`lottery.tsx`](../app/(pages)/(user)/lottery.md) and
[`signature.tsx`](../app/(pages)/(user)/signature.md).
