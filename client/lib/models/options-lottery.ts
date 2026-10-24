import { Models } from "react-native-appwrite";
import { LocalizedText } from "@/lib/i18n/content";

export type LotteryOption = {
  id: string;
  title: string;
  description?: string;
  titleTranslations?: LocalizedText;
  descriptionTranslations?: LocalizedText;
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
