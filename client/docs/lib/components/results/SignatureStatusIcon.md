# `lib/components/results/SignatureStatusIcon.tsx`

[← lib/components/results](README.md)

## Purpose

Tiny per-seat icon summarizing signature status on a [`TableCard`](TableCard.md).

## Props

`{ index: number, sigIds: string[], isSubmitted: boolean }`

## How it works

Four states, purely derived: signed + submitted → green checkmark-circle;
signed + not submitted → plain checkmark; not signed + submitted → red
question-mark-circle (a submitted result missing a signature); not signed +
not submitted → renders nothing.

## Used by

- [`lib/components/results/TableCard.tsx`](TableCard.md)
