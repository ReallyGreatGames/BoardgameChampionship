# `lib/stores`

[← lib](../README.md)

Data layer of the app: [zustand](https://github.com/pmndrs/zustand) stores
that mirror Appwrite collections/buckets into memory and stay live via
Appwrite realtime.

## Files

| File | Purpose |
|---|---|
| [real-time-store.md](real-time-store.md) | Shared realtime/CRUD engine every store below is built on |
| [appwrite/](appwrite/README.md) | One store per Appwrite collection/bucket |

## Architecture

There is exactly one shared piece of infrastructure
([`real-time-store.ts`](real-time-store.md)) and many thin,
collection-specific stores under [`lib/stores/appwrite/`](appwrite/README.md)
that each plug their own document type and collection id into it. All of
this is orchestrated from a single place:
[`RealTimeStoreProvider`](../bootstrap/RealTimeStoreProvider.md), which calls
every store's `init()` and groups their realtime subscriptions into tiers.
