import { Result } from "@/lib/models/result";
import { Table } from "@/lib/models/table";
import { resolveGameId } from "@/lib/utils";

const PLAYER_COUNT = 4;

export type SeatStats = {
  seat: number;
  matches: number;
  wins: number;
  winRate: number | null;
  /** index i = count of placement (i + 1) */
  placementCounts: number[];
  placementRates: (number | null)[];
  scores: number[];
  minScore: number | null;
  maxScore: number | null;
  avgScore: number | null;
  medianScore: number | null;
  stdDevScore: number | null;
};

export type TeamSeatPerformance = {
  teamId: string;
  teamName: string;
  teamCode: string;
  occurrences: number;
  avgActualPlacement: number;
  avgExpectedPlacement: number;
  /** expected - actual; positive = team placed better than the seat's baseline on average */
  delta: number;
};

function average(nums: number[]): number | null {
  if (nums.length === 0) {
    return null;
  }
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function median(nums: number[]): number | null {
  if (nums.length === 0) {
    return null;
  }
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function standardDeviation(nums: number[]): number | null {
  if (nums.length === 0) {
    return null;
  }
  const avg = average(nums)!;
  const variance = nums.reduce((s, n) => s + (n - avg) ** 2, 0) / nums.length;
  return Math.sqrt(variance);
}

function averagePlacementFromCounts(counts: number[]): number | null {
  const total = counts.reduce((s, c) => s + c, 0);
  if (total === 0) {
    return null;
  }
  const weighted = counts.reduce((s, c, i) => s + c * (i + 1), 0);
  return weighted / total;
}

/**
 * Per-seat win rate, placement distribution, and score stats across every
 * submitted result for a game. A tie for first counts as a win for every
 * tied seat.
 */
export function computeSeatStats(
  results: Result[],
  gameId: string,
  playerCount = PLAYER_COUNT,
): SeatStats[] {
  const gameResults = results.filter(
    (r) => r.submitted && r.gameId === gameId,
  );

  return Array.from({ length: playerCount }, (_, seat) => {
    const placementCounts = Array(playerCount).fill(0);
    const scores: number[] = [];
    let matches = 0;
    let wins = 0;

    for (const result of gameResults) {
      const raw = result.placements?.[seat];
      const place = raw !== undefined && raw !== "" ? Number(raw) : NaN;
      if (isNaN(place) || place < 1 || place > playerCount) {
        continue;
      }

      matches++;
      placementCounts[place - 1]++;
      if (place === 1) {
        wins++;
      }

      const score = result.scores?.[seat];
      if (typeof score === "number" && Number.isFinite(score)) {
        scores.push(score);
      }
    }

    return {
      seat,
      matches,
      wins,
      winRate: matches > 0 ? wins / matches : null,
      placementCounts,
      placementRates: placementCounts.map((c) =>
        matches > 0 ? c / matches : null,
      ),
      scores,
      minScore: scores.length ? Math.min(...scores) : null,
      maxScore: scores.length ? Math.max(...scores) : null,
      avgScore: average(scores),
      medianScore: median(scores),
      stdDevScore: standardDeviation(scores),
    };
  });
}

/**
 * For each team that played a game, compares their actual average placement
 * against the average placement everyone else got from the same seats they
 * sat in — flags teams over/under-performing relative to their seating.
 */
export function computeTeamSeatPerformance(
  results: Result[],
  tables: Table[],
  gameId: string,
  seatStats: SeatStats[],
): TeamSeatPerformance[] {
  const seatAvgPlacement = seatStats.map((s) =>
    averagePlacementFromCounts(s.placementCounts),
  );

  const teamMap = new Map<
    string,
    { teamName: string; teamCode: string; actual: number[]; expected: number[] }
  >();

  const gameResults = results.filter(
    (r) => r.submitted && r.gameId === gameId,
  );

  for (const result of gameResults) {
    const table = tables.find(
      (t) => resolveGameId(t.game) === gameId && t.tableNumber === result.table,
    );
    if (!table) {
      continue;
    }

    for (let seat = 0; seat < table.players.length; seat++) {
      const player = table.players[seat];
      if (!player) {
        continue;
      }

      const raw = result.placements?.[seat];
      const place = raw !== undefined && raw !== "" ? Number(raw) : NaN;
      if (isNaN(place)) {
        continue;
      }

      const team = player.team as any;
      const teamId = typeof team === "string" ? team : team.$id;
      const teamName = typeof team === "string" ? team : team.name;
      const teamCode = typeof team === "string" ? team : team.code;

      if (!teamMap.has(teamId)) {
        teamMap.set(teamId, { teamName, teamCode, actual: [], expected: [] });
      }
      const entry = teamMap.get(teamId)!;
      entry.actual.push(place);
      const expected = seatAvgPlacement[seat];
      if (expected !== null) {
        entry.expected.push(expected);
      }
    }
  }

  return Array.from(teamMap.entries())
    .map(([teamId, entry]) => {
      const avgActualPlacement = average(entry.actual)!;
      const avgExpectedPlacement = average(entry.expected) ?? avgActualPlacement;
      return {
        teamId,
        teamName: entry.teamName,
        teamCode: entry.teamCode,
        occurrences: entry.actual.length,
        avgActualPlacement,
        avgExpectedPlacement,
        delta: avgExpectedPlacement - avgActualPlacement,
      };
    })
    .sort((a, b) => b.delta - a.delta);
}
