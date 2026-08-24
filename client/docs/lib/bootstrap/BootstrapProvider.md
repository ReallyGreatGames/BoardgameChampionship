# `lib/bootstrap/BootstrapProvider.tsx`

[← lib/bootstrap](README.md)

## Purpose

Composes every app-wide context provider into a single tree, in the
specific nesting order later providers depend on.

## Exports

### `BootstrapProvider(props: PropsWithChildren): JSX.Element`

| Prop | Type | Meaning |
|---|---|---|
| `children` | `ReactNode` | The app tree rendered once every context provider below is mounted. |

No return value beyond the composed JSX tree — the component itself holds
no state and performs no side effects; it is pure composition.

Wraps `children` in, from outermost to innermost:
[`ThemeProvider`](ThemeProvider.md) → `DialogProvider`
([`lib/components/ui/Dialog.tsx`](../components/ui/Dialog.md)) →
`QueryClientProvider` (`@tanstack/react-query`, client created once at
module scope) → [`TournamentProvider`](TournamentProvider.md) →
[`AuthProvider`](../auth.md) → [`ScreenOrientationProvider`](ScreenOrientationProvider.md) →
[`PlayerProvider`](PlayerProvider.md) → [`RealTimeStoreProvider`](RealTimeStoreProvider.md)
(rendered as a sibling of `children`, not a wrapper — it renders `null` and
exists purely for its side effects).

## How it works

The nesting order encodes real dependencies: `TournamentProvider` must be
above `AuthProvider` (auth's forced-logout effect reads tournament state),
and `PlayerProvider`/`RealTimeStoreProvider` must be below `AuthProvider`
(both need to know whether a user is authenticated).

## Used by

- [`app/_layout.tsx`](../../app/_layout.md) — the app's root layout
