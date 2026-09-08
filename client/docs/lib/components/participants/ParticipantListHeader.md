# `lib/components/participants/ParticipantListHeader.tsx`

[← lib/components/participants](README.md)

## Purpose

The participant directory's header band: a drawer-opening menu button, the
tournament name, the "Participants" title, and the current team count. Like
[`ParticipantHero`](../home/ParticipantHero.md) on the home screen, it
replaces the navigator's own header, which is why it draws its own menu
affordance and its own status-bar padding.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `ParticipantListHeader` (component) | `ParticipantListHeader({ count, onMenuPress }: Props): JSX.Element` | Renders the header band at the top of the participants screen. |

### Props

| Prop | Type | Meaning |
|---|---|---|
| `count` | `number` | Teams currently listed (i.e. matching the search) — shown as the large number, with a pluralized "team"/"teams" label under it |
| `onMenuPress` | `() => void` | Called when the hamburger button is pressed; the screen wires this to opening the navigation drawer |

## How it works

### Colors across schemes

Same treatment as [`ParticipantHero`](../home/ParticipantHero.md): the design
calls for a saturated `primary` band with light text, which only works in the
light and high-contrast palettes. So the three colors are picked from
`isDark` ([`useTheme`](../../bootstrap/ThemeProvider.md)) — dark schemes get
`surface`/`text`/`textSecondary`, light ones `primary`/`onAccent`/`surfaceHigh`.

The hamburger itself is [`MenuButton`](../shell/MenuButton.md), which repeats the same `isDark` switch internally so it can be dropped into any of these bands unchanged.

### Status bar

Top padding is `useSafeAreaInsets().top` plus a small gap, because the screen
is registered with `headerShown: false` and this band is its topmost element.

### Count typography

The count uses the `h2` scale with the `displayExtraBold` family rather than
a token as-is: the design's number is heavier than `h2` (which is
`displaySemi`) but smaller than `bigNumber`, and this keeps it on the type
scale instead of introducing a one-off font size.

## Used by

- [`app/(pages)/(user)/participants.tsx`](../../../app/(pages)/(user)/participants.md)

## Related

- [`lib/components/home/ParticipantHero.tsx`](../home/ParticipantHero.md) — the home screen's equivalent band
- [`lib/components/shell/MenuButton.tsx`](../shell/MenuButton.md) — the shared hamburger button this band renders
