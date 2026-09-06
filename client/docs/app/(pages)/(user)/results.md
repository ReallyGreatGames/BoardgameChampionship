# `app/(pages)/(user)/results.tsx`

[← app](../../README.md)

## Route

`/results?gameId=...&from=...`

## Purpose

Participant-facing self-service result entry for the player's own table:
placements, scores, a note, per-player signatures, save, and submit. The
non-admin counterpart to
[`ResultsAdminTab`](../../../lib/components/results/ResultsAdminTab.md)'s
input mode — built independently rather than sharing that component,
since the rules here (submission gates, editability once submitted,
signature-count requirements) are specific to self-service.

## Exports

| Export | Signature | Purpose |
| --- | --- | --- |
| `ResultsPage` (default) | `(): JSX.Element \| null` | Screen component for `/results?gameId=...`. Renders the four `PlayerResultRow`s (placement/score/signature per seat), a note field, and a save/submit button, all backed by local form state synced to the player's table `Result` document. Returns `null` while auth is loading or unauthenticated. |

### Module constants

| Constant | Type | Meaning |
| --- | --- | --- |
| `PLAYER_COUNT` | `number` (`4`) | Fixed number of seats per table; sizes every placements/scores/signatureIds array. |

### Internal: `padArray<T>(arr: T[], length: number, fill: T): T[]`

Returns a copy of `arr` padded with `fill` up to `length` (or truncated if longer) — used to normalize placements/scores/signatureIds arrays (which may be shorter, absent, or longer in the stored document) to always have exactly `PLAYER_COUNT` entries for indexed row rendering.

### `buildPayload(submittedFlag: boolean): { gameId: string; table: number; placements: string[]; scores: number[]; note: string; signatureIds: string[]; submitted: boolean }`

`useCallback` keyed on `[gameId, tableNumber, placements, scores, note, signatureIds]`. Assembles the object sent to `resultStore.add`/`update`: parses each score string to a number (defaulting invalid ones to `0`), trims the note, and stamps `submitted: submittedFlag`. Shared by both `handleSave` (always `false`) and `handleSubmit` (always `true`).

### `handleSave(): Promise<boolean>`

`useCallback` keyed on `[canSave, saving, existingResult, placements, scores, note, confirm, t, buildPayload, resultStore]`. No-ops (returns `false`) if `!canSave || saving`. If editing an existing result whose local edits both differ from the DB (`valuesDiffer`) and were made against a stale version (`timestampDrifted`), shows a confirm-overwrite dialog first; declining discards local edits in favor of the DB's current values and returns `true` without writing. Otherwise writes via `resultStore.update`/`add`, marks `ownSaveRef.current = true` so the resulting realtime update doesn't re-trigger the conflict check against its own write, and returns whether the save succeeded.

### `handleSubmit(): Promise<void>`

`useCallback` keyed on `[submitting, canSave, canSubmit, handleSave, confirm, t, buildPayload, existingResult, resultStore]`. No-ops while already `submitting`. Saves first if `canSave` (aborting if that save fails). If `canSubmit` is still false, shows a "need at least 3 signatures" dialog (`signatureCount < 3`) or a general "submission blocked" dialog otherwise, then returns. Otherwise shows a confirm-submit dialog; on confirmation, writes the payload with `submitted: true`.

### `handleSetPlacement(i: number, v: string): void`

`useCallback`, no deps. Sets `placements[i]` to `v` via an immutable array copy.

### `handleSetScore(i: number, v: string): void`

`useCallback`, no deps. Sets `scores[i]` to `v` via an immutable array copy.

### `handleOpenSignature(seat: number): Promise<void>`

`useCallback` keyed on `[canSave, handleSave, gameId]`. Saves first if `canSave` (aborting navigation if the save fails), then pushes to `/(pages)/(user)/signature?gameId=...&place=${seat}` — guarantees the signature screen never signs against stale/unsaved placement or score edits.

### `handleBack(): void`

`useCallback` keyed on `[from, gameId]`. Pops the recorded origin via [`goBackTo`](../../../lib/utils/navigation.md), falling back to the `from` query param and then `/game?gameId=${gameId}` (or `/`). The screen passes its own `selfHref` as the `origin` when opening the signature screen.

### `makeStyles(colors: ReturnType<typeof useTheme>["colors"]): StyleSheet`

Builds all card/row/badge/button/hint styles from theme colors; memoized via `useMemo` on `colors`.

## How it works

### Editability gates

`disabled` (locks the score/placement inputs) is true once the result is
`submitted` **or** already has 2+ signatures — partial signing locks the
data players are attesting to, before full submission is even required.

### Save vs. submit

`canSave` requires all placements set, all scores valid non-negative
numbers, a valid placement combination
([`isValidPlacementCombo`](../../../lib/utils/placements.md)), no
score/placement conflict, the game being active, and not already
submitted. `canSubmit` additionally requires either all 4 signatures, or 3
signatures plus a note (the 4th player's absence explained in writing).
`handleSubmit` always tries to save first if `canSave`, then checks
`canSubmit` and shows one of two different explanatory dialogs if it isn't
met yet (a "need a note" nudge for exactly-3-signed vs. a general
"submission blocked" message otherwise).

### Optimistic-concurrency conflict detection

`acknowledgedAtRef` tracks the `$updatedAt` of the last version of the
result this device has actually seen/edited from. On save,
`timestampDrifted` (current `existingResult.$updatedAt` differs from that
ref) combined with `valuesDiffer` (the local edit actually differs from
what's now in the DB) triggers a confirm-overwrite dialog — protects
against two players filling out the same table's result concurrently and
one silently clobbering the other's just-saved changes. Declining the
overwrite discards local edits and adopts the DB's current values instead.
`ownSaveRef` distinguishes "this device's own save echoing back through
the realtime store" from a genuinely different device's write, so a
successful local save doesn't immediately re-trigger this same conflict
check against its own just-written data.

### Signature flow

Opening a signature ([`handleOpenSignature`](signature.md)) saves first if
`canSave` — so navigating to the signature screen never leaves unsaved
placement/score edits behind. `useFocusEffect` re-syncs `signatureIds` from
the store whenever this screen regains focus (i.e. returning from signing),
independently of the general "load once" effect that seeds the rest of the
form only on the very first load of a given result.

### Form-state reset and load-once seeding

Two separate effects manage local form state's relationship to the store, deliberately kept apart:

1. **Reset on identity change** — a `useEffect` keyed on `[gameId, tableNumber]` clears `acknowledgedAtRef`, `ownSaveRef`, and all four form arrays back to blank whenever the game or table changes, so switching tables never leaves one table's half-filled form visible against another table's data.
2. **Load once per result** — a `useEffect` keyed on `[existingResult]` only seeds the form from `existingResult` the *first* time it sees a result for the current identity (guarded by `acknowledgedAtRef.current === null`); on every subsequent store update it either does nothing (a genuinely different device's write arrived, which the conflict-detection in `handleSave` handles instead) or, if `ownSaveRef.current` is set, just advances `acknowledgedAtRef` to the new `$updatedAt` without touching the form fields (this device's own save echoing back). This split is what lets a player keep typing without their local edits being silently overwritten by every realtime update, while still detecting genuine concurrent edits from another device at save time.

The `useFocusEffect` re-sync for `signatureIds` is intentionally exempt from the "only seed once" rule — signatures are always written by navigating away to `signature.tsx` and back, so the only way to pick up a just-saved signature is to re-read it specifically on refocus, bypassing the load-once guard that protects the placement/score/note fields from being clobbered mid-edit.

## Related

- [`lib/components/results/PlayerResultRow.tsx`](../../../lib/components/results/PlayerResultRow.md)
- [`lib/utils/placements.ts`](../../../lib/utils/placements.md)
- [`app/(pages)/(user)/signature.tsx`](signature.md)
