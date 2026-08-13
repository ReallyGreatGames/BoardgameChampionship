# `lib/components/admin/ImportTab.tsx`

[← lib/components/admin](README.md)

## Purpose

Sub-tab switcher between the two bulk-import wizards.

## How it works

While [`useImportActivity()`](ImportActivityContext.md)'s `busy` is true,
the *inactive* sub-tab's button is disabled — prevents switching away from
(and thereby unmounting) an in-progress import/delete run.

## Used by

- [`app/(pages)/(admin)/admin/index.tsx`](../../../app/(pages)/(admin)/admin/index.md)

## Related

- [`lib/components/admin/ImportPlayers.tsx`](ImportPlayers.md), [`ImportTables.tsx`](ImportTables.md)
