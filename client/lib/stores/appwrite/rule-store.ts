import { Rule } from "@/lib/models/rule";
import { Models } from "react-native-appwrite";
import { create } from "zustand";
import {
  addToCollection,
  initCollection,
  Key,
  RealtimeCollectionStore,
  removeFromCollection,
  updateInCollection,
} from "../real-time-store";

export type PartialRule = Partial<Rule> & { $id: string };

interface RuleState extends RealtimeCollectionStore<Rule> {
  init: () => Promise<void>;
  add: (data: Omit<Rule, keyof Models.Document>) => Promise<Rule | null>;
  update: (item: PartialRule) => Promise<boolean>;
  delete: (data: PartialRule) => Promise<boolean>;
}

export const useRuleStore = create<RuleState>((set) => {
  let unsubscribe: (() => void) | null = null;
  const key: Key = "rules";

  return {
    collection: [],
    init: async () => {
      unsubscribe = await initCollection<Rule, RuleState>(key, set, unsubscribe);
    },

    add: async (data: Omit<Rule, keyof Models.Document>) =>
      await addToCollection(key, data),

    update: async (item: PartialRule) => await updateInCollection(key, item),

    delete: async (data: PartialRule) => await removeFromCollection(key, data),
  };
});
