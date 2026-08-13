# `lib/hooks/useSecureStoragePerGame.ts`

[← lib/hooks](README.md)

## Purpose

Generic read/write hook for a per-game, per-device preference stored under
`${keyPrefix}_${gameId}` in [`secureStorage`](../secureStorage.md).

## Exports

### `useSecureStoragePerGame<T>(keyPrefix, gameId, defaultValue, parse): [T, (next: T) => void]`

- `keyPrefix` — the storage key prefix (e.g. `"timerOrientation"`, `"playerColors"`)
- `gameId` — current game id; when `undefined`, the value resets to `defaultValue` and nothing is read/written
- `defaultValue` — fallback if nothing is stored yet, or the stored value fails to parse
- `parse` — turns the raw stored string into `T`, or `null` on failure

Returns `[value, setValue]`, mirroring `useState`'s tuple shape.

## How it works

On mount and whenever `gameId` changes, reads `${keyPrefix}_${gameId}` and
applies `parse`; if the key doesn't exist or parsing fails, falls back to
`defaultValue`. `setValue` updates local state immediately and writes
through to storage (serializing non-string values via `JSON.stringify`).

**`parse` must be a stable (module-level) function reference** — it's a
dependency of the load effect, so an inline lambda passed at the call site
would re-run the load on every render.

This is the shared plumbing behind every per-game device preference in the
app — player colors and timer orientation/pause-mode all follow this exact
shape instead of re-implementing the read/write/key pattern individually.

## Used by

- [`lib/hooks/useTimerLocalSettings.ts`](useTimerLocalSettings.md)
- [`lib/hooks/useTimerState.ts`](useTimerState.md) — player-color storage
