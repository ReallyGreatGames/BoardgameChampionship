# `lib/components/rules/RuleList.tsx`

[← lib/components/rules](README.md)

## Purpose

Searchable list of [`Rule`](../../models/rule.md)s for a game, grouped by
`RuleType` (change/addition/clarification), with admin add/edit/delete.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `RuleList` (component) | `RuleList({ gameId: string, isAdmin: boolean }): JSX` | Renders the searchable, grouped rule list plus the admin add/edit modal and floating add button. |

### Props

| Prop | Type | Meaning |
|---|---|---|
| `gameId` | `string` | The game whose rules are shown; filters `useRuleStore`'s collection. |
| `isAdmin` | `boolean` | When `true`, shows the edit/delete controls on each card and the floating add button; otherwise the list is read-only. |

### Internal functions

| Function | Signature | Behavior |
|---|---|---|
| `handleSave` | `handleSave(data: RuleFormData): Promise<void>` | Called from the modal's `onSave`. If `editingRule` is set, merges `data` into it and calls `update`; otherwise calls `add(data)`. Throws (to let the modal surface an error via its own `Alert`) if the store call reports failure. |
| `handleDelete` | `handleDelete(rule: Rule): Promise<void>` | Confirms deletion via `useDialog().confirm` (destructive styling), then, if confirmed, sets `loadingId` to the rule's `$id` (drives the per-card spinner) and calls `deleteRule`, clearing `loadingId` in a `finally`. |
| `handleEdit` | `handleEdit(rule: Rule): void` | Clones `rule` into `editingRule` state and opens the modal (`setModalVisible(true)`). |
| `handleAdd` | `handleAdd(): void` | Clears `editingRule` (so the modal opens in "add" mode) and opens the modal. |

### Derived values

| Value | Type | Computed as |
|---|---|---|
| `filtered` | `Rule[]` | `collection` filtered to `gameId`, further filtered by a case-insensitive substring match of `search` against `title` or `text` when a query is present. Recomputed on `[collection, gameId, search]`. |
| `grouped` | `Record<RuleType, Rule[]>` | `filtered` bucketed by `type` in `RULE_TYPES` order (change, addition, clarification). Recomputed on `[filtered]`. |
| `isEmpty` | `boolean` | `filtered.length === 0`. |
| `hasAny` | `boolean` | Whether `collection` contains any rule for this `gameId` at all, regardless of the current search — used to distinguish "no search results" from "game has zero rules". |

## How it works

Filters [`useRuleStore`](../../stores/appwrite/rule-store.md)'s collection
to this `gameId` plus a case-insensitive title/text search, then groups
the result by type (`RULE_TYPES` order: change, addition, clarification) —
empty groups are skipped entirely rather than shown with a "no items" placeholder.

Distinguishes two different empty states: `t("noResults")` if a search
query or existing rules produced zero matches, vs. `t("empty")` only when
the game genuinely has no rules at all (`!hasAny`).

Admin actions (edit/delete, plus the floating add button) render only when
`isAdmin` — non-admins see a read-only list.

`loadingId` tracks at most one in-flight delete at a time (by rule `$id`),
swapping that card's edit/delete buttons for a spinner so a second tap
can't be fired while the first delete is still pending.

## Used by

- [`app/(pages)/(user)/rules.tsx`](../../../app/(pages)/(user)/rules.md)

## Related

- [`lib/components/rules/RuleModal.tsx`](RuleModal.md) — the add/edit modal this renders
