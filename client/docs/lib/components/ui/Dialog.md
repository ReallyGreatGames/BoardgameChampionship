# `lib/components/ui/Dialog.tsx`

[← lib/components/ui](README.md)

## Purpose

App-wide confirm/alert dialog, exposed imperatively via a hook rather than
each screen managing its own modal state.

## Exports

| Export | Purpose |
|---|---|
| `DialogProvider` (component) | Mounted once near the app root (see [`BootstrapProvider`](../../bootstrap/BootstrapProvider.md)) |
| `useDialog()` | Returns `{ confirm(options: DialogOptions): Promise<boolean> }` |
| `DialogOptions` | `{ title, message?, confirmLabel?, cancelLabel?, destructive?, icon? }` |

## How it works

`confirm(options)` returns a `Promise<boolean>` that resolves when the user
taps confirm (`true`) or cancel (`false`); internally it stores the
promise's `resolve` in a ref and shows the modal, so any component in the
tree can `await confirm(...)` instead of wiring up its own modal
visibility state. Passing `cancelLabel: null` hides the cancel button
entirely, turning it into a plain info/alert dialog with only an OK button.
`destructive: true` renders the confirm button in the error color.

## Used by

Very widely used — [`InfoButton.tsx`](InfoButton.md) wraps it directly, and
`useDialog()`/`confirm()` is called throughout the admin and results UIs
and several hooks ([`useLotteryActions`](../../hooks/useLotteryActions.md),
[`useTableBellActions`](../../hooks/useTableBellActions.md),
[`useTimerState`](../../hooks/useTimerState.md)) wherever a destructive or
confirmable action needs a prompt.
