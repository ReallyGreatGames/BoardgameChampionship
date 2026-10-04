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

### Heartbeat override (`client.realtime.createHeartbeat`)

`react-native-appwrite` (0.27.x) starts a 20 s `setInterval` that sends a
`ping` over the realtime socket once it opens, and never stops it when
the socket closes. After the phone is locked and unlocked, the socket is
`CLOSED` or still `CONNECTING` when the interval fires. React Native's
`WebSocket.send` then throws `INVALID_STATE_ERR`, uncaught inside a timer
callback, which crashes the app. The SDK's `createSocket` looks up
`this.realtime.createHeartbeat` on every `open`, so this module replaces
it on the (private, hence `as any`) `realtime` object with a version that
pings only when `readyState === WebSocket.OPEN`, wraps `send` in
`try/catch`, and clears the previous interval with `clearInterval`. If an SDK
upgrade renames or restructures `realtime`, the `if (realtime)` guard
skips the override; re-check this after upgrading.

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
