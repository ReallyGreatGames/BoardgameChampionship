# `lib/components/game/GameActionRow.tsx`

[← lib/components/game](README.md)

## Purpose

The game page's action strip: a single row of equal-width icon tiles
(lottery, rules, timer, results) with a label underneath and an optional
count badge. Purely presentational — all gating is decided by the caller
and arrives as `disabled`.

## Exports

### `GameAction`

| Property | Type | Meaning |
|---|---|---|
| `key` | `string` | React list key and the caller's identifier for the action |
| `icon` | `React.ComponentProps<typeof Ionicons>["name"]` | Ionicons glyph rendered in the tile |
| `label` | `string` | Already-translated caption under the tile |
| `badgeCount` | `number \| undefined` | Count shown in the accent badge on the tile's top-right corner; nothing is rendered for `undefined`/`0`, and anything above 99 renders as `99+` |
| `disabled` | `boolean` | Dims the tile to `ui.disabledOpacity`, greys the icon, and blocks presses |
| `onPress` | `() => void` | Press handler — already bound to its game/origin by the caller |

### `GameActionRow({ actions }: Props): JSX.Element`

| Prop | Type | Meaning |
|---|---|---|
| `actions` | `GameAction[]` | The actions to render, left to right |

Each tile is `flex: 1`, so the row divides the available width evenly
however many actions are passed.

## Used by

- [`app/(pages)/(user)/game.tsx`](../../../app/(pages)/(user)/game.md)

## Related

- [`lib/feature-flags/useFeatureFlags.ts`](../../feature-flags/useFeatureFlags.md) — one of the inputs the caller uses to compute `disabled`
