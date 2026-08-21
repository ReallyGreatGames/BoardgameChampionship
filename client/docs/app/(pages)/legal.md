# `app/(pages)/legal.tsx`

[← app](../README.md)

## Route

`/legal` — imprint & privacy notice.

## Purpose

Static legal text, entirely sourced from translations (`legal:imprint.*`,
`legal:privacy.*`). No logic beyond rendering.

## Exports

| Export | Signature | Purpose |
| --- | --- | --- |
| `LegalScreen` (default) | `(): JSX.Element` | Screen component for `/legal`. Renders two sections (imprint, privacy) as a scrollable view, with all copy pulled from the `legal` i18n namespace via `useTranslation(["legal"])`. |

### Styles

`useMemo` (keyed on `colors`) builds `container`, `content`, `section`, `sectionTitle`, and `paragraph` styles — theming applies only to colors; layout (padding, gaps, line-height) is static.

## Related

- [`lib/i18n/`](../../lib/i18n/README.md)
