# `app/(pages)/(user)/signature.tsx`

[← app](../../README.md)

## Route

`/signature?gameId=...&place=...&sigs=...&from=...`

## Purpose

Draw-a-signature canvas for a table's four seats, saved as an SVG to
Appwrite storage and attached to that table's
[`Result`](../../../lib/models/result.md). Shows all four seats as tabs so a
player can sign, switch to the next unsigned seat, and sign again without
leaving the screen — [`results.tsx`](results.md) opens this once per table,
not once per seat. A seat that already has a signature is read-only when its
tab is selected; signatures can't be redrawn from here once saved (see
"Read-only mode").

## Exports

| Export | Signature | Purpose |
| --- | --- | --- |
| `SignaturePage` (default) | `(): JSX.Element` | Screen component for `/signature?gameId=...&place=...&sigs=...`. Renders the shared `GameHeader` (drawer menu, title, progress subtitle), a separate Back button, a 4-seat tab bar, the active seat's name (with team country chip and team name on the line below) and score/place summary, the drawing canvas (or read-only viewer if that seat already has a signature), and clear/confirm actions. |

### Module constants

| Constant | Type | Meaning |
| --- | --- | --- |
| `PLAYER_COUNT` | `number` (`4`) | Fixed number of seats per table; sizes the local `sigIds` array. |

### Types

| Type | Definition | Meaning |
| --- | --- | --- |
| `Point` | `{ x: number; y: number }` | One touch sample's canvas coordinates. |
| `Stroke` | `Point[]` | A single continuous pen stroke, as an ordered list of points. |

### Internal: `parseSigsParam(sigs: string): string[]`

Turns the comma-separated `sigs` route param into a `PLAYER_COUNT`-long array of signature file ids, mapping the `NO_SIGNATURE` placeholder back to `""` (unsigned). Used by the `sigIds` initializer and the per-visit re-seed.

### Internal: `padArray<T>(arr: T[], length: number, fill: T): T[]`

Same helper as [`results.tsx`](results.md)'s — pads/truncates an array to exactly `PLAYER_COUNT` entries. Duplicated locally rather than shared, since it's four lines and the two screens don't otherwise share a module.

### `strokeToD(stroke: Stroke): string`

Converts a `Stroke` into an SVG path `d` attribute string (`"M x,y L x,y L x,y ..."`), or `""` for an empty stroke. Shared by both the live-drawing `<Path>` elements and the uploaded SVG serialization.

### `buildSvgContent(strokes: Stroke[], width: number, height: number): string`

Serializes every non-empty stroke into one `<path>` element (black, 2.5px, rounded caps/joins) and wraps them in a single `<svg>` document sized `width`×`height` — this string is what gets uploaded as the signature file.

### `clearDrawing(): void`

`useCallback` with no deps. Empties `strokes`, `currentStroke` and `currentStrokeRef`. Wired to `useFocusEffect` (every visit starts blank) and reused by the active-seat fetch effect (every tab switch starts blank too).

### `handleClear(): void`

`useCallback` with no deps. Resets `strokes`, `currentStroke`, and `currentStrokeRef` to empty, discarding the in-progress drawing. Disabled once the active seat already has a signature (`hasExisting`) or the canvas is already empty.

### `openMenu(): void`

Opens the navigation drawer from `GameHeader`. The route disables the default navigation header.

### `handleBack(): void`

`useCallback` keyed on `[from, gameId]`. Pops the recorded origin via [`goBackTo`](../../../lib/utils/navigation.md) — the results screen that opened this one — falling back to the `from` query param and then `/(pages)/(user)/results?gameId=${gameId}` (or `/`).

### `handleSelectSeat(i: number): Promise<void>`

`useCallback` keyed on `[active, isEmpty, hasExisting, confirm, t, activeName]`. No-ops if `i` is already active. If the canvas holds an unconfirmed drawing (`!isEmpty && !hasExisting`), first asks via [`useDialog().confirm`](../../../lib/components/ui/Dialog.md) (`discardConfirm.*`, destructive, naming the active player) and stays on the current seat if cancelled. Otherwise sets `active`; the fetch effect (below) reacts to the new seat's signature id and resets the canvas.

### Derived: `activePlayer` / `activeName` / `activeTeam`

`activePlayer` is `playerData[active]`; `activeName` its name, or `P{n}` when the seat has no player. `activeTeam` is the player's [`Team`](../../../lib/models/team.md) when the relation is hydrated (an object), else `null` — an unhydrated relation arrives as a bare id string. Declared before `handleSelectSeat`, which uses `activeName` in its dialog.

### `handleConfirm(): Promise<void>`

`useCallback` keyed on `[isEmpty, saving, tableNumber, strokes, canvasDims, active, gameId, resultStore]`. No-ops if the canvas is empty, already saving, or `tableNumber` is unresolved. Otherwise: serializes strokes to SVG via `buildSvgContent`, builds a platform-appropriate file argument (web `Blob`/`File`, native temp file via `expo-file-system`), uploads it to the signatures bucket, re-reads the table's `Result` fresh from the store (not the local `sigIds` snapshot — see "Signature ids: param snapshot vs. live store"), splices the uploaded file id into that fresh array at `active`, updates/creates the `Result`, then updates local `sigIds` and advances `active` to the first still-unsigned seat (staying put if none remain). Wraps the whole flow in `saving` state to disable the buttons and show a spinner.

## How it works

### Tabs share one canvas

There's exactly one drawing surface; the four tabs above it just pick which seat's signature it reads and writes. Switching seats (`handleSelectSeat`) does **not** save an in-progress, unconfirmed drawing on the seat being left — the effect that runs on `active`/`activeFileId` change unconditionally clears the canvas. Because that silently threw away a signature someone had just drawn, a switch away from a non-empty, unconfirmed canvas now asks first (`discardConfirm`); switching from an empty canvas or a read-only (already signed) seat stays instant.

### Header subtitle

The `progress` string contains `{total}` twice ("Spieler {current} von {total} · {signed}/{total} unterschrieben"). `String.prototype.replace` with a string pattern only replaces the first match, so `{total}` is replaced with a global regex (`/\{total\}/g`); the other placeholders appear once.

### Active player line

The player name sits on its own line; below it, when `activeTeam` is set, a second row (`activeTeamRow`) shows the team's country chip and team name. The row is omitted entirely when the team has neither, so no empty gap appears above the score summary. The team text `flexShrink`s with `numberOfLines={1}`, so a long team name truncates instead of pushing the chip off-screen. The chip styling matches the country chips on [`GameSeatingList`](../../../lib/components/game/GameSeatingList.md) and [`NowPlayingCard`](../../../lib/components/home/NowPlayingCard.md).

### Signature ids: param snapshot vs. live store

Local `sigIds` state seeds from the `sigs` route param when present (a comma-separated, `NO_SIGNATURE`-padded snapshot of all four seats, built by `results.tsx` right after it saved) and only falls back to the store's `Result.signatureIds` when `sigs` is absent. This mirrors why the old single-seat screen trusted its `sig` param over the store: the store's copy is only refreshed by a realtime event, so immediately after `results.tsx` saves a signature reset the store can still hold stale ids for a moment — reading it directly here (for four seats at once, for the tab bar) would flash old "signed" state on freshly-cleared seats.

`handleConfirm` does the opposite on purpose: it re-reads `Result.signatureIds` from the store fresh (not from `sigIds`) right before splicing in the newly-uploaded id, so a concurrent edit to a *different* seat (from another device, while this screen was open) isn't clobbered by this device's stale local copy. `sigIds` is then updated from that same fresh-plus-splice result, so the local snapshot and the store never diverge after a save on this device.

### Read-only mode

If the active seat already has a signature (`hasExisting`, derived from `sigIds[active]`), the canvas fetches and displays that SVG instead of accepting new strokes, and both `Clear` and `Confirm` are disabled — signatures can't be redrawn from here once saved (only reset entirely, from the admin's [`ScoreSignatureModal`](../../../lib/components/results/ScoreSignatureModal.md), or by editing a placement/score on [`results.tsx`](results.md), which resets every signature on the table). A footer hint (`alreadySigned`) explains the locked state.

### Re-seeding from the route params on every visit

The app is a single Drawer navigator, so this screen stays mounted between visits and `useState` initializers only ever see the params of the *first* visit. Without a re-seed, the second time a player tapped a signature button on [`results.tsx`](results.md) the screen opened on whatever seat `active` was left at — typically the "next unsigned" seat `handleConfirm` advanced to — instead of the seat tapped. A `useFocusEffect` keyed on `[place, sigs]` therefore resets `active` from `place` and, when `sigs` is present, `sigIds` from `sigs` on every focus. It is a focus effect rather than a plain `useEffect` on the params because tapping the same seat twice produces identical params, yet `active` may have been changed via the tabs in between. `existingResult` is deliberately not a dependency: a realtime update to the result while the screen is open must not yank the player back to the seat they arrived on.

### Per-seat fetch/reset effect

Keyed on `[active, activeFileId, clearDrawing]` where `activeFileId = sigIds[active]`: clears `existingSvg` and the drawing state, then only re-fetches from storage if `activeFileId` is non-empty. Watching `active` ensures switching between unsigned seats also clears the canvas, even though both file IDs are empty. This also resets the drawing when confirmation advances to the next unsigned seat.

`useFocusEffect(clearDrawing)` is a second, independent reset: the only signal that reliably marks "a new visit" to this screen, covering the case where `activeFileId` happens not to change between visits (e.g. leaving and returning to the same still-unsigned seat) but strokes drawn on the earlier visit would otherwise still be sitting on the canvas.

### Drawing

A `PanResponder` accumulates points into the current stroke (`currentStrokeRef`, mirrored into `currentStroke` state for rendering); `onPanResponderRelease` commits the finished stroke into `strokes`. Each stroke renders as its own SVG `<Path>` while drawing (`react-native-svg`), and `buildSvgContent` serializes every completed stroke into a single flat SVG string for upload.

### Save

Platform-specific file construction: web builds a `Blob`/`File` directly from the SVG string; native writes the SVG to a temp file via `expo-file-system`'s `File` (`Paths.cache`). The shared `createSignatureFile` helper keeps the file's URI, name, MIME type, and size, and exposes `bytes()` for Expo's multipart encoder, which rejects URI-only descriptors. The regression check (`node scripts/test-signature-upload.cjs`) exercises the installed Appwrite SDK and Expo encoder for native and web uploads. After upload, the signature id is spliced into a **freshly-read** copy of the result's `signatureIds` array at `active` (padding if shorter), and the [`Result`](../../../lib/stores/appwrite/result-store.md) is updated or created as needed. Unlike the previous single-seat version, this screen does **not** navigate away after a save — it advances to the next unsigned seat instead, so the player stays on `/signature` until they tap back.

### Active seat summary

`activeScore`/`activePlacement` read straight from the live `existingResult` (not the param snapshot) — a display-only value, so the brief staleness window that matters for `sigIds` doesn't matter here. `activeTied` flags when the active seat's placement is shared by another seat in `existingResult.placements`, purely for the parenthetical in the summary line.

## Related

- [`lib/hooks/usePlayerTable.ts`](../../../lib/hooks/usePlayerTable.md)
- [`lib/stores/appwrite/result-store.ts`](../../../lib/stores/appwrite/result-store.md)
- [`lib/stores/appwrite/table-store.ts`](../../../lib/stores/appwrite/table-store.md) — supplies the four seats' player names for the tab bar
- [`lib/components/ui/Button.tsx`](../../../lib/components/ui/Button.md) — Clear/Confirm actions
- [`lib/components/ui/Dialog.tsx`](../../../lib/components/ui/Dialog.md) — the discard-drawing confirmation
- [`app/(pages)/(user)/results.tsx`](results.md) — the screen that navigates here and back
