# `lib/components/results/StateBadge.tsx`

[← lib/components/results](README.md)

## Purpose

Small badge summarizing a table's result status.

## Props

`{ result: Result | undefined, t: (key: string) => string }`

## How it works

Four mutually exclusive states, checked in order: no result yet
("none") → submitted ("submitted") → has at least one signature but not
submitted ("signed", showing the signature count) → has a result row but
no signatures yet ("saved").

## Used by

- [`lib/components/results/ResultsAdminTab.tsx`](ResultsAdminTab.md)
- [`lib/components/results/TableCard.tsx`](TableCard.md)
