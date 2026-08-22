import { Models } from "react-native-appwrite";

export type LotteryOption = {
  id: string;
  title: string;
  description?: string;
  weight: number;
  maxPerTable: number;
};

export type LotteryTableResult = {
  table: number;
  optionIds: string[];
};

export type OptionsLotteryRow = {
  gameId: string;
  name: string;
  pullsPerTable: number;
  sameForAllTables: boolean;
  optionsJson: string;
  resultsJson: string;
} & Models.Document;

export type OptionsLottery = Omit<OptionsLotteryRow, "optionsJson" | "resultsJson"> & {
  options: LotteryOption[];
  results: LotteryTableResult[];
};
