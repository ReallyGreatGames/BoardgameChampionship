# `lib/components/results/ScoreSignatureModal.tsx`

[← lib/components/results](README.md)

## Purpose

Full-size viewer for one player's signature SVG, with a two-step
("confirm, then confirm again") reset flow.

## Props

`{ visible, title, modalLoading, modalSvg, confirmingReset, onClose,
onReset, onConfirmReset, onCancelConfirm, t }` — the SVG fetch itself
happens in the caller ([`ResultsAdminTab`](ResultsAdminTab.md)); this
component is purely presentational.

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
