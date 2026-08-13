# `lib/components/results/ScoreNavBar.tsx`

[← lib/components/results](README.md)

## Purpose

Prev/next/jump-to-table navigation bar shown above the per-table input form.

## Props

`{ currentIdx, total, jumpText, onJumpTextChange, onPrev, onNext, onJump, t }`

## How it works

Prev/next buttons disable at the first/last table (`atStart`/`atEnd`). The
jump field submits on the keyboard's "go" action; parsing/validating the
typed table number is the caller's responsibility (`onJump`).

## Used by

- [`lib/components/results/ResultsAdminTab.tsx`](ResultsAdminTab.md)
