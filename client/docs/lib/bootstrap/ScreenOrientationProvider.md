# `lib/bootstrap/ScreenOrientationProvider.tsx`

[← lib/bootstrap](README.md)

## Purpose

App-wide screen-orientation lock, overridable by individual screens (e.g.
the timer screen wants landscape-right while the rest of the app stays
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
`orientationContext`. Owns the requested `orientation` state and applies
the current lock on mount and whenever the app returns to the foreground.

### `useScreenOrientation(): ScreenOrientationContext`

No parameters. Thin `useContext(orientationContext)` wrapper.

### `forceOrientation(o: OrientationLock): Promise<void>`

`o` — the orientation lock mode to switch to (e.g. `LANDSCAPE` for the
timer screen). Updates the requested orientation immediately and queues
the native lock request. Its callback remains stable across state updates.

### `unlockOrientation(): Promise<void>`

No parameters. Resets `orientation` state back to `PORTRAIT_UP` and
re-applies that lock via `lockAsync`, undoing whatever `forceOrientation`
set.

## How it works

Defaults to `OrientationLock.PORTRAIT_UP`. `forceOrientation` overrides
the lock and `unlockOrientation` reverts to portrait. Native requests run
through one promise chain, reading the latest requested orientation when
each operation starts. This prevents delayed startup or blur requests from
overwriting the timer's landscape lock during navigation.

An `AppState` listener reapplies the current request on `active`, since the
timer can remain focused while the app is backgrounded. The listener is
removed on unmount. Lock errors are logged and handled so a failed request
does not stop subsequent requests. The context reflects the last requested
mode, not necessarily the mode the OS actually applied.

Shared bottom sheets inherit this lock instead of unlocking and restoring
an asynchronously captured mode that may belong to a previous screen.

Run `npm run test:timer-orientation` from `client` to exercise the actual
provider, timer focus lifecycle and bottom sheet with controlled native
orientation responses.

## Used by

- [`app/(pages)/(user)/timer.tsx`](../../app/(pages)/(user)/timer.md)
- [`lib/bootstrap/BootstrapProvider.tsx`](BootstrapProvider.md)
