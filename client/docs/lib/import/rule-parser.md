# `lib/import/rule-parser.ts`

[← lib/import](README.md)

## Purpose

Parses rule-clarification text as published on tournament websites (English
or German, mixed within one paste) into structured entries ready to become
[`Rule`](../models/rule.md) rows. Pure, synchronous, no Appwrite access.

## Exports

| Export | Type | Meaning |
|---|---|---|
| `parseRulesText(raw: string): ParsedRule[]` | Function | Parses one game's pasted clarification text into rule entries |
| `ParsedRule` | Type | `{ title, type, text }` |
| `GENERAL_RULE_TITLE` | `"General"` | Title used for the synthetic entry built from unlabeled leading text |

### `parseRulesText(raw: string): ParsedRule[]`

| Parameter | Type | Description |
|---|---|---|
| `raw` | `string` | The pasted clarification text for a single game, as typed/pasted into [`ImportRules`](../components/admin/ImportRules.md)'s paste box |

Splits `raw` into lines, finds every line that starts a new labeled entry
(see "Entry-start detection" below), and treats everything between one
entry-start and the next as that entry's body. Text before the first
labeled entry is handled specially (see "Preamble handling"). Never
throws — text that doesn't match the known label vocabulary at all simply
produces no entries for that portion, left for the admin to notice and
fix in the editable preview.

### `ParsedRule`

| Property | Type | Description |
|---|---|---|
| `title` | `string` | The quoted section reference from the source (e.g. `"Setup – 1"`), or `GENERAL_RULE_TITLE` for the preamble entry |
| `type` | `RuleType` (`"change" \| "addition" \| "clarification"`, from [`lib/models/rule.ts`](../models/rule.md)) | Derived from which label matched — see "Label vocabulary" below |
| `text` | `string` | The entry's body, reflowed into markdown (see "Body formatting") |

## How it works

### Label vocabulary

A fixed list of English and German lead-in phrases, each mapped to a
`RuleType`, sorted longest-first so a more specific phrase (e.g. the rare
combined `"Erläuterung Änderung zu"`) is tried before a shorter one it
contains (`"Erläuterung zu"`/`"Änderung zu"`):

| Phrase(s) | `RuleType` |
|---|---|
| `Change to`, `Änderung zu`, `Erläuterung Änderung zu` | `change` |
| `Addition to`, `Ergänzung zu` | `addition` |
| `Ruling for`, `Clarification for`, `Erläuterung zu`, `Festlegung zu`, `Klarstellung zu`, `Erinnerung zu` | `clarification` |

The app's `Rule` model only has 3 types, so labels without a clean
equivalent (`Ruling for`, German `Festlegung zu`/`Erinnerung zu`) are
deliberately folded into `clarification` rather than extending the model —
a decision made with the app's admin, not inferred.

### Entry-start detection

A trimmed line starts a new entry when it begins with one of the label
phrases above, followed by a quoted section reference and a colon. Quotes
are matched as one of three pairs — German „…“, English curly “…”, or
straight "…" — using a non-greedy match up to the **first** occurrence of
`close-quote + colon`, so a body that happens to contain more of that quote
character afterward doesn't truncate the title early. The label vocabulary
is checked independently of quote style, since real source text mixes them
(e.g. an English `"Ruling for"` label paired with German „…“ quotes in the
same paste).

### Body formatting

Lines between one entry-start and the next are grouped into "runs"
separated by blank lines, then each run is reflowed by `formatRun`:

- A run where every line already starts with an explicit bullet marker
  (`-`, `•`, `◦`, `*`, or `1.`/`1)`) becomes a markdown bullet list, with
  4+ spaces of original indentation promoting an item to a nested `  - `.
- A multi-line run with **uniform non-zero indentation** (the common case
  for a source `<ul>` flattened to plain text with no bullet character at
  all — indentation is the only remaining signal) is also treated as a
  bullet list, one item per line.
- A multi-line run with uniform **zero** indentation is left as one
  wrapped paragraph (lines joined by a single `\n`, which markdown renders
  as a soft break/space — matches source text that's just word-wrapped).
- A run where the first line is shallower than every line after it is
  treated as an intro line followed by its own bullet list.
- Anything else falls back to one line per source line, trimmed but
  unbulleted — a safe degraded output the admin can hand-fix in the
  editable preview rather than the parser guessing wrong silently.

This is a heuristic, not a full HTML-list reconstruction — nested lists
deeper than 2 levels, or a single list item that itself contains a
sub-heading plus explanation (seen in one real sample), don't round-trip
perfectly. That's an accepted tradeoff given the parsed result is always
reviewed/editable before it's written, not written directly.

### Preamble handling

Text before the first labeled entry is handled in two steps:

1. If the very first non-empty line looks like a bare game-name heading
   (under 60 chars, no colon, doesn't end in `.`/`!`/`?`) it's dropped
   silently — the admin already picked the game from a dropdown, so
   pasting the source page's own title line shouldn't become a rule.
2. Any remaining unlabeled text becomes one synthetic entry:
   `title: GENERAL_RULE_TITLE, type: "clarification"`, body formatted the
   same way as any other entry's body. This is how a source page's
   introductory sentence (e.g. "the clarifications in the appendix also
   apply") ends up captured rather than silently dropped.

## Used by

- [`lib/components/admin/ImportRules.tsx`](../components/admin/ImportRules.md)
- [`lib/import/rule-import-service.ts`](rule-import-service.md)

## Related

- [`lib/models/rule.ts`](../models/rule.md) — the `RuleType`/`Rule` shape this parser targets
