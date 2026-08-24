# `lib/components/ui/Dialog.tsx`

[← lib/components/ui](README.md)

## Purpose

App-wide confirm/alert dialog, exposed imperatively via a hook rather than
each screen managing its own modal state.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `DialogProvider` | `(props: PropsWithChildren): JSX` | Context provider mounted once near the app root (see [`BootstrapProvider`](../../bootstrap/BootstrapProvider.md)); renders `children` plus the single shared confirm/alert `Modal` and supplies `confirm` through `DialogContext`. |
| `useDialog` | `(): { confirm: (options: DialogOptions) => Promise<boolean> }` | Reads `DialogContext`. Call `confirm(options)` from anywhere in the tree to show the dialog and await the user's choice. |
| `DialogOptions` | type | Options object accepted by `confirm()`; see property table below. |

### `DialogOptions` properties

| Property | Type | Meaning |
|---|---|---|
| `title` | `string` | Required heading text shown at the top of the dialog card. |
| `message` | `string?` | Optional body text shown below the title. |
| `confirmLabel` | `string?` | Label for the confirm button; falls back to `"OK"` when omitted. |
| `cancelLabel` | `string \| null?` | Label for the cancel button; falls back to `"Cancel"`. Passing `null` (not just omitting it) removes the cancel button entirely. |
| `destructive` | `boolean?` | When `true`, renders the confirm button with `colors.error` instead of `colors.accent` to signal a destructive action. |
| `icon` | `string?` | Optional `Ionicons` icon name rendered above the title. |

## How it works

### `confirm(options: DialogOptions): Promise<boolean>`

Wrapped in `useCallback` with an empty dependency array (its body only calls
setters, which are stable), `confirm` returns a `new Promise<boolean>` and
immediately stores that promise's `resolve` function in `resolveRef`, then
sets `options` state and flips `visible` to `true`. Because the resolver
lives in a ref rather than state, any component in the tree can
`await confirm(...)` and the provider doesn't need to re-render just to
remember how to settle the promise; it resolves later from an unrelated
event handler (`handleConfirm`/`handleCancel`) instead of at call time.

### `handleConfirm(): void` / `handleCancel(): void`

Internal handlers wired to the confirm button, the cancel button, and the
modal's `onRequestClose` (Android back button / swipe-to-dismiss). Both hide
the modal (`setVisible(false)`), call `resolveRef.current` with `true` or
`false` respectively to settle the pending `confirm()` promise, then clear
`resolveRef` to `null` so a stray resolve can't fire twice if the modal is
reopened before the ref is repopulated.

## Used by

Very widely used — [`InfoButton.tsx`](InfoButton.md) wraps it directly, and
`useDialog()`/`confirm()` is called throughout the admin and results UIs
and several hooks ([`useLotteryActions`](../../hooks/useLotteryActions.md),
[`useTableBellActions`](../../hooks/useTableBellActions.md),
[`useTimerState`](../../hooks/useTimerState.md)) wherever a destructive or
confirmable action needs a prompt.
