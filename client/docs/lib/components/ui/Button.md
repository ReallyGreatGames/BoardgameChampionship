# `lib/components/ui/Button.tsx`

[← lib/components/ui](README.md)

## Purpose

The app's standard pressable button: four variants, an optional leading
icon, and a loading state that swaps the content for a spinner.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `Button` | `(props: Props): JSX` | Renders a themed `Pressable` with icon + label (or a spinner while loading). |

### Props

| Property | Type | Meaning |
|---|---|---|
| `label` | `string` | Button text. |
| `onPress` | `() => void` | Press handler; not called while `disabled` or `loading`. |
| `variant` | `"primary" \| "secondary" \| "ghost" \| "danger"?` | Visual weight — filled accent, outlined surface, transparent, or filled error. Defaults to `primary`. |
| `icon` | `Ionicons` glyph name (optional) | Icon rendered before the label, in the label's color. |
| `disabled` | `boolean?` | Blocks presses and dims the button. Defaults to `false`. |
| `loading` | `boolean?` | Blocks presses and replaces icon+label with an `ActivityIndicator`. Defaults to `false`. |
| `style` | `StyleProp<ViewStyle>?` | Extra style merged last onto the container (e.g. `flex: 1` in a button row). |

### `makeStyles(colors: ReturnType<typeof useTheme>["colors"]): StyleSheet`

Builds the base button style plus one style per variant from theme colors;
memoized via `useMemo` on `colors`.

## How it works

The foreground color is derived from the variant (`onAccent` on the two
filled variants, `text` on the two flat ones) and passed to the icon, the
label, and the spinner alike, so all three stay legible on whichever
background the variant paints.

`minHeight: 44` keeps every button at the platform minimum touch target
regardless of label length, and `accessibilityState` reports the disabled
and busy flags so screen readers announce a loading button as busy rather
than as an ordinary button that does nothing.

## Used by

- [`lib/components/home/NowPlayingCard.tsx`](../home/NowPlayingCard.md)
- [`app/(pages)/(user)/signature.tsx`](../../../app/(pages)/(user)/signature.md) — Clear/Confirm actions
