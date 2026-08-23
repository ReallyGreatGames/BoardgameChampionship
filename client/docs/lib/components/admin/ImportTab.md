# `lib/components/admin/ImportTab.tsx`

[← lib/components/admin](README.md)

## Purpose

Sub-tab switcher between the three bulk-import wizards.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `ImportTab` | `(): JSX.Element` | No props. Renders the sub-tab bar and switches between [`ImportPlayers`](ImportPlayers.md), [`ImportTables`](ImportTables.md), and [`ImportRules`](ImportRules.md) based on local `active` state. |

## How it works

`active: SubTab` (`"players" | "tables" | "rules"`) is local component state, initialized to `"players"`; only the selected wizard is mounted at a time (the other two unmount entirely), which is why the busy-guard below matters — switching sub-tabs while a wizard is mid-run would tear it down mid-operation.

While [`useImportActivity()`](ImportActivityContext.md)'s `busy` is true,
every *inactive* sub-tab's button is disabled — prevents switching away
from (and thereby unmounting) an in-progress import/delete run.

Sub-tab labels come from `t("subTabs.players"/"subTabs.tables"/"subTabs.rules", { ns: "importTab" })`
via `SUB_TABS`' `labelKey` field — see
[`lib/i18n/translations/de.ts`](../../i18n/translations/de.md#structure-top-level-namespaces)'s
`importTab` namespace.

## Used by

- [`app/(pages)/(admin)/admin/index.tsx`](../../../app/(pages)/(admin)/admin/index.md)

## Related

- [`lib/components/admin/ImportPlayers.tsx`](ImportPlayers.md), [`ImportTables.tsx`](ImportTables.md), [`ImportRules.tsx`](ImportRules.md)
