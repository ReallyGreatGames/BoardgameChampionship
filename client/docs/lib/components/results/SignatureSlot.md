# `lib/components/results/SignatureSlot.tsx`

[← lib/components/results](README.md)

## Purpose

Small thumbnail for one player's signature — loads and renders the SVG
from Appwrite storage, or a placeholder/error icon.

## Props

`{ fileId: string | undefined | null }`

## How it works

Fetches `storage.getFileView({ bucketId: SIGNATURES_BUCKET_ID, fileId })`
whenever `fileId` changes, decoding the returned buffer as UTF-8 text
(the file is an SVG). Renders via `SvgXml` through
[`injectViewBox`](../../utils.md) (signatures saved by the signature
screen lack a `viewBox`, which would otherwise clip the rendered content).
Three visual states: loading spinner, rendered SVG, or (if `fileId` is set
but nothing loaded) an edit-pencil icon meaning "not yet signed" — a fetch
failure shows an error icon instead.

## Used by

- [`lib/components/results/ResultsAdminTab.tsx`](ResultsAdminTab.md)
