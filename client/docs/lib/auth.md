# `lib/auth.tsx`

[← docs](../README.md)

## Purpose

The app's authentication context. Covers two separate login paths: classic
email/password login (admins) and a PIN-based login for participants, plus
an automatic anonymous session so that even logged-out screens (e.g. the
login screen itself) can read from Appwrite.

## Exports

| Export | Purpose |
|---|---|
| `PIN_STORE_KEY` | Key under which the verified PIN + timestamp is persisted in [`secureStorage`](secureStorage.md) |
| `AuthProvider` | React context provider that supplies the entire auth state |
| `useAuth()` | Hook for reading `{ user, loading, login, loginWithPin, logout, isAdmin, isPinVerified }` |

## How it works

### Two login paths

- **`login(email, password)`** — classic Appwrite session login for admins.
- **`loginWithPin(pin)`** — verifies the PIN against the `tournament`
  collection (`verifyPinInDb`, checks `pin` AND `active === true`), creates
  an anonymous session on success, and persists `{ pin, lastVerified }` locally.

### PIN re-verification

Once verified, a PIN stays valid for up to 24h (`ONE_DAY_MS`) without a
fresh server check — on app start (the `init` effect), the locally-stored
PIN is only re-checked against the DB once `lastVerified` is older than
24h. If it has since become invalid (tournament now inactive, or PIN
changed), the local session is discarded.

### Automatic anonymous session

`getOrCreateAnonymousSession` first tries `account.get()`; if that fails
(no session), an anonymous session is created. Called both at app start
without a stored PIN (so e.g. the login screen can check whether the
tournament is active) and on every PIN login.

### Forced logout when the tournament is inactive

A `useEffect` watches `tournamentActive` (from
[`useTournament`](bootstrap/TournamentProvider.md)) and
`tournamentInitialized` (from
[`useTournamentStore`](stores/appwrite/tournament-store.md)): once it's
confirmed that the tournament is inactive, non-admin sessions
(`isPinVerified`) are automatically logged out and redirected to the home
screen. Waiting for `tournamentInitialized` prevents the still-empty store
on a cold start (before its first realtime fetch resolves) from being
mistaken for "no active tournament".

### Roles

- `isAdmin` — derived from `user.labels.includes("admin")` (Appwrite label)
- `isPinVerified` — the `pinVerified` state, but **never** `true` for admins (`!isAdmin && pinVerified`)

## Used by

Very widely used — among others [`lib/bootstrap/BootstrapProvider.tsx`](bootstrap/BootstrapProvider.md),
[`lib/bootstrap/RealTimeStoreProvider.tsx`](bootstrap/RealTimeStoreProvider.md),
[`lib/routing/useRouter.ts`](routing/useRouter.md),
[`lib/hooks/useRequireAuth.ts`](hooks/useRequireAuth.md),
[`lib/hooks/useLotteryActions.ts`](hooks/useLotteryActions.md),
[`lib/hooks/useTableBellActions.ts`](hooks/useTableBellActions.md),
[`AppDrawer.tsx`](components/shell/AppDrawer.md),
[`Schedule.tsx`](components/schedule/Schedule.md),
[`PlayerSelectionCard.tsx`](components/ui/PlayerSelectionCard.md),
and the screens [`active-bells.tsx`](../app/(pages)/(admin)/active-bells.md),
[`admin/_layout.tsx`](../app/(pages)/(admin)/admin/_layout.md),
[`lottery.tsx`](../app/(pages)/(user)/lottery.md),
[`login.tsx`](../app/(pages)/login.md),
[`settings.tsx`](../app/(pages)/settings.md),
[`app/index.tsx`](../app/index.md).

## Related

- [`lib/appwrite.ts`](appwrite.md) — `account`, `tablesDB`
- [`lib/secureStorage.ts`](secureStorage.md)
