# `lib/i18n`

[← lib](../README.md)

App internationalization via [i18next](https://www.i18next.com/) /
`react-i18next`. Supported languages: German (`de`, default) and English (`en`).

## Files

| File | Purpose |
|---|---|
| [i18n.md](i18n.md) | Initializes i18next, loads the stored or system language |
| [translations/de.md](translations/de.md) | German translations |
| [translations/en.md](translations/en.md) | English translations |

## Usage in components

Via the standard `react-i18next` hook: `const { t } = useTranslation(["namespace"])`,
e.g. `useTranslation(["timer"])` in [`useTimerState`](../hooks/useTimerState.md).
The namespace passed in corresponds to the top-level key in
[de.ts](translations/de.md)/[en.ts](translations/en.md) (e.g. `timer`, `results`, `home`).
