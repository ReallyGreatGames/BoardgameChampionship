const TABLE_POINTS = [5, 3, 2, 1];
const PLAYER_COUNT = 4;

/**
 * Valid placement combos for 4 players follow the block rule:
 * first value must be 1, each block of equal values v with count n
 * must be followed by v+n (or end of array).
 */
export function isValidPlacementCombo(placements: string[]): boolean {
  if (placements.length !== PLAYER_COUNT) return false;
  if (placements.some((p) => !p || isNaN(Number(p)))) return false;

  const sorted = placements.map(Number).sort((a, b) => a - b);
  if (sorted[0] !== 1) return false;

  let i = 0;
  while (i < sorted.length) {
    const v = sorted[i];
    let count = 0;
    while (i + count < sorted.length && sorted[i + count] === v) count++;
    const nextIdx = i + count;
    if (nextIdx < sorted.length && sorted[nextIdx] !== v + count) return false;
    i += count;
  }
  return true;
}

/**
 * Returns true if any player with a better rank (lower place number)
 * has a strictly lower score than a player with a worse rank.
 * Equal scores at different places are fine (tiebreakers exist).
 * Skips pairs where placement or score is missing.
 */
export function hasScorePlacementConflict(
  placements: string[],
  scores: string[],
): boolean {
  for (let a = 0; a < placements.length; a++) {
    if (!placements[a] || !scores[a]) continue;
    for (let b = a + 1; b < placements.length; b++) {
      if (!placements[b] || !scores[b]) continue;
      const pA = Number(placements[a]);
      const pB = Number(placements[b]);
      const sA = parseFloat(scores[a]);
      const sB = parseFloat(scores[b]);
      if (isNaN(pA) || isNaN(pB) || isNaN(sA) || isNaN(sB)) continue;
      if (pA === pB) continue;
      if (pA < pB && sA < sB) return true;
      if (pA > pB && sA > sB) return true;
    }
  }
  return false;
}

/**
 * Compute tournament points per player seat.
 * Points scale: 5-3-2-1.
 * Draws: the points for the shared places are averaged.
 * Returns null for each seat if any placement is missing.
 */
export function computeTablePoints(placements: string[]): (number | null)[] {
  if (placements.some((p) => !p || isNaN(Number(p)))) {
    return Array(PLAYER_COUNT).fill(null);
  }

  const result: (number | null)[] = Array(PLAYER_COUNT).fill(null);
  const groups = new Map<number, number[]>(); // place → seat indices

  for (let i = 0; i < placements.length; i++) {
    const place = Number(placements[i]);
    if (!groups.has(place)) groups.set(place, []);
    groups.get(place)!.push(i);
  }

  for (const [place, seats] of groups) {
    let total = 0;
    for (let j = 0; j < seats.length; j++) {
      total += TABLE_POINTS[place - 1 + j] ?? 0;
    }
    const perSeat = total / seats.length;
    for (const seat of seats) {
      result[seat] = perSeat;
    }
  }

  return result;
}

export type PlayerStat = {
  playerId: string;
  playerName: string;
  teamId: string;
  tournamentPoints: number;
  placements: number[];
};

export type TeamRanking = {
  rank: number;
  teamId: string;
  teamName: string;
  teamCode: string;
  totalPoints: number;
  avgPlacement: number;
  secondPlaces: number;
  thirdPlaces: number;
  players: PlayerStat[];
};

/**
 * Compute team rankings from aggregated player stats.
 * Tiebreaker order: totalPoints DESC → avgPlacement ASC →
 * secondPlaces DESC → thirdPlaces DESC → best individual placements.
 */
export function rankTeams(
  playerStats: PlayerStat[],
  teams: { id: string; name: string; code: string }[],
): TeamRanking[] {
  const teamMap = new Map<
    string,
    { totalPoints: number; allPlacements: number[]; players: PlayerStat[] }
  >();

  for (const ps of playerStats) {
    if (!teamMap.has(ps.teamId)) {
      teamMap.set(ps.teamId, { totalPoints: 0, allPlacements: [], players: [] });
    }
    const entry = teamMap.get(ps.teamId)!;
    entry.totalPoints += ps.tournamentPoints;
    entry.allPlacements.push(...ps.placements);
    entry.players.push(ps);
  }

  const unsorted: Omit<TeamRanking, "rank">[] = teams.map((team) => {
    const entry = teamMap.get(team.id) ?? {
      totalPoints: 0,
      allPlacements: [],
      players: [],
    };
    const avgPlacement =
      entry.allPlacements.length > 0
        ? entry.allPlacements.reduce((s, p) => s + p, 0) /
          entry.allPlacements.length
        : 999;
    const secondPlaces = entry.allPlacements.filter((p) => p === 2).length;
    const thirdPlaces = entry.allPlacements.filter((p) => p === 3).length;

    return {
      teamId: team.id,
      teamName: team.name,
      teamCode: team.code,
      totalPoints: entry.totalPoints,
      avgPlacement,
      secondPlaces,
      thirdPlaces,
      players: entry.players,
    };
  });

  unsorted.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (a.avgPlacement !== b.avgPlacement) return a.avgPlacement - b.avgPlacement;
    if (b.secondPlaces !== a.secondPlaces) return b.secondPlaces - a.secondPlaces;
    if (b.thirdPlaces !== a.thirdPlaces) return b.thirdPlaces - a.thirdPlaces;

    // Best individual: compare sorted placements element by element
    const sortedA = [...(teamMap.get(a.teamId)?.allPlacements ?? [])].sort(
      (x, y) => x - y,
    );
    const sortedB = [...(teamMap.get(b.teamId)?.allPlacements ?? [])].sort(
      (x, y) => x - y,
    );
    for (let i = 0; i < Math.min(sortedA.length, sortedB.length); i++) {
      if (sortedA[i] !== sortedB[i]) return sortedA[i] - sortedB[i];
    }
    return 0;
  });

  return unsorted.map((t, i) => ({ ...t, rank: i + 1 }));
}
