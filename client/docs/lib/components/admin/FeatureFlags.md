# `lib/components/admin/FeatureFlags.tsx`

[← lib/components/admin](README.md)

## Purpose

List of feature-flag toggles with a batched save — toggling a switch
doesn't write immediately; changes accumulate until "Save" is pressed.

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
