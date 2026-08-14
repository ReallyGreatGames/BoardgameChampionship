# `lib/components/ui/Markdown.tsx`

[← lib/components/ui](README.md)

## Purpose

Themed wrapper around `react-native-markdown-display`, mapping the app's
color/typography tokens onto Markdown's element styles.

## Props

`{ children: string, textStyle: TextStyle }`

## How it works

Links open via `Linking.openURL`, swallowing failures silently rather than
throwing (`onLinkPress` always returns `false` to prevent the library's
own default handling from also firing).

## Used by

- [`lib/components/rules/RuleList.tsx`](../rules/RuleList.md)
- [`lib/components/schedule/Schedule.tsx`](../schedule/Schedule.md)
