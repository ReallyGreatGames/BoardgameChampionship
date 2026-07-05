import { Rule } from "@/lib/models/rule";
import { Models } from "react-native-appwrite";
import { create } from "zustand";
import {
  addToCollection,
  fetchCollection,
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
  const key: Key = "rules";

  return {
    collection: [],
    key,
    realtimeSet: set,
    init: async () => {
      await fetchCollection<Rule, RuleState>(key, set);
    },

    add: async (data: Omit<Rule, keyof Models.Document>) =>
      await addToCollection(key, data),

    update: async (item: PartialRule) => await updateInCollection(key, item),

    delete: async (data: PartialRule) => await removeFromCollection(key, data),
  };
});
