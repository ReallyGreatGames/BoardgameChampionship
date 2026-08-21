# `lib/models/rule.ts`

[← lib/models](README.md)

## Purpose

Appwrite document type `Rule` — a rule change/addition/clarification for a game.

## Exports

### `type RuleType`

`"change" | "addition" | "clarification"`

### `type Rule`

| Field | Type | Meaning |
|---|---|---|
| `gameId` | `string` | Game id |
| `type` | `RuleType` | Kind of rule |
| `text` | `string` | Rule body, rendered as Markdown (see [`lib/components/ui/Markdown.tsx`](../components/ui/Markdown.md) usage in `RuleList.tsx`) rather than shown as plain text |
| `title` | `string` | Rule title, shown above `text` and matched against search |

## Used by

- [`lib/components/rules/RuleList.tsx`](../components/rules/RuleList.md)
- [`lib/components/rules/RuleModal.tsx`](../components/rules/RuleModal.md)
- [`lib/stores/appwrite/rule-store.ts`](../stores/appwrite/rule-store.md)
