# `lib/components/ui/Combobox.tsx`

[← lib/components/ui](README.md)

## Purpose

Dropdown select rendered as a centered modal list, with an optional "live"
status dot per option and per selected value.

## Props

`{ value: T, options: ComboboxOption<T>[], onChange: (value: T) => void }`
— `ComboboxOption<T> = { value: T, label: string, isLive?: boolean }`.

## How it works

Nearly identical to [`SelectPicker`](SelectPicker.md), but adds the
`isLive` dot and centers the dropdown as a modal overlay rather than
anchoring it. The two weren't consolidated into one component.

## Used by

- [`lib/components/admin/StatisticsTab.tsx`](../admin/StatisticsTab.md)
- [`lib/components/admin/TournamentSettings.tsx`](../admin/TournamentSettings.md)
- [`lib/components/results/ResultsAdminTab.tsx`](../results/ResultsAdminTab.md)
