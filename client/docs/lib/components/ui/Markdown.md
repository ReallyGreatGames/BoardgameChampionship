# `lib/components/ui/Markdown.tsx`

[← lib/components/ui](README.md)

## Purpose

Themed wrapper around `react-native-markdown-display`, mapping the app's
color/typography tokens onto Markdown's element styles.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `Markdown` | `(props: MarkdownProps): JSX` | Renders `children` through `RNMarkdown` using a themed stylesheet built by `makeMarkdownStyles`. |

### `MarkdownProps`

| Property | Type | Meaning |
|---|---|---|
| `children` | `string` | The raw markdown source to render. |
| `textStyle` | `TextStyle` | Base text style applied to the markdown body (and inherited by inline/block code); its `color`, if set, wins over the theme's default text color. |

## How it works

### `makeMarkdownStyles(colors, textStyle): object`

Not a `StyleSheet.create()` result but a plain style-map object keyed by
the markdown-display element names (`body`, `strong`, `em`, `bullet_list`,
`link`, `code_inline`, `blockquote`, `hr`, etc.) — this is the shape
`react-native-markdown-display` expects for its `style` prop. `base`
(`{ ...textStyle, color: textStyle.color ?? colors.text }`) is reused for
`body`, `code_inline`, `code_block`, and `fence` so inline/block code
inherits the same font size/weight as surrounding text rather than
falling back to the library's default styling. Memoized on
`[colors, textStyle]` since it's rebuilt only when the theme or the
caller's passed-in style changes.

Links open via `Linking.openURL`, swallowing failures silently rather than
throwing (`onLinkPress` always returns `false` to prevent the library's
own default handling from also firing).

## Used by

- [`lib/components/rules/RuleList.tsx`](../rules/RuleList.md)
- [`lib/components/schedule/ScheduleRow.tsx`](../schedule/ScheduleRow.md), [`RunningNowCard.tsx`](../schedule/RunningNowCard.md)
