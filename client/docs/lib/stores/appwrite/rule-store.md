# `lib/stores/appwrite/rule-store.ts`

[← lib/stores/appwrite](README.md)

## Purpose

Zustand store for the `rules` collection ([`Rule`](../../models/rule.md)).

## Exports

### `useRuleStore` (zustand hook)

| State/Method | Purpose |
|---|---|
| `collection: Rule[]` | All `Rule` documents |
| `init(): Promise<void>` | `fetchCollection(key, set)` — loads the full `rules` collection with no query filter |
| `add(data: Omit<Rule, keyof Models.Document>): Promise<Rule \| null>` | Creates a `Rule` via `addToCollection(key, data)` with an auto-generated (`ID.unique()`) id; returns the created document or `null` (with an `Alert`) on failure |
| `update(item: PartialRule): Promise<boolean>` | `updateInCollection(key, item)` — partial update by `item.$id`; returns whether the update succeeded |
| `delete(data: PartialRule): Promise<boolean>` | `removeFromCollection(key, data)` — deletes the `Rule` by `data.$id`; returns whether the delete succeeded |

### `type PartialRule`

`Partial<Rule> & { $id: string }` — the shape `update`/`delete` expect.

## Used by

- [`lib/components/rules/RuleList.tsx`](../../components/rules/RuleList.md)
- [`lib/components/rules/RuleModal.tsx`](../../components/rules/RuleModal.md)
- [`lib/bootstrap/RealTimeStoreProvider.tsx`](../../bootstrap/RealTimeStoreProvider.md)
