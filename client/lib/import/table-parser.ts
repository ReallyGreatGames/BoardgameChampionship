export type ParsedTableEntry = {
  line: number;
  tableNumber: number;
  playerCodes: string[];
  error: string | null;
};

export type ParsedTableGroup = {
  gameIndex: number;
  entries: ParsedTableEntry[];
};

export type TableParseResult = {
  groups: ParsedTableGroup[];
};

export function parseTableFile(raw: string): TableParseResult {
  const lines = raw
    .split("\n")
    .map((line, i) => ({ raw: line.trim(), lineNum: i + 1 }))
    .filter(({ raw }) => raw.length > 0);

  const groups: ParsedTableGroup[] = [];
  let currentGroup: ParsedTableGroup | null = null;
  let prevTableNumber = -1;

  for (const { raw, lineNum } of lines) {
    const entry = parseLine(raw, lineNum);

    if (currentGroup === null || entry.tableNumber <= prevTableNumber) {
      currentGroup = { gameIndex: groups.length, entries: [] };
      groups.push(currentGroup);
    }

    prevTableNumber = entry.tableNumber;
    currentGroup.entries.push(entry);
  }

  return { groups };
}

function parseLine(raw: string, lineNum: number): ParsedTableEntry {
  const pipeIdx = raw.indexOf("|");
  if (pipeIdx === -1) {
    return {
      line: lineNum,
      tableNumber: 0,
      playerCodes: [],
      error: "Missing | separator",
    };
  }

  const parts = raw
    .slice(pipeIdx + 1)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length < 1) {
    return {
      line: lineNum,
      tableNumber: 0,
      playerCodes: [],
      error: "Missing table number after |",
    };
  }

  const tableNumber = parseInt(parts[0], 10);
  if (isNaN(tableNumber)) {
    return {
      line: lineNum,
      tableNumber: 0,
      playerCodes: [],
      error: `Invalid table number: ${parts[0]}`,
    };
  }

  const playerCodes = parts.slice(1);
  const error =
    playerCodes.length !== 4
      ? `Expected 4 player codes, got ${playerCodes.length}`
      : null;

  return { line: lineNum, tableNumber, playerCodes, error };
}
