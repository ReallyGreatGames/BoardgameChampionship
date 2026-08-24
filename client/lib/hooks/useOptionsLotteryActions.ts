import { useAuth } from "@/lib/auth";
import { DialogOptions, useDialog } from "@/lib/components/ui/Dialog";
import { LotteryOption, OptionsLottery } from "@/lib/models/options-lottery";
import { useOptionsLotteryStore } from "@/lib/stores/appwrite/options-lottery-store";
import { computeDraw, validateLotteryConfig } from "@/lib/utils/lottery-draw";
import {
  parseOptionsLottery,
  serializeOptions,
  serializeResults,
} from "@/lib/utils/options-lottery";
import { useState } from "react";

export type LotteryConfigInput = {
  name: string;
  pullsPerTable: number;
  sameForAllTables: boolean;
  options: LotteryOption[];
};

export function useOptionsLotteryActions() {
  const { isAdmin } = useAuth();
  const store = useOptionsLotteryStore();
  const { confirm } = useDialog();
  const [saving, setSaving] = useState(false);
  const [pullingId, setPullingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function canRemoveOption(instance: OptionsLottery, optionId: string): boolean {
    return !instance.results.some((r) => r.optionIds.includes(optionId));
  }

  async function create(
    gameId: string,
    config: LotteryConfigInput,
  ): Promise<OptionsLottery | null> {
    if (!isAdmin || validateLotteryConfig(config.options, config.pullsPerTable)) {
      return null;
    }
    setSaving(true);
    try {
      const row = await store.add({
        gameId,
        name: config.name,
        pullsPerTable: config.pullsPerTable,
        sameForAllTables: config.sameForAllTables,
        optionsJson: serializeOptions(config.options),
        resultsJson: "[]",
      });
      return row ? parseOptionsLottery(row) : null;
    } finally {
      setSaving(false);
    }
  }

  async function update(instance: OptionsLottery, config: LotteryConfigInput): Promise<boolean> {
    if (!isAdmin || validateLotteryConfig(config.options, config.pullsPerTable)) {
      return false;
    }
    const stillReferenced = instance.results
      .flatMap((r) => r.optionIds)
      .some((id) => !config.options.some((o) => o.id === id));
    if (stillReferenced) {
      return false;
    }
    setSaving(true);
    try {
      return await store.update({
        $id: instance.$id,
        name: config.name,
        pullsPerTable: config.pullsPerTable,
        sameForAllTables: config.sameForAllTables,
        optionsJson: serializeOptions(config.options),
      });
    } finally {
      setSaving(false);
    }
  }

  async function pull(
    instance: OptionsLottery,
    tableNumbers: number[],
    confirmOpts?: DialogOptions,
  ): Promise<boolean> {
    if (!isAdmin) {
      return false;
    }
    if (instance.results.length > 0 && confirmOpts) {
      const ok = await confirm(confirmOpts);
      if (!ok) {
        return false;
      }
    }
    setPullingId(instance.$id);
    try {
      const results = computeDraw(
        instance.options,
        instance.pullsPerTable,
        tableNumbers,
        instance.sameForAllTables,
      );
      return await store.update({ $id: instance.$id, resultsJson: serializeResults(results) });
    } catch (e: any) {
      await confirm({
        title: "Pull failed",
        message: e?.message ?? "Unknown error",
        cancelLabel: null,
      });
      return false;
    } finally {
      setPullingId(null);
    }
  }

  async function remove(instance: OptionsLottery, confirmOpts?: DialogOptions): Promise<boolean> {
    if (!isAdmin) {
      return false;
    }
    if (confirmOpts) {
      const ok = await confirm(confirmOpts);
      if (!ok) {
        return false;
      }
    }
    setDeletingId(instance.$id);
    try {
      return await store.delete(instance);
    } finally {
      setDeletingId(null);
    }
  }

  return {
    isAdmin,
    saving,
    canRemoveOption,
    create,
    update,
    pull,
    remove,
    isPulling: (id: string) => pullingId === id,
    isDeleting: (id: string) => deletingId === id,
  };
}
