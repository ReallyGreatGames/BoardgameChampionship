# `lib/components/shell/AppDrawer.tsx`

[← lib/components/shell](README.md)

## Purpose

Content of the app's navigation drawer (`@react-navigation/drawer`):
header, role-gated nav entries, and a footer with settings/login-logout.

## Props

`DrawerContentComponentProps` (from `@react-navigation/drawer` — passed
through to `DrawerContentScrollView`).

## How it works

Each nav entry declares a `scope`: `"public"` (always shown), `"private"`
(shown once `isPinVerified || isAdmin`), or `"admin"` (admin only) — see
[`useAuth`](../../auth.md). The "active bells" entry shows a badge with
the count of unacknowledged [`TableBell`](../../models/table-bell.md)s,
but only for admins (`isAdmin ? activeBellCount : undefined`).

`DrawerHeader` and `DrawerFooter` are local, unexported helpers — the
footer's auth button logs out (if signed in) or navigates to login (if not).

## Used by

- [`app/_layout.tsx`](../../../app/_layout.md)
