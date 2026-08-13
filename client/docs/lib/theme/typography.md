# `lib/theme/typography.ts`

[← lib/theme](README.md)

## Purpose

Font-family references and a fixed type scale (modular scale), so no
arbitrary font sizes creep into the code.

## Exports

| Export | Type | Meaning |
|---|---|---|
| `fonts` | `const` object | Font-family names (Barlow Condensed for display/headings, DM Sans for body/UI) — **must** match the keys passed to `useFonts()` in `_layout.tsx` |
| `type` | `const` object | Type scale: `display` (52px), `h1` (40px), `h2` (28px), `h3` (20px), `bodyLarge` (18px), `body` (16px), `bodySmall` (14px), `caption` (12px), `eyebrow` (11px, uppercase), `button` (16px bold), `bigNumber` (56px) — each with `fontFamily`, `fontSize`, `lineHeight`, and optionally `letterSpacing`/`textTransform` |

## Used by

Widely used across nearly all screens and `lib/components/*` files for text
styles. Font registration itself happens in
[`app/_layout.tsx`](../../app/_layout.md) via `useFonts()`.
