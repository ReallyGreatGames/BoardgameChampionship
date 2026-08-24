# `app/(pages)/(user)/rules.tsx`

[← app](../../README.md)

## Route

`/rules?gameId=...`

## Purpose

Thin screen wrapper: back button + [`RuleList`](../../../lib/components/rules/RuleList.md).

## Exports

| Export | Signature | Purpose |
| --- | --- | --- |
| `RulesPage` (default) | `(): JSX.Element \| null` | Screen component for `/rules?gameId=...`. Reads `gameId` from the URL, gates on `useRequireAuth()`, and renders a `BackButton` plus `RuleList` scoped to that game. Returns `null` while auth is loading or the user is unauthenticated. |

### `handleBack(): void`

Navigates back: if `gameId` is present, replaces the route with `/game?gameId=${gameId}` to return to that game's detail screen; otherwise replaces with `/` (home). Used as the `onPress` handler for `BackButton`.

### `makeStyles(colors: ReturnType<typeof useTheme>["colors"]): StyleSheet`

Builds `backButton`, `container`, `header`, and `title` styles from theme colors; memoized on `colors` via `useMemo`.

## Related

- [`lib/components/rules/RuleList.tsx`](../../../lib/components/rules/RuleList.md)
