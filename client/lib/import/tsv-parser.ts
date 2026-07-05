export type ParsedPlayer = {
  name: string;
  playerNumber: number;
};

export type ParsedTeam = {
  name: string;
  country: string;
  code: string;
  players: ParsedPlayer[];
};

export type ParsedRow = {
  line: number;
  team: ParsedTeam;
  errors: string[];
};

/** Used when a row has no country code column, or it's left blank. */
const DEFAULT_COUNTRY = "DE";

export function parseTsv(raw: string): ParsedRow[] {
  const lines = raw
    .split("\n")
    .map((line, i) => ({ raw: line, index: i }))
    .filter(({ raw }) => raw.trim().length > 0);

  // Skip header row: code column (col 6) contains whitespace or the literal word "code"
  const firstCode = lines[0]?.raw.split("\t")[6]?.trim() ?? "";
  const start = /\s/.test(firstCode) || firstCode.toLowerCase() === "code" ? 1 : 0;

  return lines.slice(start).map(({ raw, index }) => parseRow(raw, index + 1));
}

function parseRow(raw: string, line: number): ParsedRow {
  const cols = raw.split("\t");

  // Columns 0-6 (name, country/city, 4 players, team code) are required.
  // Column 7 (2-letter country code) is optional — some MANNSCHAFTEN exports
  // omit it entirely, or leave it blank; both default to DEFAULT_COUNTRY.
  if (cols.length < 7) {
    return {
      line,
      team: { name: cols[0]?.trim() ?? "", country: "", code: "", players: [] },
      errors: [`Expected at least 7 columns, got ${cols.length}`],
    };
  }

  const errors: string[] = [];

  const name = cols[0].trim();
  const p1 = cols[2].trim();
  const p2 = cols[3].trim();
  const p3 = cols[4].trim();
  const p4 = cols[5].trim();
  const code = cols[6].trim();
  const country = cols[7]?.trim() || DEFAULT_COUNTRY;

  if (!name) {
    errors.push("Team name is missing");
  }
  if (!code) {
    errors.push("Team code is missing");
  }

  const playerNames = [p1, p2, p3, p4];
  playerNames.forEach((n, i) => {
    if (!n) {
      errors.push(`Player ${i + 1} name is missing`);
    }
  });

  const players: ParsedPlayer[] = playerNames.map((n, i) => ({
    name: n,
    playerNumber: i + 1,
  }));

  return {
    line,
    team: { name, country, code, players },
    errors,
  };
}
