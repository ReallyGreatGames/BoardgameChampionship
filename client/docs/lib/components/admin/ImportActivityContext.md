# `lib/components/admin/ImportActivityContext.tsx`

[← lib/components/admin](README.md)

## Purpose

Tiny context tracking whether an import or delete operation is actively
running anywhere in the admin dashboard, so the UI can block navigation
away from it mid-run (unmounting mid-run would silently abort it).

## Exports

| Export | Purpose |
|---|---|
| `ImportActivityProvider` (component) | Provides `{ busy, setBusy }` |
| `useImportActivity()` | Hook to read/set `busy` |

## Used by

- [`app/(pages)/(admin)/admin/index.tsx`](../../../app/(pages)/(admin)/admin/index.md) — provider mount point
- [`lib/components/admin/ImportTab.tsx`](ImportTab.md) — disables switching sub-tabs while busy
- [`lib/components/admin/ImportPlayers.tsx`](ImportPlayers.md), [`ImportTables.tsx`](ImportTables.md) — set `busy` during delete/import
