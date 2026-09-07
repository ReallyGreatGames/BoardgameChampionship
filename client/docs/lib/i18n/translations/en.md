# `lib/i18n/translations/en.ts`

[← lib/i18n](../README.md)

## Purpose

English translation strings, structurally mirroring [de.ts](de.md) — same
top-level namespace keys, same nesting, same interpolation placeholders
(e.g. `{{time}}`), just English values. Plain data, no logic.

## Structure (top-level namespaces)

`adminDashboard`, `importTab`, `home`, `login`, `menu`, `settings`, `game`,
`participants`, `navigation`, `activeBells`, `rules`, `timer`, `results`, `scoreOverview`,
`rankings`, `statistics`, `tableOverview`, `signature`, `lottery`,
`lotteryOptions`, `components`, `info`, `legal`.

See [de.md](de.md#structure-top-level-namespaces) for the full table of
what each namespace contains and which screen/component uses it — the
breakdown applies identically here, only the string values differ. The one
namespace worth calling out specifically: `info.faq` is an array of
`{ q: string; a: string }` pairs (FAQ question/answer text for the FAQ
screen), not a flat string map like every other namespace.

**Must stay structurally identical to [de.ts](de.md)** — i18next does not
automatically fall back to the other language for missing keys, so a key
present in one file and missing in the other renders as blank/missing text
in that language.

## Used by

- [`lib/i18n/i18n.ts`](../i18n.md) (as `resources.en`)
