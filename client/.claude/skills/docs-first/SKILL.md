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
