# `app/(pages)/legal.tsx`

[← app](../README.md)

## Route

`/legal` — imprint & privacy notice.

## Purpose

Static legal text, entirely sourced from translations (`legal:imprint.*`,
`legal:privacy.*`), rendered as two labelled section cards under the app's
blue hero header ([`GameHeader`](../../lib/components/game/GameHeader.md),
title "Impressum & Datenschutz", subtitle = active tournament name) with a
[`BackButton`](../../lib/components/ui/BackButton.md). The navigator's
native header is disabled for this route in
[`app/_layout.tsx`](../_layout.md).

## Exports

| Export | Signature | Purpose |
| --- | --- | --- |
| `LegalScreen` (default) | `(): JSX.Element` | Screen component for `/legal`. Renders hero header + back button, then imprint and privacy as eyebrow label + card, all copy from the `legal` i18n namespace. |

### `makeStyles(colors: ReturnType<typeof useTheme>["colors"]): StyleSheet`

Builds container/back-button/scroll/section/card/paragraph styles from theme colors; memoized on `colors`.

## How it works

The back button pops the recorded origin via
[`goBackTo("/settings")`](../../lib/utils/navigation.md) —
[`settings.tsx`](settings.md) opens this screen with `goTo("/settings", …)`
so the origin is recorded; the fallback also lands on settings.

## Related

- [`app/(pages)/settings.tsx`](settings.md) — the only entry point
- [`lib/components/game/GameHeader.tsx`](../../lib/components/game/GameHeader.md)
- [`lib/i18n/`](../../lib/i18n/README.md)
