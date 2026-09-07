# `lib/components/shell/MenuButton.tsx`

[← lib/components/shell](README.md)

## Purpose

The drawer-opening hamburger button used in every screen hero — three
stacked bars (the third shorter and muted) with the "Menü" caption beside
it. Extracted so the home, participants and game headers share one
button instead of three copies of the same styles.

## Exports

### `MenuButton({ onPress }: Props): JSX.Element`

| Prop | Type | Meaning |
|---|---|---|
| `onPress` | `() => void` | Press handler — every caller dispatches `DrawerActions.openDrawer()` |

The visible caption and the accessibility label are both `home:openMenu`.

## How it works

The button's colors are derived inside the component, not passed in: every
hero that hosts it paints `colors.primary` in light schemes and
`colors.surface` in dark ones, so the bars use `colors.onAccent`/
`colors.text` and the short bar plus caption use `colors.surfaceHigh`/
`colors.textSecondary` on the same `isDark` switch. Dropping it into a
differently-colored surface would need that decision lifted into a prop.

The 44×44 tap target is deliberate — it is the minimum touch size, and the
bars themselves (20×2) are far smaller than it.

## Used by

- [`lib/components/home/ParticipantHero.tsx`](../home/ParticipantHero.md)
- [`lib/components/participants/ParticipantListHeader.tsx`](../participants/ParticipantListHeader.md)
- [`lib/components/game/GameHeader.tsx`](../game/GameHeader.md)

## Related

- [`AppDrawer.tsx`](AppDrawer.md) — the drawer this button opens
