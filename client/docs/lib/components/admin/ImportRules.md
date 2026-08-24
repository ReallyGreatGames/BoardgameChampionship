# `lib/components/admin/ImportRules.tsx`

[← lib/components/admin](README.md)

## Purpose

Wizard for bulk-importing a game's rule clarifications from pasted text
(English or German, as published on tournament websites): pick game → paste
→ parse → editable preview (create/update/unchanged per entry, with an
optional "delete all existing rules for this game first" toggle) → import →
done.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `ImportRules` | `(): JSX.Element` | No props. The whole wizard; renders one of the paste/deleting/preview-importing-done views based on local `phase` state. |

### Internal types

| Type | Shape | Meaning |
|---|---|---|
| `Phase` | `"paste" \| "preview" \| "deleting" \| "importing" \| "done"` | Which screen is rendered; see [Phase state machine](#phase-state-machine) below. |

### Internal functions

| Function | Signature | Behavior |
|---|---|---|
| `handleParse` | `(): Promise<void>` | Runs [`parseRulesText`](../../import/rule-parser.md) on the pasted text, then sets `parsing` and awaits [`fetchExistingRulesForGame`](../../import/rule-import-service.md) for the selected game — see "Matching against fresh data" below for why this is a live fetch rather than the realtime store. If `wipeExisting` is on, every parsed entry is forced to `action: "create"` (skipping title-matching entirely, since the matched-against rows are about to be deleted); otherwise entries go through [`matchExisting`](../../import/rule-import-service.md) against the fetched rules. Also stores the fetched rules in `rulesToDelete` (used only if `wipeExisting` is on) and advances `phase` to `"preview"`. A fetch failure sets `parseError` instead. |
| `updateRow` | `(i: number, patch: Partial<RuleImportRow>): void` | Merges `patch` into `rows[i]` — backs the editable title/type/text fields in the preview. |
| `forceIncludeRow` | `(i: number): void` | `updateRow(i, { action: "update" })` — see "Overriding an unchanged match" below. |
| `deleteRow` | `(i: number): void` | Removes `rows[i]` entirely — for discarding a misparsed entry before import. |
| `runImport` | `(): Promise<void>` | Sets `phase` to `"importing"` and calls [`importRules`](../../import/rule-import-service.md) once for all of `rows`, streaming per-row status into `statuses`. Sets `phase` to `"done"` when finished (or stopped early by unmount/cancel). |
| `retryFailed` | `(): Promise<void>` | Recomputes the indexes of rows whose status is `"error"`, re-runs `importRules` for just those rows, mapping the retry callback's index back to the original via the same `failedIndexes[ri]` pattern as `ImportTables`. |
| `cancelImporting` | `(): void` | Flags cancellation, marks every still-`"pending"` row status as a `"Cancelled"` error, jumps `phase` to `"done"`. |
| `cancelDeleting` | `(): void` | Same idea for the delete pass: flags cancellation, marks pending delete statuses `"Cancelled"`, jumps `phase` to `"done"` (skipping import — see "Delete-first is a hard stop on cancel" below). |
| `handleImportClick` | `(): Promise<void>` | The entry point for "Import N rule(s)": shows one confirmation dialog (destructive/wipe-worded if `wipeExisting`, plain otherwise). On confirm, if `wipeExisting` and there's anything to delete, sets `phase` to `"deleting"` and runs [`deleteAllRules`](../../import/rule-import-service.md) over `rulesToDelete` before falling through to `runImport`; otherwise calls `runImport` directly. |
| `handleReset` | `(): void` | Clears every piece of wizard state (`pasteText`, `wipeExisting`, `rows`, `statuses`, `rulesToDelete`, `deleteStatuses`, `parseError`) and returns `phase` to `"paste"`. |
| `StatusIcon` | `({ status: ImportRowStatus \| undefined; styles; primaryColor: string }): JSX.Element` | Local row-status glyph: nothing while pending, spinner while importing, checkmark on success, cross on error — same convention as the other two wizards' `StatusIcon`. |

## How it works

### Phase state machine

`phase: "paste" | "preview" | "deleting" | "importing" | "done"`. Unlike
[`ImportPlayers`](ImportPlayers.md)/[`ImportTables`](ImportTables.md),
`"deleting"` here is conditional and comes *after* `"preview"` (only
entered from `handleImportClick` when `wipeExisting` is on), not
automatically before every import. `mountedRef`/`cancelRequestedRef` gate
every async loop the same way as the other two wizards.

### Blocking navigation mid-run

An effect sets [`useImportActivity()`](ImportActivityContext.md)'s `busy`
flag while `phase` is `"deleting"` or `"importing"` — same reasoning as
the other wizards: [`ImportTab`](ImportTab.md) disables switching away to
a sibling sub-tab (which would unmount this one) mid-run.

### Game picker

`gameOptions` is built from [`useScheduleStore()`](../../stores/appwrite/schedule-store.md),
filtered to entries with a `gameId` and sorted by `sortIndex` — the same
pattern [`RankingsTab`](RankingsTab.md) uses. An effect defaults `gameId`
to the first option once the schedule has loaded. The picker is a
[`SelectPicker`](../ui/SelectPicker.md); once past `"paste"`, the selected
game can't be changed without `handleReset`.

### Delete-first option ("replace" vs. "merge")

By default, parsing runs entries through
[`matchExisting`](../../import/rule-import-service.md): a title match
against the game's current rules becomes an `"update"`, no match becomes a
`"create"`, and rows the parser produced that already match exactly become
`"unchanged"` (imported as a no-op success). This is a **merge** — rules
for section references not present in this paste are left untouched.

The `wipeExisting` switch on the paste screen (disabled when the game has
no existing rules) switches to a **replace**: parsing skips
`matchExisting` and forces every row to `"create"`, and
`handleImportClick` first deletes every existing rule for the game
(`rulesToDelete`, snapshotted at parse time) via
[`deleteAllRules`](../../import/rule-import-service.md) — shown as its own
`"deleting"` phase with an [`ImportProgressBar`](ImportProgressBar.md) —
before writing the fresh rows. This is the only way to remove a rule
whose section reference disappeared from the source text entirely (a plain
re-paste can't detect "no longer mentioned," only "changed" or "new").

### Delete-first is a hard stop on cancel

If the admin cancels mid-deletion (`cancelDeleting`), `phase` jumps
straight to `"done"` without ever calling `runImport` —
`handleImportClick` checks `cancelRequestedRef.current` (in addition to
`mountedRef.current`) right after the delete loop returns, specifically so
a cancelled wipe can't be followed by an import that assumes the wipe
finished.

### Matching against fresh data

`handleParse` deliberately calls
[`fetchExistingRulesForGame`](../../import/rule-import-service.md) instead
of matching against [`useRuleStore()`](../../stores/appwrite/rule-store.md)'s
realtime `collection` (which is still read here, but only for the
paste-screen's informational `existingCountForGame` label — low-stakes if
briefly stale). The store only reflects a write once its websocket event
round-trips, so matching against it right after an edit elsewhere (e.g. a
rule just fixed by hand in [`RuleModal`](../rules/RuleModal.md)) could
compare against the pre-edit value and wrongly report `"unchanged"`. A
direct fetch immediately before matching avoids that race. The `parsing`
state disables the Parse button and shows a spinner while this fetch is in
flight.

### Overriding an unchanged match

A row [`matchExisting`](../../import/rule-import-service.md) marks
`"unchanged"` is still editable in the preview (same as any other row),
but since [`importRules`](../../import/rule-import-service.md) skips
`"unchanged"` rows entirely, editing its text alone would silently have no
effect on import — there'd be no way to tell the wizard "write this one
anyway." `forceIncludeRow` closes that gap: pressing "Import anyway" (shown
only on `"unchanged"` rows in `"preview"`) flips the row's `action` to
`"update"` client-side. Nothing else has to change — the row already
carries `existingId` from the match, so `importRules` writes it as a
normal update, and it's counted in `importableCount` like any other
`"update"`/`"create"` row.

### Type editing reuses the app's own type labels

The preview's per-row type selector ([`ChipGroup`](../ui/ChipGroup.md) in
`"select"` mode) uses `t("types.change"/"types.addition"/"types.clarification", { ns: "rules" })`
— the same labels [`RuleModal`](../rules/RuleModal.md) uses for the
manual add/edit form — rather than duplicating separate copy for the
importer.

## Used by

- [`lib/components/admin/ImportTab.tsx`](ImportTab.md)

## Related

- [`lib/import/rule-parser.ts`](../../import/rule-parser.md), [`rule-import-service.ts`](../../import/rule-import-service.md) — the actual parsing/matching/import logic
- [`lib/components/admin/ImportPlayers.tsx`](ImportPlayers.md), [`ImportTables.tsx`](ImportTables.md) — sibling wizards with a similar but not identical phase machine
- [`lib/components/rules/RuleModal.tsx`](../rules/RuleModal.md), [`RuleList.tsx`](../rules/RuleList.md) — the manual single-rule add/edit/list UI this importer feeds into
- [`lib/stores/appwrite/rule-store.ts`](../../stores/appwrite/rule-store.md) — used only for the paste screen's existing-rule count; matching uses a fresh fetch instead, see "Matching against fresh data" above
