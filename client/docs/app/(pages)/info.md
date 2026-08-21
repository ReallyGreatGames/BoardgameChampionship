# `app/(pages)/info.tsx`

[← app](../README.md)

## Route

`/info` — FAQ.

## Purpose

Accordion of frequently-asked questions, sourced entirely from translation
data (`t("faq", { returnObjects: true })` in
[`lib/i18n/translations/`](../../lib/i18n/translations/de.md)) — adding an
FAQ entry only requires a translation change, no code change.

## Exports

| Export | Signature | Purpose |
| --- | --- | --- |
| `InfoScreen` (default) | `(): JSX.Element` | Screen component for `/info`. Loads FAQ entries from `t("faq", { returnObjects: true })`, renders each as a collapsible accordion item, and tracks which one (if any) is expanded. |

### Types

| Type | Fields | Meaning |
| --- | --- | --- |
| `FaqEntry` | `q: string`, `a: string` | One FAQ entry's question and answer text, as shaped by the `info` translation namespace's `faq` array. |

## How it works

`openIndex: number | null` tracks at most one open entry at a time — pressing an item's header sets `openIndex` to its own index, or back to `null` if it was already the open one (`setOpenIndex(openIndex === i ? null : i)`), so opening a new entry implicitly closes any previously-open one.

## Related

- [`lib/i18n/`](../../lib/i18n/README.md)
