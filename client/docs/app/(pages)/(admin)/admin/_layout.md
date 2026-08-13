# `app/(pages)/(admin)/admin/_layout.tsx`

[← app](../../../README.md)

## Purpose

Route guard for everything under `/admin`: redirects to `/login` unless
the current user is both authenticated and an admin. Shows a plain
full-screen spinner while auth is still resolving, and renders nothing
while redirecting.

## How it works

Uses a plain `<Stack screenOptions={{ headerShown: false }} />` as the
actual layout — the admin dashboard
([`admin/index.tsx`](index.md)) provides its own header/tab bar, so
this layer only needs to gate access, not render chrome.

## Registers

- [`app/(pages)/(admin)/admin/index.tsx`](index.md)

## Related

- [`lib/auth.tsx`](../../../../lib/auth.md)
