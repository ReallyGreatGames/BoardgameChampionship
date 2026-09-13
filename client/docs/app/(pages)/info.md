# `app/(pages)/info.tsx`

[← app](../README.md)

## Route

`/info` — FAQ.

## Purpose

Accordion of frequently-asked questions, sourced entirely from translation
data (`t("info:faq", { returnObjects: true })` in
[`lib/i18n/translations/`](../../lib/i18n/translations/de.md)) — adding an
FAQ entry only requires a translation change, no code change. Rendered
under the app's blue hero header
([`GameHeader`](../../lib/components/game/GameHeader.md), title "FAQ",
subtitle = active tournament name) with a
[`BackButton`](../../lib/components/ui/BackButton.md); the navigator's
native header is disabled for this route in
[`app/_layout.tsx`](../_layout.md).

## Exports

| Export | Signature | Purpose |
| --- | --- | --- |
| `InfoScreen` (default) | `(): JSX.Element` | Screen component for `/info`. Loads FAQ entries from `t("info:faq", { returnObjects: true })`, renders the hero header + back button, then each entry as a collapsible accordion item, tracking which one (if any) is expanded. |

### Types

| Type | Fields | Meaning |
| --- | --- | --- |
| `FaqEntry` | `q: string`, `a: string` | One FAQ entry's question and answer text, as shaped by the `info` translation namespace's `faq` array. |

### `makeStyles(colors: ReturnType<typeof useTheme>["colors"]): StyleSheet`

Builds container/back-button/scroll/item/header/answer styles from theme colors; memoized on `colors`.

## How it works

`openIndex: number | null` tracks at most one open entry at a time — pressing an item's header sets `openIndex` to its own index, or back to `null` if it was already the open one, so opening a new entry implicitly closes any previously-open one. Each header is an `accessibilityRole="button"` with `accessibilityState.expanded` so screen readers announce the open/closed state.

The back button pops the recorded origin via [`goBackTo("/")`](../../lib/utils/navigation.md).

## Related

- [`lib/components/game/GameHeader.tsx`](../../lib/components/game/GameHeader.md)
- [`lib/i18n/`](../../lib/i18n/README.md)
