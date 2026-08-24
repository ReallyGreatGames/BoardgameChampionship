# `lib/components/admin/FeatureFlags.tsx`

[← lib/components/admin](README.md)

## Purpose

List of feature-flag toggles with a batched save — toggling a switch
doesn't write immediately; changes accumulate until "Save" is pressed.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `FeatureFlags` | `(): JSX.Element` | Renders the flag list card and its batched-save footer; no props, reads the `feature_flags` collection from [`useFeatureFlagStore`](../../stores/appwrite/feature-flag-store.md) directly. |

## Internal state and helpers

| Name | Type / Signature | Meaning / behavior |
|---|---|---|
| `pending` | `Record<string, boolean>` (state) | Maps flag `$id` → the new value the admin picked this session; a flag absent from this map is untouched. |
| `saving` | `boolean` (state) | True while `handleSave`'s writes are in flight; disables the save button and swaps its label for a spinner. |
| `pendingCount` | `number` | `Object.keys(pending).length` — how many flags have unsaved changes, shown in the save button label. |
| `hasPendingChanges` | `boolean` | `pendingCount > 0`; gates whether the save button is enabled. |
| `toggle(id: string, currentValue: boolean): void` | function | Flips the flag's displayed value by writing its negation into `pending`; does not touch the store, so nothing is persisted until save. |
| `getDisplayValue(id: string, storedValue: boolean): boolean` | function | Returns `pending[id]` if the flag has been touched this session, otherwise falls back to `storedValue` from the collection — this is what makes an unsaved toggle show immediately without a round-trip. |
| `handleSave(): Promise<void>` | function | Confirms once via [`useDialog`](../ui/Dialog.md), naming the count of pending changes; on confirmation, fires one `updateInCollection` call per pending flag in parallel via `Promise.all`, then clears `pending` and `saving`. Writes go straight to the `feature_flags` collection id rather than through [`useFeatureFlagStore`](../../stores/appwrite/feature-flag-store.md)'s own methods, because that store is read-only by convention. |

## How it works

`pending: Record<flagId, boolean>` holds only the flags the admin has
actually touched this session; `getDisplayValue` overlays a pending change
onto the stored value so the switch reflects the unsaved state, and a
label turns accent-colored to show it's dirty. `handleSave` confirms once
(mentioning the count of pending changes), then fires all updates in
parallel via [`updateInCollection`](../../stores/real-time-store.md)
(called directly against the `feature_flags` collection id, not through
[`useFeatureFlagStore`](../../stores/appwrite/feature-flag-store.md)'s own
methods — that store is read-only by convention).

## Used by

- [`app/(pages)/(admin)/admin/index.tsx`](../../../app/(pages)/(admin)/admin/index.md)
