import AsyncStorage from "@react-native-async-storage/async-storage";
import { DATABASE_ID, tablesDB } from "../appwrite";
import { useConnectivityStore } from "../stores/connectivity-store";

const QUEUE_KEY = "bgcs:outbox:v1";

type WriteOp = "create" | "update" | "delete";

export type QueuedWrite = {
  id: string;
  op: WriteOp;
  tableId: string;
  rowId: string;
  data?: Record<string, unknown>;
  at: number;
};

let queue: QueuedWrite[] | null = null;
let flushing = false;

const listeners = new Set<(count: number) => void>();

async function load(): Promise<QueuedWrite[]> {
  if (queue) {
    return queue;
  }
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    queue = Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("[outbox] failed to load queue", e);
    queue = [];
  }
  return queue;
}

async function persist(): Promise<void> {
  if (!queue) {
    return;
  }
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn("[outbox] failed to persist queue", e);
  }
}

function emit(): void {
  const count = queue?.length ?? 0;
  listeners.forEach((listener) => listener(count));
}

export function subscribeWriteQueue(listener: (count: number) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function enqueueWrite(
  op: Omit<QueuedWrite, "id" | "at">,
): Promise<void> {
  const current = await load();
  current.push({
    ...op,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    at: Date.now(),
  });
  console.debug(`[outbox] queued ${op.op} ${op.tableId}/${op.rowId}`, current.length);
  await persist();
  emit();
}

export async function pendingWriteCount(): Promise<number> {
  return (await load()).length;
}

export async function clearWriteQueue(): Promise<void> {
  queue = [];
  await persist();
  emit();
}

async function execute(op: QueuedWrite): Promise<void> {
  if (op.op === "create") {
    try {
      await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: op.tableId,
        rowId: op.rowId,
        data: op.data ?? {},
      });
    } catch (e: any) {
      const isConflict = e?.code === 409 || e?.type === "document_already_exists";
      if (!isConflict) {
        throw e;
      }
      console.debug(`[outbox] create ${op.tableId}/${op.rowId} already exists, skipping`);
    }
    return;
  }

  if (op.op === "update") {
    await tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: op.tableId,
      rowId: op.rowId,
      data: op.data ?? {},
    });
    return;
  }

  await tablesDB.deleteRow({
    databaseId: DATABASE_ID,
    tableId: op.tableId,
    rowId: op.rowId,
  });
}

export async function flushWriteQueue(): Promise<void> {
  if (flushing) {
    return;
  }
  if (useConnectivityStore.getState().isOnline !== true) {
    console.debug("[outbox] not confirmed online — skipping flush");
    return;
  }
  flushing = true;
  try {
    const current = await load();
    while (current.length > 0) {
      const op = current[0];
      try {
        await execute(op);
        current.shift();
        await persist();
        emit();
      } catch (e) {
        if (useConnectivityStore.getState().isOnline === false) {
          console.debug("[outbox] still offline — keeping queue for later");
          return;
        }
        console.error(`[outbox] dropping failed ${op.op} ${op.tableId}/${op.rowId}`, e);
        current.shift();
        await persist();
        emit();
      }
    }
    console.debug("[outbox] queue drained");
  } finally {
    flushing = false;
  }
}
