# `lib/bootstrap/ScreenOrientationProvider.tsx`

[← lib/bootstrap](README.md)

## Purpose

App-wide screen-orientation lock, overridable by individual screens (e.g.
the timer screen wants landscape/rotatable while the rest of the app stays
portrait-locked).

## Exports

### `ScreenOrientationContext`

| Property | Type | Meaning |
|---|---|---|
| `orientation` | `OrientationLock` | The lock mode currently requested (from `expo-screen-orientation`'s enum, e.g. `PORTRAIT_UP`, `LANDSCAPE`, `ALL`). Defaults to `PORTRAIT_UP`. |
| `forceOrientation` | `(o: OrientationLock) => Promise<void>` | Overrides the current lock with `o`. |
| `unlockOrientation` | `() => Promise<void>` | Reverts the lock to the app default (`PORTRAIT_UP`). |

### `ScreenOrientationProvider(props: PropsWithChildren): JSX.Element`

`props.children: ReactNode` — the subtree given access to
`orientationContext`. Owns the `orientation` state and locks the OS to
`PORTRAIT_UP` once on mount.

### `useScreenOrientation(): ScreenOrientationContext`

No parameters. Thin `useContext(orientationContext)` wrapper.

### `forceOrientation(o: OrientationLock): Promise<void>` — `useCallback`, deps `[]`

`o` — the orientation lock mode to switch to (e.g. `LANDSCAPE` for the
timer screen). Updates `orientation` state immediately, then awaits
`lockAsync(o)` to actually apply the OS-level lock.

### `unlockOrientation(): Promise<void>` — `useCallback`, deps `[]`

No parameters. Resets `orientation` state back to `PORTRAIT_UP` and
re-applies that lock via `lockAsync`, undoing whatever `forceOrientation`
set.

## How it works

Locks to `OrientationLock.PORTRAIT_UP` on mount. `forceOrientation`
overrides the lock (e.g. to allow landscape) and `unlockOrientation`
reverts to the portrait default. Both swallow lock errors (`.catch(() =>
{})`) — orientation locking can fail on some platforms/configurations, and
that failure isn't worth surfacing to the user. Note the state update
happens before the (possibly-failing) `lockAsync` call in both functions,
so `orientation` in context always reflects the last *requested* mode,
not necessarily the mode the OS actually applied.

## Used by

- [`app/(pages)/(user)/timer.tsx`](../../app/(pages)/(user)/timer.md)
- [`lib/bootstrap/BootstrapProvider.tsx`](BootstrapProvider.md)
