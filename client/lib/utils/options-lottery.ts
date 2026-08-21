import {
  LotteryOption,
  LotteryTableResult,
  OptionsLottery,
  OptionsLotteryRow,
} from "@/lib/models/options-lottery";

export function parseOptionsLottery(row: OptionsLotteryRow): OptionsLottery {
  const { optionsJson, resultsJson, ...rest } = row;
  let options: LotteryOption[] = [];
  let results: LotteryTableResult[] = [];
  try {
    options = JSON.parse(optionsJson);
  } catch {
    options = [];
  }
  try {
    results = resultsJson ? JSON.parse(resultsJson) : [];
  } catch {
    results = [];
  }
  return { ...rest, options, results };
}

export function serializeOptions(options: LotteryOption[]): string {
  return JSON.stringify(options);
}

export function serializeResults(results: LotteryTableResult[]): string {
  return JSON.stringify(results);
}

export function getOptionsLotteriesForGame(
  rows: OptionsLotteryRow[],
  gameId: string,
): OptionsLottery[] {
  return rows
    .filter((row) => row.gameId === gameId)
    .map(parseOptionsLottery)
    .sort((a, b) => new Date(a.$createdAt).getTime() - new Date(b.$createdAt).getTime());
}

export function getResultForTable(
  instance: OptionsLottery,
  table: number,
): LotteryTableResult | null {
  return instance.results.find((r) => r.table === table) ?? null;
}

export function getOptionById(
  instance: OptionsLottery,
  optionId: string,
): LotteryOption | null {
  return instance.options.find((o) => o.id === optionId) ?? null;
}
