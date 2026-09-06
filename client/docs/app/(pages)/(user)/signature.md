# `app/(pages)/(user)/signature.tsx`

[← app](../../README.md)

## Route

`/signature?gameId=...&place=...&sig=...&from=...`

## Purpose

Draw-a-signature canvas for one seat (`place`), saved as an SVG to Appwrite
storage and attached to that table's [`Result`](../../../lib/models/result.md).
Read-only viewer if that seat already has a signature.

## Exports

| Export | Signature | Purpose |
| --- | --- | --- |
| `SignaturePage` (default) | `(): JSX.Element` | Screen component for `/signature?gameId=...&place=...`. Renders the drawing canvas (or read-only viewer if a signature already exists), clear/save actions, and a back button. |

### Types

| Type | Definition | Meaning |
| --- | --- | --- |
| `Point` | `{ x: number; y: number }` | One touch sample's canvas coordinates. |
| `Stroke` | `Point[]` | A single continuous pen stroke, as an ordered list of points. |

### `strokeToD(stroke: Stroke): string`

Converts a `Stroke` into an SVG path `d` attribute string (`"M x,y L x,y L x,y ..."`), or `""` for an empty stroke. Shared by both the live-drawing `<Path>` elements and the uploaded SVG serialization.

### `buildSvgContent(strokes: Stroke[], width: number, height: number): string`

Serializes every non-empty stroke into one `<path>` element (black, 2.5px, rounded caps/joins) and wraps them in a single `<svg>` document sized `width`×`height` — this string is what gets uploaded as the signature file.

### `clearDrawing(): void`

`useCallback` with no deps. Empties `strokes`, `currentStroke` and `currentStrokeRef`. Wired to `useFocusEffect`, so every visit starts on a blank canvas, and reused by the `[existingFileId]` fetch effect.

### `handleClear(): void`

`useCallback` with no deps. Resets `strokes`, `currentStroke`, and `currentStrokeRef` to empty, discarding the in-progress drawing. Disabled once a signature already exists (`hasExisting`) or the canvas is already empty.

### `handleBack(): void`

`useCallback` keyed on `[from, gameId]`. Pops the recorded origin via [`goBackTo`](../../../lib/utils/navigation.md) — the results screen that opened this one — falling back to the `from` query param and then `/(pages)/(user)/results?gameId=${gameId}` (or `/`). `handleSave` ends the same way, so a saved signature and a cancelled one land on the same screen.

### `handleSave(): Promise<void>`

`useCallback` keyed on `[isEmpty, saving, tableNumber, strokes, canvasDims, placeIdx, gameId, resultStore]`. No-ops if the canvas is empty, already saving, or `tableNumber` is unresolved. Otherwise: serializes strokes to SVG via `buildSvgContent`, builds a platform-appropriate file argument (web `Blob`/`File`, native temp file via `expo-file-system`), uploads it to the signatures bucket, splices the resulting file id into the table's `signatureIds` array at `placeIdx` (padding with empty strings as needed), updates the existing `Result` or creates a new one, and navigates back to `/results?gameId=...`. Wraps the whole flow in `saving` state to disable the button and show a spinner.

## How it works

### Drawing

A `PanResponder` accumulates points into the current stroke
(`currentStrokeRef`, mirrored into `currentStroke` state for rendering);
`onPanResponderRelease` commits the finished stroke into `strokes`. Each
stroke renders as its own SVG `<Path>` while drawing (`react-native-svg`),
and `buildSvgContent` serializes every completed stroke into a single flat
SVG string for upload — one `<path>` element per stroke, joined by newlines.

### Save

Platform-specific file construction: web builds a `Blob`/`File` directly
from the SVG string; native writes the SVG to a temp file via
`expo-file-system`'s `File` (`Paths.cache`) and uploads that file's `uri`.
After upload, the signature id is spliced into the result's
`signatureIds` array at `place` (padding the array if it's currently
shorter), and the [`Result`](../../../lib/stores/appwrite/result-store.md)
is updated or created as needed — then navigates back to `/results`.

### Read-only mode

If the seat already has a signature (`existingFileId`), the canvas fetches
and displays that SVG instead of accepting new strokes — signatures can't
be redrawn from here once saved (only reset entirely, from the admin's
[`ScoreSignatureModal`](../../../lib/components/results/ScoreSignatureModal.md),
or by editing a placement/score on [`results.tsx`](results.md), which resets
every signature on the table).

`existingFileId` comes from the `sig` route param when one is present, and
only falls back to `signatureIds[placeIdx]` on the store's `Result` when it
isn't. The param is what [`results.tsx`](results.md) believes the seat's
signature to be, and it is authoritative for a reason: the store's copy is
only refreshed by a realtime event, so right after results saves a signature
reset the store can still hold the *old* file id for a moment. Falling back
to it there would open this screen in read-only mode showing a signature
that no longer applies — and, because read-only mode accepts no strokes,
would leave the player unable to re-sign at all. `NO_SIGNATURE` (`"none"`,
from [`lib/models/result.ts`](../../../lib/models/result.md)) is the
sentinel for "this seat has no signature", since an empty param value can't
be distinguished from an absent one.

The fetch/reset effect is keyed on `[existingFileId]`: it clears `existingSvg` and the drawing state, then only re-fetches from storage if `existingFileId` is non-empty.

That effect alone is not enough to guarantee a blank canvas, because it only fires when `existingFileId` *changes*. This screen stays mounted (a drawer navigator keeps visited screens alive), so `strokes` outlives a visit — and after a signature reset on [`results.tsx`](results.md) a previously-unsigned seat goes from `""` straight back to `""`, leaving the strokes drawn on the earlier visit sitting on the canvas. `clearDrawing` therefore also runs from `useFocusEffect`, on every focus, which is the only signal that reliably marks "a new visit". Nothing is lost by it: leaving the screen is the only way to blur it, and an unsaved drawing is abandoned at that point anyway.

## Related

- [`lib/hooks/usePlayerTable.ts`](../../../lib/hooks/usePlayerTable.md)
- [`lib/stores/appwrite/result-store.ts`](../../../lib/stores/appwrite/result-store.md)
- [`app/(pages)/(user)/results.tsx`](results.md) — the screen that navigates here and back
