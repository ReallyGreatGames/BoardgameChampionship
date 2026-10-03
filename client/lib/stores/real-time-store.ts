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

export type RealtimeSetter = (partialState: any) => void;

export type RealtimeEntity = {
  $id: string;
  $updatedAt?: string;
  $createdAt?: string;
};

export interface RealtimeCollectionStore<T extends RealtimeEntity> {
  collection: T[];
  key: Key;
  realtimeSet: RealtimeSetter;
  channel?: string;
  relationshipFields?: readonly string[];
  init: () => void | Promise<void>;
}

const recentEvents = new Map<string, number>();

export function updateRealtimeCollection<T extends Models.Document>(
  key: Key,
  collection: T[],
  response: RealtimeResponseEvent<T>,
  relationshipFields: readonly string[] = [],
) {
  const { events, payload } = response ?? ({} as RealtimeResponseEvent<T>);
  if (!Array.isArray(collection) || !payload || typeof payload.$id !== "string") {
    return Array.isArray(collection) ? collection : [];
  }

  const eventType =
    ["create", "update", "delete"].find((type) =>
      (events ?? []).some((e) => typeof e === "string" && e.endsWith(`.${type}`)),
    ) ?? "unknown";

  if (!isNewUpdate(key, payload, eventType)) {
    return collection;
  }

  const handling: Record<string, (collection: T[], payload: T) => T[]> = {
    create: updateRealtimeCollectionCreate,
    update: (c: T[], p: T) => updateRealtimeCollectionUpdate(c, p, relationshipFields),
    delete: updateRealtimeCollectionDelete,
    unknown: (collection: T[], _payload: T) => collection,
  };

  return handling[eventType](collection, payload);
}

export async function addToCollection<T>(
  key: Key,
  data: Omit<T, keyof Models.Document>,
  options?: {
    rowId?: string;
    silentOnConflict?: boolean;
  },
): Promise<T | null> {
  const rowId = options?.rowId ?? ID.unique();
  console.debug("add to collection", key, data);

  try {
    const row = await tablesDB.createRow({
      databaseId: DATABASE_ID,
      tableId: key,
      rowId,
      data: data as Record<string, unknown>,
    });
    return row as unknown as T;
  } catch (e: any) {
    const isConflict = e?.code === 409 || e?.type === "document_already_exists";
    if (isConflict && options?.silentOnConflict) {
      try {
        const existing = await tablesDB.getRow({
          databaseId: DATABASE_ID,
          tableId: key,
          rowId,
        });
        return existing as unknown as T;
      } catch (getErr: any) {
        Alert.alert("Error", getErr?.message ?? "Failed to load item.");
        return null;
      }
    }
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
  channel?: string;
  relationshipFields?: readonly string[];
  refetch?: () => void | Promise<void>;
};

const REFETCH_DEBOUNCE_MS = 500;
const pendingRefetches = new Map<Key, ReturnType<typeof setTimeout>>();

function scheduleRefetch(entry: TierEntry) {
  if (!entry.refetch || pendingRefetches.has(entry.key)) {
    return;
  }
  pendingRefetches.set(
    entry.key,
    setTimeout(() => {
      pendingRefetches.delete(entry.key);
      console.debug(`[realtime] refetching ${entry.key} to expand relationships`);
      Promise.resolve(entry.refetch?.()).catch((e) =>
        console.error(`[realtime] ${entry.key} refetch error`, e),
      );
    }, REFETCH_DEBOUNCE_MS),
  );
}

export function hasUnexpandedRelationship(
  row: unknown,
  relationshipFields: readonly string[],
): boolean {
  if (!row || typeof row !== "object") {
    return false;
  }
  return relationshipFields.some((field) => {
    const value = (row as any)[field];
    if (value === undefined || typeof value === "string") {
      return true;
    }
    return Array.isArray(value) && value.some((v) => v == null || typeof v !== "object");
  });
}

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
    const matchedChannel = response?.channels?.find((ch) =>
      entryByChannel.has(ch),
    );
    if (!matchedChannel) {
      return;
    }

    const entry = entryByChannel.get(matchedChannel)!;
    const relationshipFields = entry.relationshipFields ?? [];
    try {
      let needsRefetch = false;
      entry.set((state: any) => {
        const collection = updateRealtimeCollection(
          entry.key,
          Array.isArray(state?.collection) ? [...state.collection] : [],
          response,
          relationshipFields,
        );
        if (relationshipFields.length > 0) {
          const row = collection.find((item: any) => item?.$id === response.payload?.$id);
          needsRefetch = hasUnexpandedRelationship(row, relationshipFields);
        }
        return { ...state, collection };
      });
      if (needsRefetch) {
        scheduleRefetch(entry);
      }
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
  relationshipFields: readonly string[],
) {
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

  if (payloadUpdated && existingUpdated && payloadUpdated <= existingUpdated) {
    console.debug([`[realtime] collection update deduped`, payload]);
    return collection;
  }

  console.debug([`[realtime] collection update`, payload]);

  const merged: any = { ...existing, ...payload };
  for (const key of relationshipFields) {
    merged[key] = mergeRelationship(existing[key], (payload as any)[key]);
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
  if (!collection.some((c) => c.$id === payload.$id)) {
    console.debug([`[realtime] collection delete deduped`, payload]);
    return collection;
  }

  console.debug([`[realtime] collection delete`, payload]);
  collection = collection.filter((item) => item.$id !== payload.$id);

  return collection;
}

function isExpanded(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function mergeRelatedRow(existing: unknown, incoming: unknown): unknown {
  const incomingId = typeof incoming === "string" ? incoming : (incoming as any)?.$id;
  if (!isExpanded(existing) || existing.$id !== incomingId) {
    return incoming;
  }
  if (!isExpanded(incoming)) {
    return existing;
  }
  const merged: Record<string, unknown> = { ...existing, ...incoming };
  for (const [k, ev] of Object.entries(existing)) {
    const iv = incoming[k];
    if (isExpanded(ev) && (iv == null || typeof iv === "string")) {
      merged[k] = ev;
    }
  }
  return merged;
}

function mergeRelationship(existing: unknown, incoming: unknown): unknown {
  if (existing == null) {
    return incoming;
  }
  if (incoming === null || incoming === undefined) {
    return existing;
  }
  if (Array.isArray(incoming)) {
    if (incoming.length === 0 || !Array.isArray(existing)) {
      return incoming.length === 0 ? existing : incoming;
    }
    return incoming.map((item) => {
      const id = typeof item === "string" ? item : (item as any)?.$id;
      const match = existing.find((e: any) => e?.$id === id);
      return match === undefined ? item : mergeRelatedRow(match, item);
    });
  }
  return mergeRelatedRow(existing, incoming);
}

function isNewUpdate(key: string, payload: any, eventType: string): boolean {
  const updatedAt = payload.$updatedAt ?? payload.$createdAt ?? "";
  const dedupeKey = `${key}:${payload.$id}:${eventType}:${updatedAt}`;
  const now = Date.now();
  if (recentEvents.size > 500) {
    for (const [k, t] of recentEvents) {
      if (now - t >= 5000) {
        recentEvents.delete(k);
      }
    }
  }
  const last = recentEvents.get(dedupeKey);

  if (last !== undefined && now - last < 5000) {
    console.debug(`[realtime] deduped event ${dedupeKey}`);
    return false;
  }

  recentEvents.set(dedupeKey, now);
  return true;
}
