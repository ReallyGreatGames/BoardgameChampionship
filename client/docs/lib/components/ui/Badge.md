# `lib/components/ui/Badge.tsx`

[← lib/components/ui](README.md)

## Purpose

Small status pill — a short label in a tinted, outlined chip, used to mark
state ("Live", "Overtime") next to a title.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `Badge` | `(props: Props): JSX` | Renders `label` in caption-size bold text, tinted by `tone`. |

### Props

| Property | Type | Meaning |
|---|---|---|
| `label` | `string` | The text shown inside the pill. |
| `tone` | `"neutral" \| "info" \| "success" \| "warning" \| "danger"?` | Which semantic color the pill takes; defaults to `neutral`. |

## How it works

The tone maps to a single theme color (`textSecondary`, `primary`,
`success`, a fixed amber for `warning`, `error`), which is then used at
three strengths: full for the text, `18` alpha for the fill, `66` alpha
for the border — so one token produces a legible chip in every palette
without a per-tone background token existing.

The pill is `alignSelf: "flex-start"`, so it hugs its label instead of
stretching to the width of whatever row it sits in.

## Used by

- [`app/(pages)/(user)/game.tsx`](../../../app/(pages)/(user)/game.md) — the game-state badge in the header row
- [`app/(pages)/(user)/results.tsx`](../../../app/(pages)/(user)/results.md) — the entry-status badge (`entryOpen`/`submitted`)
- [`lib/components/home/NowPlayingCard.tsx`](../home/NowPlayingCard.md)

## Related

- [`lib/components/results/StateBadge.tsx`](../results/StateBadge.md) — the results-specific badge, not built on this one
