# `lib/bootstrap/ScreenOrientationProvider.tsx`

[← lib/bootstrap](README.md)

## Purpose

App-wide screen-orientation lock, overridable by individual screens (e.g.
the timer screen wants landscape/rotatable while the rest of the app stays
portrait-locked).

## Exports

### `ScreenOrientationProvider` (component) / `useScreenOrientation()`

Returns `{ orientation, forceOrientation(o), unlockOrientation() }`.

## How it works

Locks to `OrientationLock.PORTRAIT_UP` on mount. `forceOrientation`
overrides the lock (e.g. to allow landscape) and `unlockOrientation`
reverts to the portrait default. Both swallow lock errors (`.catch(() =>
{})`) — orientation locking can fail on some platforms/configurations, and
that failure isn't worth surfacing to the user.

## Used by

- [`app/(pages)/(user)/timer.tsx`](../../app/(pages)/(user)/timer.md)
- [`lib/bootstrap/BootstrapProvider.tsx`](BootstrapProvider.md)
