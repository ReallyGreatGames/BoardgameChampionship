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
| `ResultsPage` (default) | `(): JSX.Element \| null` | Screen component for `/results?gameId=...`. Renders the shared [`GameHeader`](../../../lib/components/game/GameHeader.md), an entry-status `Badge`, a `PlayerResultColumnHeaders` row followed by the four `PlayerResultRow`s (placement/score/signature per seat), a tie hint, a note field, a footer gate hint, and a submit button — all backed by local form state synced to the player's table `Result` document. Returns `null` while auth is loading or unauthenticated. |

### Module constants

| Constant | Type | Meaning |
| --- | --- | --- |
| `PLAYER_COUNT` | `number` (`4`) | Fixed number of seats per table; sizes every placements/scores/signatureIds array. |

### Internal: `padArray<T>(arr: T[], length: number, fill: T): T[]`

Returns a copy of `arr` padded with `fill` up to `length` (or truncated if longer) — used to normalize placements/scores/signatureIds arrays (which may be shorter, absent, or longer in the stored document) to always have exactly `PLAYER_COUNT` entries for indexed row rendering.

### `buildPayload(submittedFlag: boolean): { gameId: string; table: number; placements: string[]; scores: number[]; note: string; signatureIds: string[]; submitted: boolean }`

`useCallback` keyed on `[gameId, tableNumber, placements, scores, note, signatureIds]`. Assembles the object sent to `resultStore.add`/`update`: parses each score string to a number (defaulting invalid ones to `0`), trims the note, and stamps `submitted: submittedFlag`. Shared by both `handleSave` (always `false`) and `handleSubmit` (always `true`).

### `handleSave(): Promise<boolean>`

`useCallback` keyed on `[canSave, saving, existingResult, placements, scores, note, confirm, t, buildPayload, purgeDroppedSignatures, resultStore]`. No-ops (returns `false`) if `!canSave || saving`. If editing an existing result whose local edits both differ from the DB (`valuesDiffer`) and were made against a stale version (`timestampDrifted`), shows a confirm-overwrite dialog first; declining discards local edits in favor of the DB's current values and returns `true` without writing. Otherwise writes via `resultStore.update`/`add`, marks `ownSaveRef.current = true` so the resulting realtime update doesn't re-trigger the conflict check against its own write, awaits `purgeDroppedSignatures` to delete the now-unreferenced signature files, and returns whether the save succeeded. It deliberately does **not** lower `signaturesReset` — see "Signature flow".

### `handleSubmit(): Promise<void>`

`useCallback` keyed on `[submitting, canSave, canSubmit, signatureCount, handleSave, confirm, t, buildPayload, existingResult, resultStore]`. No-ops while already `submitting`. Saves first if `canSave` (aborting if that save fails) — which is also what persists a signature reset caused by an edit. If `canSubmit` is still false, shows the "collect all 4 signatures" dialog (`signatureCount < PLAYER_COUNT`) or a general "submission blocked" dialog otherwise, then returns. Otherwise shows a confirm-submit dialog; on confirmation, writes the payload with `submitted: true`.

### `invalidateSignatures(): void`

`useCallback` keyed on `[signatureIds]`. No-ops when no signature is present. Otherwise queues every non-empty id on `droppedSignatureIdsRef` (so the files can be deleted once the clear is actually saved), clears all four `signatureIds`, and raises `signaturesReset`, which both explains the wipe in the UI and stops the focus re-sync from restoring the now-invalid signatures before the clear has been saved.

### `purgeDroppedSignatures(): Promise<void>`

`useCallback` with no deps. Deletes every file id queued on `droppedSignatureIdsRef` from the `signatures` bucket via `Promise.allSettled`, emptying the queue first so a concurrent save can't delete the same file twice. Failures are ignored — a file that can't be deleted is an orphan, which is what it already was before this existed, and the player's save must not fail over cleanup. Called by `handleSave` **only after the write succeeds**, so a file is never deleted while the stored document still references it.

### `handleSetPlacement(i: number, v: string): void`

`useCallback` keyed on `[placements, invalidateSignatures]`. No-ops when the value is unchanged (chips toggle through the same handler, so this also filters out a tap that re-selects what was already there). Otherwise sets `placements[i]` to `v` via an immutable array copy and calls `invalidateSignatures`.

### `handleSetScore(i: number, v: string): void`

`useCallback` keyed on `[scores, invalidateSignatures]`. Same shape as `handleSetPlacement` — unchanged-value guard, immutable copy, then `invalidateSignatures`. The guard matters more here because the score input fires on every keystroke.

### `handleOpenSignature(seat: number): Promise<void>`

`useCallback` keyed on `[canSave, handleSave, gameId, selfHref, signatureIds]`. Saves first if `canSave` (aborting navigation if the save fails), then pushes to `/(pages)/(user)/signature?gameId=...&place=${seat}&sigs=...` — guarantees the signature screen never signs against stale/unsaved placement or score edits. `place` is only the seat to open on; `sigs` carries this screen's own view of **all four** seats' signature ids (comma-separated, `NO_SIGNATURE` for an empty seat) so the tab bar on the signature screen doesn't have to consult the store, whose copy may not have caught up with the save that just cleared it — see [`signature.tsx`](signature.md).

### `tiedPlaces: number[]`

`useMemo` keyed on `[placements, allPlacementsSet, placementComboValid]`. Empty unless every seat has a placement and the combination is valid (ties are a legitimate outcome of `isValidPlacementCombo`, e.g. `1,2,2,4`); otherwise the sorted list of place numbers held by more than one seat. Rendered as an informational line under the card (`tieDetected`), not an error.

### `gateMessage: string` / `gateReady: boolean`

`gateMessage` is a `useMemo` that explains, in priority order, why the result can't be submitted yet: already submitted (`gateSubmitted`), the game isn't active (`notActiveGame`), everything is in place (`gateReady`), or otherwise a comma-joined list of what's still missing (scores/placements/signatures, via `gateMissingPrefix`). `gateReady` (`isSubmitted || resultReady`, where `resultReady` mirrors `canSave`/`canSubmit`'s conditions without the `isActiveGame`/`isSubmitted` gates) just picks the hint's ink color. This text sits above the submit button. The button is disabled and dimmed whenever `canSubmit` is false (including while any of the four signatures are missing), or while saving or submitting.

### `handleBack(): void`

`useCallback` keyed on `[from, gameId]`. Pops the recorded origin via [`goBackTo`](../../../lib/utils/navigation.md), falling back to the `from` query param and then `/game?gameId=${gameId}` (or `/`). The screen passes its own `selfHref` as the `origin` when opening the signature screen.

### `makeStyles(colors: ReturnType<typeof useTheme>["colors"]): StyleSheet`

Builds all card/row/badge/button/hint styles from theme colors; memoized via `useMemo` on `colors`.

## How it works

### Labelling the columns, and the stacked placement row

The card opens with a single
[`PlayerResultColumnHeaders`](../../../lib/components/results/PlayerResultRow.md)
row (`colPlayer` / `colScore` / `colSignature`, with `hidePlacementColumn`
set), because nothing about a bare number box and an icon button says which
is the score and which collects a signature — players reported exactly that
confusion. Each `PlayerResultRow` is rendered with `stackPlacement` and
`placementRowLabel={t("colPlace")}`: the name/score/signature stay on one
line, and the four placement chips move to their own full-width row
labelled "Place" underneath, each chip stretched to share the row's width
evenly instead of the fixed-size squares `ResultsAdminTab`'s (non-stacked)
rows use. This is the layout the design's "2a" screen specifies, and it's
opt-in via `stackPlacement` specifically so `ResultsAdminTab`'s wider,
multi-column table isn't affected.

### Editability gates

`disabled` (locks the score/placement inputs) is true only once the result
is `submitted`. Signatures do **not** lock the inputs; instead, changing a
placement or a score wipes every signature collected so far
(`invalidateSignatures`), so a signature can never end up attached to
numbers other than the ones that were signed for. That is the deliberate
trade: a table that spots a mistake after signing can fix it and re-collect,
rather than being locked out of its own result.

The note is exempt — it is not part of what the placement/score signatures
attest to, and editing it does not reset them.

`canSign` (whether a signature button does anything) is exactly `canSave`:
the game is active, the result is not submitted, and the placements/scores
currently form a valid, conflict-free combination. There is no
"someone already signed, so let the rest sign regardless" exemption any
more — that only existed because signing used to freeze the inputs.

### Save vs. submit

`canSave` requires all placements set, all scores valid non-negative
numbers, a valid placement combination
([`isValidPlacementCombo`](../../../lib/utils/placements.md)), no
score/placement conflict, the game being active, and not already
submitted. `canSubmit` additionally requires **all four** signatures — there
is no 3-signatures-plus-a-note alternative; every player at the table signs
or the result cannot be submitted. `handleSubmit` always tries to save
first if `canSave`, then checks `canSubmit` and explains what is missing
(the "collect all 4 signatures" dialog while any are missing, the general
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

Missing signatures show Lucide's `Signature` icon. Collected signatures show a
green `Check` with a green button border and tinted background, retaining their
full color even when signing is disabled or the result has been submitted.

Opening a signature ([`handleOpenSignature`](signature.md)) saves first if
`canSave` — so navigating to the signature screen never leaves unsaved
placement/score edits behind, and a pending signature reset reaches the
document before the next signature is added to it. `useFocusEffect`
re-syncs `signatureIds` from the store whenever this screen regains focus
(i.e. returning from signing), independently of the general "load once"
effect that seeds the rest of the form only on the very first load of a
given result.

That re-sync is skipped while `signaturesReset` is set. Otherwise an edit
that wiped the signatures locally, followed by navigating away and back
without saving, would pull the old signature ids straight back out of the
document and pair them with the changed numbers.

`signaturesReset` is lowered in the `existingResult` effect's `ownSaveRef`
branch — the moment this device's own write echoes back through the realtime
store — and **not** at the end of `handleSave`. The store has no optimistic
local update, so at the end of a save its copy can still be the pre-save one;
lowering the flag there re-enables the focus re-sync against that stale copy,
which promptly restores the very signature ids the save just cleared. Worse,
`purgeDroppedSignatures` has by then deleted those files, so a subsequent
submit would write ids pointing at storage objects that no longer exist.
Waiting for the echo means the re-sync can only ever run against a copy that
already reflects the clear.

### Deleting the signature files a reset drops

The ids cleared by `invalidateSignatures` are queued rather than deleted on
the spot, and the files only go once `handleSave` has successfully written
the cleared array. The ordering is the whole point: deleting first would
leave the stored document pointing at files that no longer exist if the edit
is then abandoned (the player closes the app without saving), which is worse
than an orphan — the admin's signature viewer would break. The queue is also
dropped whenever the game or table changes, because ids belonging to a
table whose clear was never saved are still referenced by that table's
document and must not be deleted.

This only covers signatures dropped by an edit. Re-signing a seat still
replaces the id with a freshly uploaded file and orphans the previous one,
and nothing prunes the `signatures` bucket in bulk — the wipe service only
handles the lottery bucket.

### Form-state reset and load-once seeding

Two separate effects manage local form state's relationship to the store, deliberately kept apart:

1. **Reset on identity change** — a `useEffect` keyed on `[gameId, tableNumber]` clears `acknowledgedAtRef`, `ownSaveRef`, and all four form arrays back to blank whenever the game or table changes, so switching tables never leaves one table's half-filled form visible against another table's data.
2. **Load once per result** — a `useEffect` keyed on `[existingResult]` only seeds the form from `existingResult` the *first* time it sees a result for the current identity (guarded by `acknowledgedAtRef.current === null`); on every subsequent store update it either does nothing (a genuinely different device's write arrived, which the conflict-detection in `handleSave` handles instead) or, if `ownSaveRef.current` is set, just advances `acknowledgedAtRef` to the new `$updatedAt` without touching the form fields (this device's own save echoing back). This split is what lets a player keep typing without their local edits being silently overwritten by every realtime update, while still detecting genuine concurrent edits from another device at save time.

The `useFocusEffect` re-sync for `signatureIds` is intentionally exempt from the "only seed once" rule — signatures are always written by navigating away to `signature.tsx` and back, so the only way to pick up a just-saved signature is to re-read it specifically on refocus, bypassing the load-once guard that protects the placement/score/note fields from being clobbered mid-edit.

## Related

- [`lib/components/results/PlayerResultRow.tsx`](../../../lib/components/results/PlayerResultRow.md)
- [`lib/components/ui/Badge.tsx`](../../../lib/components/ui/Badge.md) — entry-status badge (`entryOpen`/`submitted`) next to the back button
- [`lib/components/game/GameHeader.tsx`](../../../lib/components/game/GameHeader.md) — the screen's hero header
- [`lib/utils/placements.ts`](../../../lib/utils/placements.md)
- [`app/(pages)/(user)/signature.tsx`](signature.md)
