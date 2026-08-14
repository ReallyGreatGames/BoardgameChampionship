# `lib/theme/spacing.ts`

[← lib/theme](README.md)

## Purpose

4pt spacing scale for React Native plus semantic aliases, so components
never use raw pixel numbers.

## Exports

| Export | Type | Meaning |
|---|---|---|
| `space` | `const` object | Raw scale `1..24` → `4..96` px (4pt steps) |
| `inset` | `const` object | Semantic aliases onto `space` values: `screen` (32), `screenTop` (64), `screenTopTall` (80), `screenBottom` (48), `card` (16), `section` (48), `group` (32), `tight` (8), `list` (12) |

## Used by

Widely used across nearly all screens (`app/(pages)/...`) and most
`lib/components/*` files for padding/margin/gap. No central consumption
point — imported directly at the point of use.
