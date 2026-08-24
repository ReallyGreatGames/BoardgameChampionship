# `lib/components/results/ScoreSignatureModal.tsx`

[← lib/components/results](README.md)

## Purpose

Full-size viewer for one player's signature SVG, with a two-step
("confirm, then confirm again") reset flow.

## Exports

### `ScoreSignatureModal(props: Props): JSX.Element`

The SVG fetch itself happens in the caller
([`ResultsAdminTab`](ResultsAdminTab.md)); this component is purely
presentational.

| Prop | Type | Meaning |
|---|---|---|
| `visible` | `boolean` | Whether the modal is shown. |
| `title` | `string` | Header text (e.g. the player's name). |
| `modalLoading` | `boolean` | Shows the loading spinner instead of the SVG/error icon while `true`. |
| `modalSvg` | `string \| null` | The signature SVG markup to render, or `null` if none loaded. |
| `confirmingReset` | `boolean` | Switches the footer between the normal cancel/reset buttons and the "are you sure" second-step confirmation. |
| `onClose` | `() => void` | Called on backdrop tap or the first-step Cancel button. |
| `onReset` | `() => void` | Called by the second-step Reset button (the one shown when `confirmingReset` is `true`) — actually performs the reset. |
| `onConfirmReset` | `() => void` | Called by the first-step Reset button — advances to the confirmation step rather than resetting immediately. |
| `onCancelConfirm` | `() => void` | Called by the second-step Cancel button — backs out of the confirmation step without resetting. |
| `t` | `(key: string) => string` | Translation function, passed down rather than calling `useTranslation` internally. |

## How it works

Renders one of three states in the signature box: a loading spinner, the
SVG (via `SvgXml`, passed through [`injectViewBox`](../../utils.md) since
signatures saved by the signature screen lack a `viewBox`), or an error
icon if no SVG could be loaded. `confirmingReset` toggles between the
normal two-button footer (cancel/reset) and an extra confirmation message
+ buttons — resetting a signature is destructive enough to warrant the
second step.

## Used by

- [`lib/components/results/ResultsAdminTab.tsx`](ResultsAdminTab.md)
