# `app/(pages)/(user)/results.tsx`

[← app](../../README.md)

## Route

`/results?gameId=...`

## Purpose

Participant-facing self-service result entry for the player's own table:
placements, scores, a note, per-player signatures, save, and submit. The
non-admin counterpart to
[`ResultsAdminTab`](../../../lib/components/results/ResultsAdminTab.md)'s
input mode — built independently rather than sharing that component,
since the rules here (submission gates, editability once submitted,
signature-count requirements) are specific to self-service.

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

## Related

- [`lib/components/results/PlayerResultRow.tsx`](../../../lib/components/results/PlayerResultRow.md)
- [`lib/utils/placements.ts`](../../../lib/utils/placements.md)
- [`app/(pages)/(user)/signature.tsx`](signature.md)
