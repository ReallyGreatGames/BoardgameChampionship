import { Alert } from "react-native";
import {
  ID,
  Models,
  Query,
  RealtimeResponseEvent,
} from "react-native-appwrite";
import { client, DATABASE_ID, tablesDB } from "../appwrite";

export type Key = string;
export type Set<
  T extends Models.Document,
  S extends RealtimeCollectionStore<T> = RealtimeCollectionStore<T>,
> = (
  partialState: Partial<S> | ((state: S) => Partial<S> | S),
  ...args: any[]
) => void;

/** Loosely typed on purpose — each store's concrete `set` is typed against its own state shape, which isn't structurally assignable to a shared field type without variance issues. */
export type RealtimeSetter = (partialState: any) => void;

/** Minimal shape the realtime dedupe/merge logic actually needs — satisfied by both Models.Document and Models.File. */
export type RealtimeEntity = {
  $id: string;
  $updatedAt?: string;
  $createdAt?: string;
};

export interface RealtimeCollectionStore<T extends RealtimeEntity> {
  collection: T[];
  key: Key;
  /** Setter realtime updates are relayed through — usually the store's raw zustand `set`, but may wrap it (e.g. to derive extra state). */
  realtimeSet: RealtimeSetter;
  /** Overrides the default `databases.*.collections.*.documents` channel — for non-document resources (e.g. a storage bucket's file events). */
  channel?: string;
  init: () => void | Promise<void>;
}

const recentEvents = new Map<string, number>();

export function updateRealtimeCollection<T extends Models.Document>(
  key: Key,
  collection: T[],
  response: RealtimeResponseEvent<T>,
) {
  const { events, payload } = response;
  const eventType =
    ["create", "update", "delete"].find((type) =>
      events.some((e) => e.endsWith(`.${type}`)),
    ) ?? "unknown";

  if (!isNewUpdate(key, payload, eventType)) {
    return collection;
  }

  const handling: Record<string, (collection: T[], payload: T) => T[]> = {
    create: updateRealtimeCollectionCreate,
    update: updateRealtimeCollectionUpdate,
    delete: updateRealtimeCollectionDelete,
    unknown: (collection: T[], _payload: T) => collection,
  };

  return handling[eventType](collection, payload);
}

export async function addToCollection<T>(
  key: Key,
  data: Omit<T, keyof Models.Document>,
): Promise<T | null> {
  console.debug("add to collection", key, data);

  try {
    const row = await tablesDB.createRow({
      databaseId: DATABASE_ID,
      tableId: key,
      rowId: ID.unique(),
      data: data as Record<string, unknown>,
    });
    return row as unknown as T;
  } catch (e: any) {
    Alert.alert("Error", e?.message ?? "Failed to add item.");
    return null;
  }
}

export async function updateInCollection<T>(
  key: Key,
  data: Partial<T & Models.Document> & { $id: string },
  silent = false,
): Promise<boolean> {
  const dataToUpdate = Object.fromEntries(
    Object.entries(data).filter(
      ([k, v]) => !k.startsWith("$") && v !== undefined,
    ),
  );

  console.debug("udpate collection", key, data);

  try {
    await tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: key,
      rowId: data.$id,
      data: dataToUpdate as Record<string, unknown>,
    });
    return true;
  } catch (e: any) {
    if (!silent) {
      Alert.alert("Error", e?.message ?? "Failed to update item.");
    }
    return false;
  }
}

export async function removeFromCollection<T>(
  key: Key,
  data: Partial<T & Models.Document> & { $id: string },
): Promise<boolean> {
  console.debug("remove from collection", key, data);

  try {
    await tablesDB.deleteRow({
      databaseId: DATABASE_ID,
      tableId: key,
      rowId: data.$id,
    });
    return true;
  } catch (e: any) {
    Alert.alert("Error", e?.message ?? "Failed to delete item.");
    return false;
  }
}

export async function fetchCollection<
  T extends Models.Document,
  S extends RealtimeCollectionStore<T> = RealtimeCollectionStore<T>,
>(key: Key, set: Set<T, S>, queries?: string[]): Promise<void> {
  try {
    const result = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: key,
      queries: [Query.limit(Number.MAX_SAFE_INTEGER), ...(queries ?? [])],
    });
    console.debug(`[realtime] initial load for ${key}`, result.total);
    set({ collection: result.rows as unknown as T[] } as Partial<S>);
  } catch (e: any) {
    Alert.alert("Error", e?.message ?? `Failed to load ${key}.`);
  }
}

type TierEntry = {
  key: Key;
  set: RealtimeSetter;
  /** Overrides the default `databases.*.collections.*.documents` channel — for non-document resources (e.g. a storage bucket's file events). */
  channel?: string;
};

/**
 * Opens a single realtime subscription covering every collection in
 * `entries`, relaying each incoming event to the matching store's setter.
 * Appwrite's SDK multiplexes all subscriptions onto one shared WebSocket
 * regardless — but every independent `client.subscribe()` call forces that
 * socket to be torn down and recreated, since its URL is derived from *all*
 * currently subscribed channels. Subscribing once per tier (instead of once
 * per store) keeps that churn to one reconnect per tier transition, instead
 * of one per collection.
 */
export function subscribeTier(entries: TierEntry[]): () => void {
  if (entries.length === 0) {
    return () => {};
  }

  const channelForEntry = (entry: TierEntry) =>
    entry.channel ?? `databases.${DATABASE_ID}.collections.${entry.key}.documents`;

  const entryByChannel = new Map(
    entries.map((entry) => [channelForEntry(entry), entry]),
  );
  const channels = Array.from(entryByChannel.keys());

  console.debug(`[realtime] subscribing tier`, channels);

  const clientUnsubscribe = client.subscribe<any>(channels, (response) => {
    const matchedChannel = response.channels.find((ch) =>
      entryByChannel.has(ch),
    );
    if (!matchedChannel) {
      return;
    }

    const entry = entryByChannel.get(matchedChannel)!;
    try {
      entry.set((state: any) => ({
        ...state,
        collection: updateRealtimeCollection(
          entry.key,
          [...state.collection],
          response,
        ),
      }));
    } catch (e) {
      console.error(`[realtime] ${entry.key} callback error`, e);
    }
  });

  return () => {
    console.debug(`[realtime] unsubscribing tier`, channels);
    clientUnsubscribe();
  };
}

function updateRealtimeCollectionCreate<T extends Models.Document>(
  collection: T[],
  payload: T,
) {
  // already present — ignore duplicate create
  if (collection.some((c) => c.$id === payload.$id)) {
    console.debug([`[realtime] collection create deduped`, payload]);
    return collection;
  }

  console.debug([`[realtime] collection create`, payload]);
  collection.push(payload);

  return collection;
}

function updateRealtimeCollectionUpdate<T extends Models.Document>(
  collection: T[],
  payload: T,
) {
  // no existing entry — insert to be safe
  const id = collection.findIndex((item) => item.$id === payload.$id);
  if (id === -1) {
    console.debug([`[realtime] collection update fallback add`, payload]);
    collection.push(payload);
    return collection;
  }

  const existing: any = collection[id] as any;
  const existingUpdated = existing.$updatedAt
    ? new Date(existing.$updatedAt).getTime()
    : 0;
  const payloadUpdated = payload.$updatedAt
    ? new Date((payload as any).$updatedAt).getTime()
    : 0;

  // older or same update — ignore
  if (payloadUpdated && existingUpdated && payloadUpdated <= existingUpdated) {
    console.debug([`[realtime] collection update deduped`, payload]);
    return collection;
  }

  console.debug([`[realtime] collection update`, payload]);

  // Appwrite realtime payloads may omit relationship fields (returning null/[]).
  // Preserve existing non-null values so relationship-based filters don't break.
  const merged: any = { ...existing, ...payload };
  for (const key of Object.keys(existing)) {
    const pv = (payload as any)[key];
    const ev = existing[key];
    if (
      ev != null &&
      (pv === null ||
        pv === undefined ||
        (Array.isArray(pv) && pv.length === 0))
    ) {
      merged[key] = ev;
    }
  }

  collection = collection.map((item) =>
    item.$id === payload.$id ? (merged as T) : item,
  );

  return collection;
}

function updateRealtimeCollectionDelete<T extends Models.Document>(
  collection: T[],
  payload: T,
) {
  // nothing to delete
  if (!collection.some((c) => c.$id === payload.$id)) {
    console.debug([`[realtime] collection delete deduped`, payload]);
    return collection;
  }

  console.debug([`[realtime] collection delete`, payload]);
  collection = collection.filter((item) => item.$id !== payload.$id);

  return collection;
}

function isNewUpdate(key: string, payload: any, eventType: string): boolean {
  // Include $updatedAt so each distinct update has a unique key.
  // Only true duplicate events (same document, same timestamp, fired twice) are dropped.
  const updatedAt = payload.$updatedAt ?? payload.$createdAt ?? "";
  const dedupeKey = `${key}:${payload.$id}:${eventType}:${updatedAt}`;
  const now = Date.now();
  const last = recentEvents.get(dedupeKey);

  if (last !== undefined && now - last < 5000) {
    console.debug(`[realtime] deduped event ${dedupeKey}`);
    return false;
  }

  recentEvents.set(dedupeKey, now);
  return true;
}
