# `app/(pages)/(user)/signature.tsx`

[← app](../../README.md)

## Route

`/signature?gameId=...&place=...`

## Purpose

Draw-a-signature canvas for one seat (`place`), saved as an SVG to Appwrite
storage and attached to that table's [`Result`](../../../lib/models/result.md).
Read-only viewer if that seat already has a signature.

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
[`ScoreSignatureModal`](../../../lib/components/results/ScoreSignatureModal.md)).

## Related

- [`lib/hooks/usePlayerTable.ts`](../../../lib/hooks/usePlayerTable.md)
- [`lib/stores/appwrite/result-store.ts`](../../../lib/stores/appwrite/result-store.md)
- [`app/(pages)/(user)/results.tsx`](results.md) — the screen that navigates here and back
