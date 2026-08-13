# `lib/i18n/translations/de.ts`

[← lib/i18n](../README.md)

## Purpose

German translation strings, exported as a nested object (default export).
No logic — plain data.

## Structure (top-level namespaces)

`adminDashboard`, `home`, `login`, `menu`, `settings`, `game`, `navigation`,
`activeBells`, `rules`, `timer`, `results`, `scoreOverview`, `rankings`,
`statistics`, `tableOverview`, `signature`, `lottery`, `components`, `info`,
`legal`.

Each namespace corresponds to the string passed as
`useTranslation(["namespace"])` in a component. Values may contain i18next
interpolations (e.g. `"Beginnt um {{time}}"`).

**Must stay structurally identical to [en.ts](en.md)** — i18next does not
automatically fall back to the other language for missing keys.

## Used by

- [`lib/i18n/i18n.ts`](../i18n.md) (as `resources.de`)
