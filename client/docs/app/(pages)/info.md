# `app/(pages)/info.tsx`

[← app](../README.md)

## Route

`/info` — FAQ.

## Purpose

Accordion of frequently-asked questions, sourced entirely from translation
data (`t("faq", { returnObjects: true })` in
[`lib/i18n/translations/`](../../lib/i18n/translations/de.md)) — adding an
FAQ entry only requires a translation change, no code change.

## How it works

`openIndex: number | null` tracks at most one open entry at a time.

## Related

- [`lib/i18n/`](../../lib/i18n/README.md)
