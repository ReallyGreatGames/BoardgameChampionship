# `lib/components/rules/RuleModal.tsx`

[← lib/components/rules](README.md)

## Purpose

Add/edit modal for a single [`Rule`](../../models/rule.md).

## Exports

| Export | Purpose |
|---|---|
| `RuleModal` (component) | Props: `{ visible, item?, gameId, onClose, onSave }` |
| `RuleFormData` | `Omit<Rule, keyof Models.Document>` — the shape passed to `onSave` |
| `typeColor(ruleType, colors)` | Maps a `RuleType` to a theme color (change→accent, addition→success, clarification→primary) — re-exported so [`RuleList`](RuleList.md) can color its section headers/card borders consistently |

## How it works

Form state (`selectedType`, `title`, `text`) is (re)initialized from `item`
(or defaults) whenever the modal opens. Validation just requires
non-empty `title` and `text`. The type picker is a row of 3 chips built
from a local `TYPE_CONFIGS` map (icon + i18n label key per type) — this
map is duplicated in [`RuleList.tsx`](RuleList.md) (for its section
headers) rather than shared, since it's small and specific to each file's own UI.

## Used by

- [`lib/components/rules/RuleList.tsx`](RuleList.md)
