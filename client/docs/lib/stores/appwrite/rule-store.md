# `lib/stores/appwrite/rule-store.ts`

[← lib/stores/appwrite](README.md)

## Purpose

Zustand store for the `rules` collection ([`Rule`](../../models/rule.md)).

## Exports

### `useRuleStore` (zustand hook)

| State/Method | Purpose |
|---|---|
| `collection: Rule[]` | All `Rule` documents |
| `init()` | Loads the collection |
| `add(data)` | Creates a `Rule` |
| `update(item)` | Partial update by `$id` |
| `delete(data)` | Deletes a `Rule` |

### `type PartialRule`

`Partial<Rule> & { $id: string }` — the shape `update`/`delete` expect.

## Used by

- [`lib/components/rules/RuleList.tsx`](../../components/rules/RuleList.md)
- [`lib/components/rules/RuleModal.tsx`](../../components/rules/RuleModal.md)
- [`lib/bootstrap/RealTimeStoreProvider.tsx`](../../bootstrap/RealTimeStoreProvider.md)
