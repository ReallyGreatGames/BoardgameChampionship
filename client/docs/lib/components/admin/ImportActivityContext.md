# `lib/components/admin/ImportActivityContext.tsx`

[← lib/components/admin](README.md)

## Purpose

Tiny context tracking whether an import or delete operation is actively
running anywhere in the admin dashboard, so the UI can block navigation
away from it mid-run (unmounting mid-run would silently abort it).

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `ImportActivityProvider` | `(props: PropsWithChildren): JSX.Element` | Context provider component; owns the `busy` state (`useState(false)`) and supplies `{ busy, setBusy }` to descendants. Mount once near the top of the admin tree. |
| `useImportActivity` | `(): ImportActivityContextValue` | Reads the current context value. Outside a provider it returns the module-level default (`busy: false`, `setBusy` a no-op), so consumers never crash, they just silently don't share state. |

### `ImportActivityContextValue`

| Property | Type | Meaning |
|---|---|---|
| `busy` | `boolean` | True while an import or delete operation is actively running anywhere in the admin dashboard. |
| `setBusy` | `(busy: boolean) => void` | Setter used by the import wizards to flip `busy` on/off as their phase changes. |

## Used by

- [`app/(pages)/(admin)/admin/index.tsx`](../../../app/(pages)/(admin)/admin/index.md) — provider mount point
- [`lib/components/admin/ImportTab.tsx`](ImportTab.md) — disables switching sub-tabs while busy
- [`lib/components/admin/ImportPlayers.tsx`](ImportPlayers.md), [`ImportTables.tsx`](ImportTables.md), [`ImportRules.tsx`](ImportRules.md) — set `busy` during delete/import
