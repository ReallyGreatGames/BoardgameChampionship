# `lib/components/rules/RuleList.tsx`

[← lib/components/rules](README.md)

## Purpose

Searchable list of [`Rule`](../../models/rule.md)s for a game, grouped by
`RuleType` (change/addition/clarification), with admin add/edit/delete.

## Props

`{ gameId: string, isAdmin: boolean }`

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

## Used by

- [`app/(pages)/(user)/rules.tsx`](../../../app/(pages)/(user)/rules.md)

## Related

- [`lib/components/rules/RuleModal.tsx`](RuleModal.md) — the add/edit modal this renders
