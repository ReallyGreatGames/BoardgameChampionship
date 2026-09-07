# Boardgame Championship UI kit — how to build with it

A **React Native** kit (rendered on web through react-native-web), not an HTML/CSS
library. Everything below is exported from `window.BoardgameChampionship`.

## 1. Wrap the app in `ThemeProvider`

Every component calls `useTheme()` for its colors. Without the provider they fall
back to a light stub and stop responding to the active scheme, so wrap once at the
root. Add `DialogProvider` too if anything uses `useDialog()`.

```jsx
<ThemeProvider>
  <DialogProvider>
    <View style={{ flex: 1, backgroundColor: colors.background }}>{/* app */}</View>
  </DialogProvider>
</ThemeProvider>
```

`useTheme()` returns `{ scheme, setScheme, isDark, colors }`. `scheme` is one of
`"light" | "dark" | "oled" | "highContrast"`.

## 2. There are NO CSS classes — style via the `style` prop and tokens

Never write `className`. Style with objects (or arrays of them) through `style`,
built from `StyleSheet.create`, and take every value from a token:

| Token | Members |
|---|---|
| `useTheme().colors` | `background` `surface` `surfaceHigh` `border` `borderMuted` `divider` `text` `textSecondary` `textMuted` `textPlaceholder` `primary` `secondary` `accent` `error` `success` `onAccent` |
| `type` (typography; spread it) | `display` `h1` `h2` `h3` `bodyLarge` `body` `bodySmall` `caption` `eyebrow` `button` `bigNumber` |
| `space` (4pt scale, numeric keys) | `1` `2` `3` `4` `5` `6` `8` `10` `12` `16` `20` `24` |
| `inset` (semantic padding) | `screen` `screenTop` `screenTopTall` `screenBottom` `card` `section` `group` `tight` `list` |
| `ui` (radii/misc) | `cardRadius` `sheetRadius` `inputRadius` `buttonRadius` `disabledOpacity` `backdropColor` `breakpointTablet` |

`type.*` entries already carry `fontFamily`/`fontSize`/`lineHeight` — spread them
(`{ ...type.h2, color: colors.text }`) rather than setting font sizes by hand.
Never hard-code a hex; the four palettes are also exported directly (`light`,
`dark`, `oled`, `highContrast`, and `palettes`) but `useTheme().colors` is what UI
code should read. Note the bare `colors` export is the **dark** palette — use the
hook, not that constant.

## 3. Layout primitives ship with the kit

Import `View`, `Text`, `ScrollView`, `Pressable`, `TextInput`, `Image`,
`ActivityIndicator`, `StyleSheet` from the same namespace — do **not** import from
`"react-native"`. Two React Native rules that differ from the web: all text must be
inside a `<Text>` (a bare string in a `<View>` throws), and `View` is already
`display:flex`/`flexDirection:column`.

## 4. Components

`BackButton` `Badge` `BottomSheet` `Button` `ChipGroup` `Combobox` `DataTable`
`DialogProvider` `DirectionPicker` `EmptyState` `FormField` `InfoButton` `Markdown`
`PieChart` `ResizableTextInput` `SearchInput` `SelectPicker`

Read the per-component `<Name>.prompt.md` and `<Name>.d.ts` before using one — they
carry the real prop contract. Fonts (DM Sans + Barlow Condensed) load via
`styles.css` → `fonts/fonts.css`; keep that stylesheet linked or everything falls
back to a system font.

Overlays are controlled: `BottomSheet` needs `visible`; dialogs are opened
imperatively with `const { confirm } = useDialog()`.

## 5. Idiomatic example

```jsx
const { colors } = useTheme();
const styles = StyleSheet.create({
  card: {
    padding: inset.card,
    gap: space[3],
    borderRadius: ui.cardRadius,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { ...type.h3, color: colors.text },
});

<View style={styles.card}>
  <Text style={styles.title}>Round 3 · Table 4</Text>
  <Badge label="In progress" tone="info" />
  <Button label="Start round" icon="play" onPress={startRound} />
</View>
```

Build styles inside the component (they depend on `colors`) and memoize with
`useMemo(() => makeStyles(colors), [colors])` — the pattern every component in this
kit uses. Button/BackButton/ChipGroup icons are Ionicons names.
