# `lib/components/admin/ImportTab.tsx`

[← lib/components/admin](README.md)

## Purpose

Sub-tab switcher between the two bulk-import wizards.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `ImportTab` | `(): JSX.Element` | No props. Renders the sub-tab bar and switches between [`ImportPlayers`](ImportPlayers.md) and [`ImportTables`](ImportTables.md) based on local `active` state. |

## How it works

`active: SubTab` (`"players" | "tables"`) is local component state, initialized to `"players"`; only the selected wizard is mounted at a time (the other unmounts entirely), which is why the busy-guard below matters — switching sub-tabs while a wizard is mid-run would tear it down mid-operation.

While [`useImportActivity()`](ImportActivityContext.md)'s `busy` is true,
the *inactive* sub-tab's button is disabled — prevents switching away from
(and thereby unmounting) an in-progress import/delete run.

## Used by

- [`app/(pages)/(admin)/admin/index.tsx`](../../../app/(pages)/(admin)/admin/index.md)

## Related

- [`lib/components/admin/ImportPlayers.tsx`](ImportPlayers.md), [`ImportTables.tsx`](ImportTables.md)
