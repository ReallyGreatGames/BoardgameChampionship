import { LotteryOption, LotteryTableResult } from "@/lib/models/options-lottery";

const MAX_DEAL_ATTEMPTS = 50;

export type LotteryValidationError = {
  code:
    | "no-options"
    | "invalid-pulls-per-table"
    | "missing-title"
    | "invalid-weight"
    | "invalid-max-per-table"
    | "insufficient-capacity";
  meta?: Record<string, string | number>;
};

export function validateLotteryConfig(
  options: LotteryOption[],
  pullsPerTable: number,
): LotteryValidationError | null {
  if (options.length === 0) {
    return { code: "no-options" };
  }
  if (!Number.isInteger(pullsPerTable) || pullsPerTable < 1) {
    return { code: "invalid-pulls-per-table" };
  }
  for (const option of options) {
    if (!option.title.trim()) {
      return { code: "missing-title" };
    }
    if (!Number.isInteger(option.weight) || option.weight < 1) {
      return { code: "invalid-weight", meta: { title: option.title } };
    }
    if (!Number.isInteger(option.maxPerTable) || option.maxPerTable < 1) {
      return { code: "invalid-max-per-table", meta: { title: option.title } };
    }
  }
  const capacity = options.reduce((sum, o) => sum + o.maxPerTable, 0);
  if (capacity < pullsPerTable) {
    return { code: "insufficient-capacity", meta: { capacity, pullsPerTable } };
  }
  return null;
}

/**
 * Apportions `totalSlots` across `options` proportionally to their weight,
 * using the largest-remainder method so the split stays as close to the
 * configured ratio as integer math allows.
 */
function apportion(options: LotteryOption[], totalSlots: number): number[] {
  const totalWeight = options.reduce((sum, o) => sum + o.weight, 0);
  const raw = options.map((o) => (o.weight / totalWeight) * totalSlots);
  const counts = raw.map(Math.floor);
  const allocated = counts.reduce((sum, c) => sum + c, 0);

  const remainders = raw
    .map((r, i) => ({ i, frac: r - counts[i] }))
    .sort((a, b) => b.frac - a.frac);

  for (let k = 0; k < totalSlots - allocated; k++) {
    counts[remainders[k].i]++;
  }

  return counts;
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Deals `pullsPerTable` items per table out of the shuffled `pool`,
 * respecting each option's maxPerTable within a single table's own hand.
 * Returns null (a dead end) if a table can't be completed from what's left
 * — the caller retries with a fresh shuffle.
 */
function tryDeal(
  pool: string[],
  maxPerTableById: Map<string, number>,
  pullsPerTable: number,
  tableNumbers: number[],
): LotteryTableResult[] | null {
  const remaining = [...pool];
  const results: LotteryTableResult[] = [];

  for (const table of tableNumbers) {
    const picked: string[] = [];
    const usedThisTable = new Map<string, number>();

    for (let slot = 0; slot < pullsPerTable; slot++) {
      const idx = remaining.findIndex((id) => {
        const used = usedThisTable.get(id) ?? 0;
        return used < (maxPerTableById.get(id) ?? Infinity);
      });
      if (idx === -1) {
        return null;
      }
      const [id] = remaining.splice(idx, 1);
      picked.push(id);
      usedThisTable.set(id, (usedThisTable.get(id) ?? 0) + 1);
    }

    results.push({ table, optionIds: picked });
  }

  return results;
}

/**
 * Computes a fresh draw: apportions options by weight across every table,
 * then deals each table its `pullsPerTable` items respecting maxPerTable.
 * Throws if the config is invalid or no valid deal was found within the
 * retry budget (only reachable with maxPerTable configs pushed to the edge).
 */
export function computeDraw(
  options: LotteryOption[],
  pullsPerTable: number,
  tableNumbers: number[],
): LotteryTableResult[] {
  const validationError = validateLotteryConfig(options, pullsPerTable);
  if (validationError) {
    throw new Error(`Invalid lottery config: ${validationError.code}`);
  }
  if (tableNumbers.length === 0) {
    return [];
  }

  const totalSlots = tableNumbers.length * pullsPerTable;
  const counts = apportion(options, totalSlots);
  const pool: string[] = [];
  options.forEach((option, i) => {
    for (let k = 0; k < counts[i]; k++) {
      pool.push(option.id);
    }
  });
  const maxPerTableById = new Map(options.map((o) => [o.id, o.maxPerTable]));

  for (let attempt = 0; attempt < MAX_DEAL_ATTEMPTS; attempt++) {
    const dealt = tryDeal(shuffled(pool), maxPerTableById, pullsPerTable, tableNumbers);
    if (dealt) {
      return dealt;
    }
  }

  throw new Error(
    "Could not compute a valid draw with the given maxPerTable constraints after multiple attempts.",
  );
}
