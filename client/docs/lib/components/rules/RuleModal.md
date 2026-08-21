# `lib/components/rules/RuleModal.tsx`

[← lib/components/rules](README.md)

## Purpose

Add/edit modal for a single [`Rule`](../../models/rule.md).

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `RuleModal` (component) | `RuleModal({ visible, item?, gameId, onClose, onSave }: Props): JSX` | Bottom-sheet add/edit form for a single rule; owns its own title/type/text field state and save-in-flight state. |
| `RuleFormData` | `type RuleFormData = Omit<Rule, keyof Models.Document>` | The shape passed to `onSave` — a `Rule` stripped of Appwrite's `Models.Document` fields (`$id`, `$createdAt`, etc.), i.e. just the editable content. |
| `typeColor` | `typeColor(ruleType: RuleType, colors: ReturnType<typeof useTheme>["colors"]): string` | Maps a `RuleType` to a theme color: `change` → `colors.accent`, `addition` → `colors.success`, `clarification` → `colors.primary`. Re-exported so [`RuleList`](RuleList.md) can color its section headers/card borders consistently with this modal's type chips. |

### Props (`Props`)

| Prop | Type | Meaning |
|---|---|---|
| `visible` | `boolean` | Whether the bottom sheet is shown; also gates the reset effect below. |
| `item` | `Rule \| undefined` | The rule being edited, or `undefined` to add a new one. |
| `gameId` | `string` | The game the new/edited rule belongs to; included in the payload passed to `onSave`. |
| `onClose` | `() => void` | Called to dismiss the sheet, both on explicit cancel and automatically after a successful save. |
| `onSave` | `(data: RuleFormData) => Promise<void>` | Called with the trimmed form data on save; the modal awaits it and shows an `Alert` if it rejects. |

### Internal functions

| Function | Signature | Behavior |
|---|---|---|
| `handleSave` | `handleSave(): Promise<void>` | No-ops if the form is invalid or a save is already in flight. Otherwise sets `saving`, calls `onSave` with `{ gameId, type: selectedType, title: title.trim(), text: text.trim() }`, closes the sheet on success, and on failure shows a native `Alert` with the error message (falling back to "Failed to save.") instead of closing. Always clears `saving` in a `finally`. |

### Derived values

| Value | Type | Computed as |
|---|---|---|
| `isValid` | `boolean` | `title.trim().length > 0 && text.trim().length > 0` — both title and text must be non-blank; gates the save button's `disabled` state. |

## How it works

Form state (`selectedType`, `title`, `text`) is (re)initialized from `item`
(or defaults) whenever the modal opens. Validation just requires
non-empty `title` and `text`. The type picker is a row of 3 chips built
from a local `TYPE_CONFIGS` map (icon + i18n label key per type) — this
map is duplicated in [`RuleList.tsx`](RuleList.md) (for its section
headers) rather than shared, since it's small and specific to each file's own UI.

### Reset effect

The `useEffect` keyed on `[visible, item]` re-seeds `selectedType`/`title`/`text`/`saving`
every time the sheet transitions to visible (and whenever `item` changes while
visible, e.g. switching which rule is being edited without the sheet closing
in between). It exits early when `!visible`, so closing the sheet does not
clear the fields immediately — the fields are only reset on the next open,
which avoids a visible flash of empty inputs during the close animation.

## Used by

- [`lib/components/rules/RuleList.tsx`](RuleList.md)
