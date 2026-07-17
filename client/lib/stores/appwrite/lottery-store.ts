import { Models, Query } from "react-native-appwrite";
import { create } from "zustand";
import { LOTTERY_BUCKET_ID, storage } from "../../appwrite";
import { RealtimeCollectionStore } from "../real-time-store";

/**
 * Lottery photos have no database row — the bucket listing itself is the
 * source of truth (see lib/utils/lottery.ts for the filename convention that
 * encodes which game a photo belongs to). This store just mirrors that
 * bucket's file list and stays live via the bucket's own realtime channel.
 */
interface LotteryFilesState extends RealtimeCollectionStore<Models.File> {
  init: () => Promise<void>;
}

export const useLotteryStore = create<LotteryFilesState>((set) => {
  const key = "lottery-files";
  const channel = `buckets.${LOTTERY_BUCKET_ID}.files`;

  return {
    collection: [],
    key,
    channel,
    realtimeSet: set,
    init: async () => {
      const result = await storage.listFiles({
        bucketId: LOTTERY_BUCKET_ID,
        queries: [Query.limit(500)],
      });
      set({ collection: result.files });
    },
  };
});
