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
contains (`"Erläuterung zu"`/`"Änderung zu"`). Matching is
case-insensitive, and the phrase must be followed by whitespace or the end
of the line, so `"Changes to"` is never matched as `"Change"` + junk:

| Phrase(s) | `RuleType` |
|---|---|
| `Ruling for`, `Ruling on`, `Rulings for`, `Festlegung zu`, `Festlegung für`, `Change to`, `Change of`, `Changes to`, `Correction to`, `Änderung zu`, `Änderung an`, `Änderungen zu`, `Korrektur zu`, `Erläuterung Änderung zu` | `change` |
| `Addition to`, `Additions to`, `Ergänzung zu`, `Ergänzungen zu` | `addition` |
| `Clarification for`, `Clarification on`, `Clarification of`, `Clarifications for`, `Clarifications on`, `Note for`, `Note on`, `Reminder for`, `Reminder on`, `Erläuterung zu`, `Erläuterung für`, `Klarstellung zu`, `Erinnerung zu`, `Hinweis zu`, `Anmerkung zu` | `clarification` |

The `on`/`of` variants matter in practice: one real source page mixes
`Clarification for …` and `Clarification on …` in the same paste, and an
unrecognised label silently swallows that entry's whole body into the
preceding rule.

The app's `Rule` model only has 3 types, so labels without a one-to-one
equivalent are folded into the closest one rather than extending the model.
Where they land was decided with the app's admin, not inferred:

- `Ruling for` / German `Festlegung zu` → `change`, not `clarification`. A
  tournament ruling picks or overrides something the printed rulebook leaves
  open (which scenario, which starting money, which map), so it changes the
  rules as played rather than explaining them.
- `Reminder for` / German `Erinnerung zu` → `clarification`, since a
  reminder restates existing rules without altering them.

### Entry-start detection

A trimmed line starts a new entry when it begins with one of the label
phrases above, followed by a section reference and a colon. The reference
is parsed leniently, because real source text is far messier than
`Label "Title": body`:

1. The first quote-ish character (`„ “ ” " « »`) in the remainder opens the
   quoted reference. Whatever precedes it is kept as a **prefix**
   (`Clarification for Scenario Sheet „Mission 6: Star Search“:` →
   `Scenario Sheet Mission 6: Star Search`).
2. Every later quote-ish character is tried as the closing quote, in order,
   and the first one that is followed by `up-to-80 non-colon characters +
   colon` wins. That trailing part is kept as a **suffix**, which is what
   makes the very common parenthetical form work
   (`Ruling for “Setup – 1” (Landscape Player Board):` →
   `Setup – 1 (Landscape Player Board)`).
3. Open and close quote characters are **not** required to pair up. Source
   pages regularly mistype `“Climate Protection“` (two opening quotes) or
   mix an English label with German „…“ quotes; requiring a matching pair
   dropped those entries entirely.
4. Because the close-quote scan stops at the *first* candidate followed by
   a colon, a title containing a colon (`„PHASE 2: ACTIVATION“`) still
   works, and a body that later contains quotes and colons doesn't extend
   the title.
5. If no quote character appears at all, the line still parses as
   `Label Title: body` using the text up to the first colon (max 80 chars)
   as the title.

The title is assembled as `prefix + quoted + suffix`, joined with single
spaces and trimmed.

The lenient form is deliberate: a missed entry-start is not a dropped
entry, it is a **silently merged** one — the unrecognised line and its body
become part of the previous rule's text, which is the failure mode that
originally motivated this parsing (most visibly on the Kavango source,
where 12 of 13 entries collapsed into 6).

### Body formatting

Lines between one entry-start and the next are grouped into "runs"
separated by blank lines, then each run is reflowed by `formatRun`:

- A run where every line already starts with an explicit bullet marker
  (`-`, `•`, `◦`, `*`, or `1.`/`1)`) becomes a markdown bullet list, with
  4+ spaces of original indentation promoting an item to a nested `  - `.
- A multi-line run with **uniform non-zero indentation** (the common case
  for a source `<ul>` flattened to plain text with no bullet character at
  all — indentation is the only remaining signal) is also treated as a
  bullet list, one item per line. Within such a run, a line ending in `:`
  absorbs the line(s) after it as an indented continuation of the same
  bullet instead of starting a sibling bullet — this is the flattened
  "sub-heading + explanation" list item (`„Occupy 4 contiguous coastline
  spaces“:` followed by its explanation).
- A multi-line run with uniform **zero** indentation is left as one
  wrapped paragraph (lines joined by a single `\n`, which markdown renders
  as a soft break/space — matches source text that's just word-wrapped).
- A run where the first line is shallower than every line after it is
  treated as an intro line followed by its own bullet list.
- Anything else falls back to one line per source line, trimmed but
  unbulleted — a safe degraded output the admin can hand-fix in the
  editable preview rather than the parser guessing wrong silently.

This is a heuristic, not a full HTML-list reconstruction — nested lists
deeper than 2 levels don't round-trip perfectly. That's an accepted tradeoff given the parsed result is always
reviewed/editable before it's written, not written directly.

### Preamble handling

Text before the first labeled entry is handled in three steps:

1. Horizontal-rule separator lines (`---`, `===`, …) are dropped, so a
   paste that still carries the divider between two games doesn't turn the
   divider into rule text.
2. If the very first non-empty line looks like a bare game-name heading it's
   dropped silently — the admin already picked the game from a dropdown, so
   pasting the source page's own title line shouldn't become a rule. A line
   counts as a heading when it is under 60 chars, at most 8 words, doesn't
   end in `.`/`!`/`?`/`;`/`,`/`:` and isn't itself a labeled entry. A colon
   *inside* the line is allowed, so a subtitled game name
   (`Endeavor: Deep Sea`) is recognised as a heading; a line ending in a
   colon is not, since that introduces a list rather than naming the game.
3. Any remaining unlabeled text becomes one synthetic entry:
   `title: GENERAL_RULE_TITLE, type: "clarification"`, body formatted the
   same way as any other entry's body. This is how a source page's
   introductory sentence (e.g. "the clarifications in the appendix also
   apply") ends up captured rather than silently dropped.

## Used by

- [`lib/components/admin/ImportRules.tsx`](../components/admin/ImportRules.md)
- [`lib/import/rule-import-service.ts`](rule-import-service.md)

## Related

- [`lib/models/rule.ts`](../models/rule.md) — the `RuleType`/`Rule` shape this parser targets
