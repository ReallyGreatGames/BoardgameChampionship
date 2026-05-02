import { useState } from "react";
import { useAuth } from "../auth";
import { useDialog, DialogOptions } from "../components/Dialog";
import { TableBell } from "../models/table-bell";
import { useTableBellStore } from "../stores/appwrite/table-bell-store";

export function useTableBellActions() {
  const { isAdmin } = useAuth();
  const tableBellStore = useTableBellStore();
  const { confirm } = useDialog();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  function canDelete(bell: TableBell): boolean {
    return !bell.locked || isAdmin;
  }

  async function ring(
    table: number,
    opts?: { locked?: boolean; reason?: string },
    confirmOpts?: DialogOptions,
  ): Promise<boolean> {
    if (confirmOpts) {
      const ok = await confirm(confirmOpts);
      if (!ok) return false;
    }
    await tableBellStore.add({ table, startTime: new Date().toISOString(), ...opts });
    return true;
  }

  async function dismiss(bell: TableBell, confirmOpts?: DialogOptions): Promise<boolean> {
    if (!canDelete(bell)) return false;
    if (confirmOpts) {
      const ok = await confirm(confirmOpts);
      if (!ok) return false;
    }
    setLoadingId(bell.$id);
    try {
      await tableBellStore.delete(bell);
      return true;
    } finally {
      setLoadingId(null);
    }
  }

  async function acknowledge(bell: TableBell, confirmOpts?: DialogOptions): Promise<boolean> {
    if (confirmOpts) {
      const ok = await confirm(confirmOpts);
      if (!ok) return false;
    }
    setLoadingId(bell.$id);
    try {
      await tableBellStore.update({ $id: bell.$id, acknowledgeTime: new Date().toISOString() });
      return true;
    } finally {
      setLoadingId(null);
    }
  }

  return {
    canDelete,
    ring,
    dismiss,
    acknowledge,
    isLoading: loadingId !== null,
    isLoadingBell: (bell: TableBell) => loadingId === bell.$id,
  };
}
