---
name: docs-first
description: Use whenever working in this repo's app/ or lib/ folders — before reading source code to understand what a file/component/hook does, check its matching docs/ file first. Also enforces that any code change under app/ or lib/ updates the matching docs/ file in the same change. Trigger on requests like "how does X work", "where is X used", "add/change a feature in app or lib", or any edit to a .ts/.tsx file under app/ or lib/.
---

# Docs-first for this repo

This repo has a full one-to-one code documentation tree under `docs/`,
mirroring `app/` and `lib/`: every `Foo.tsx`/`Foo.ts` has a matching
`docs/<same path>/Foo.md`, plus a `README.md` per folder that indexes it.
`docs/README.md` is the entry point.

## Before reading source code

When you need to understand what a file, component, hook, store, or page
does — or how it connects to the rest of the app — **read its `docs/`
file first**, before opening the source file itself:

1. Look up `docs/<same relative path>/<FileName>.md` (e.g. for
   `lib/hooks/useTimerState.ts`, read `docs/lib/hooks/useTimerState.md`).
2. If you don't yet know which file is relevant, start at `docs/README.md`
   or the nearest folder `README.md` (e.g. `docs/lib/components/README.md`)
   and follow the links.
3. The docs already contain: **Purpose**, **Exports** (types/functions/props),
   **How it works** (non-obvious reasoning, for complex files), **Used by**
   (reverse-dependency list — who else relies on this), and **Related**
   (links to files worth knowing about).
4. Only open the actual source file once the docs don't answer the
   question, or you need to make/verify a specific code change. The docs
   are a fast map; the source is still the ground truth for exact behavior.

This is faster and cheaper than reading source directly, and the "Used by"
section tells you the blast radius of a change before you make it —
something grep alone won't reliably surface (re-exports, dynamic routes,
etc.).

## Level of detail an Exports entry needs

Every export — and every significant internal function/handler/derived
value the doc already narrates — gets:

- **Full signature**: the name, every parameter's name *and* type, and the
  return type (`JSX.Element` for components, `void`/"no return value" for
  side-effect-only functions).
- **Behavior, not a restated type**: one or two sentences on what each
  parameter actually controls and what the function does and returns.
  "`gameId: string` — the game to filter by" is not enough; say what
  filtering it actually performs and what shape comes back.
- **Every property of an exported type/interface**: name, type, and a
  one-line description in domain terms (not "a string" — say what the
  string *is*, e.g. "ISO timestamp of when the bell rang").

Shape the listing to match whichever pattern already dominates that
doc/directory:

- A **component's Props type** → a `| Prop | Type | Meaning |` table.
- A **hook's returned object** → a `| Property | Signature | Meaning |`
  table covering every returned function/value (see
  `docs/lib/hooks/*.md` for the convention).
- A **zustand store** → the existing `### useXStore (zustand hook)`
  subsection with a `| State/Method | Purpose |` table.
- A **simple util module** → the existing `| Export | Signature | Purpose |`
  table.
- Anything with enough nuance to need prose (validation rules, multi-branch
  behavior, an algorithm) → a `### \`functionName(param: Type, ...): ReturnType\``
  subsection with 1-3 sentences underneath, table optional.

## When to add "How it works" prose

Add a short paragraph (or a new subsection, for a whole mechanism) when:
an effect's dependency array or an early-return guard isn't self-evident
from reading it; a `ref` is used instead of `state` (or vice versa) for a
specific reason; a `useMemo`/`useCallback` exists specifically to prevent
identity-churn from re-triggering a subscription/effect; there's a
retry/dedup/race-condition guard; or a `key`-driven remount strategy is
used deliberately (e.g. to reset form state on navigation). Explain *why*
it's built that way and what edge case it's guarding against — not a
line-by-line narration of what's already visible in the code. Skip this
for trivial one-line effects/memos that are self-evident.

## Enrichment is additive, not a rewrite

- Never delete or restructure existing accurate Purpose/How it
  works/Used by content to make room for the above — extend it in place.
- If something existing is stale relative to the current source, fix it,
  but don't reformat sections that are already correct just for style.
- Directory `README.md` files are indexes, not per-file docs — they list
  other files in a table and never get the per-function/per-property
  treatment above. Only touch a `README.md` when a file is added/removed
  (see below); don't try to expand it into per-function detail.

## After changing code

Whenever you add, remove, or change a `.ts`/`.tsx` file under `app/` or
`lib/` in this repo, update its matching `docs/` file **in the same
change** — don't leave it for later or for the user to notice:

- **Changed a function/prop/export's behavior or signature?** Update the
  relevant section in that file's `.md` (Exports table, How it works).
- **Added a new export, prop, or model field?** Add it to the Exports
  table.
- **Added a new file?** Create its `docs/` counterpart (Purpose, Exports,
  How it works if non-trivial, Used by, Related) and add it to the parent
  folder's `README.md` index.
- **Deleted a file?** Delete its `docs/` counterpart and remove it from
  the parent folder's `README.md` index and from any other doc's "Used
  by"/"Related" list that pointed to it.
- **Changed who imports/uses a file?** Update the "Used by" list on the
  file(s) whose consumers changed — this list is a manually-maintained
  reverse-dependency index, not auto-generated, so it drifts if left alone.
- **New comments explaining non-obvious reasoning?** Do not add them to
  `app/`/`lib/` source — put that explanation in the doc's "How it works"
  section instead. This repo deliberately keeps source free of explanatory
  prose comments, with that reasoning captured in `docs/` instead. This
  applies to fixes and small changes too, not just new files — a one-line
  code comment justifying *why* a line changed belongs in the doc, not next
  to the line. Functional directives (`eslint-disable`, `@ts-expect-error`,
  etc.) are fine to keep in code — only explanatory prose comments are
  disallowed.

Keep doc updates proportional to the code change — a one-line bugfix
doesn't need a rewritten "How it works" section, but a behavior change
does.
