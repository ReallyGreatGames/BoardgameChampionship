import { RuleType } from "@/lib/models/rule";

export type ParsedRule = {
  title: string;
  type: RuleType;
  text: string;
};

export const GENERAL_RULE_TITLE = "General";

type LabelDef = { phrase: string; type: RuleType };

const RAW_LABELS: LabelDef[] = [
  { phrase: "Erläuterung Änderung zu", type: "change" },
  { phrase: "Ruling for", type: "clarification" },
  { phrase: "Clarification for", type: "clarification" },
  { phrase: "Change to", type: "change" },
  { phrase: "Addition to", type: "addition" },
  { phrase: "Erläuterung zu", type: "clarification" },
  { phrase: "Änderung zu", type: "change" },
  { phrase: "Ergänzung zu", type: "addition" },
  { phrase: "Festlegung zu", type: "clarification" },
  { phrase: "Klarstellung zu", type: "clarification" },
  { phrase: "Erinnerung zu", type: "clarification" },
];

const LABELS: LabelDef[] = [...RAW_LABELS].sort(
  (a, b) => b.phrase.length - a.phrase.length,
);

const QUOTE_PAIRS: [string, string][] = [
  ["„", "“"],
  ["“", "”"],
  ['"', '"'],
];

type EntryStart = {
  lineIndex: number;
  type: RuleType;
  title: string;
  bodyStart: string;
};

function escapeForRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchEntryStart(
  trimmedLine: string,
): { type: RuleType; title: string; bodyStart: string } | null {
  for (const label of LABELS) {
    if (!trimmedLine.startsWith(label.phrase)) {
      continue;
    }
    const rest = trimmedLine.slice(label.phrase.length).trimStart();
    for (const [open, close] of QUOTE_PAIRS) {
      if (!rest.startsWith(open)) {
        continue;
      }
      const pattern = new RegExp(
        `^${escapeForRegex(open)}([\\s\\S]*?)${escapeForRegex(close)}\\s*:\\s*([\\s\\S]*)$`,
      );
      const m = rest.match(pattern);
      if (m) {
        return { type: label.type, title: m[1].trim(), bodyStart: m[2] };
      }
    }
  }
  return null;
}

function indentOf(line: string): number {
  return line.length - line.trimStart().length;
}

const BULLET_LINE = /^([-•◦*]|\d+[.)])\s+(.*)$/;

function formatRun(run: string[]): string {
  if (run.length === 1) {
    const trimmed = run[0].trim();
    const m = trimmed.match(BULLET_LINE);
    return m ? `- ${m[2]}` : trimmed;
  }

  const hasExplicitBullet = run.some((l) => BULLET_LINE.test(l.trim()));
  if (hasExplicitBullet) {
    return run
      .map((l) => {
        const trimmed = l.trim();
        const m = trimmed.match(BULLET_LINE);
        const prefix = indentOf(l) >= 4 ? "  - " : "- ";
        return m ? `${prefix}${m[2]}` : `${prefix}${trimmed}`;
      })
      .join("\n");
  }

  const indents = run.map(indentOf);
  const allSameIndent = indents.every((i) => i === indents[0]);

  if (allSameIndent && indents[0] > 0) {
    return run.map((l) => `- ${l.trim()}`).join("\n");
  }
  if (allSameIndent) {
    return run.map((l) => l.trim()).join("\n");
  }

  const baseIndent = indents[0];
  const restDeeper = indents.slice(1).every((i) => i > baseIndent);
  if (restDeeper) {
    const intro = run[0].trim();
    const items = run
      .slice(1)
      .map((l) => `- ${l.trim()}`)
      .join("\n");
    return `${intro}\n${items}`;
  }

  return run.map((l) => l.trim()).join("\n");
}

function formatBody(rawLines: string[]): string {
  const lines = [...rawLines];
  while (lines.length && lines[0].trim() === "") {
    lines.shift();
  }
  while (lines.length && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }

  const runs: string[][] = [];
  let current: string[] = [];
  for (const raw of lines) {
    if (raw.trim() === "") {
      if (current.length) {
        runs.push(current);
        current = [];
      }
    } else {
      current.push(raw);
    }
  }
  if (current.length) {
    runs.push(current);
  }

  return runs
    .map(formatRun)
    .join("\n\n")
    .trim();
}

function isBareHeading(line: string): boolean {
  return line.length < 60 && !line.includes(":") && !/[.!?]$/.test(line);
}

export function parseRulesText(raw: string): ParsedRule[] {
  const lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  const starts: EntryStart[] = [];
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }
    const m = matchEntryStart(trimmed);
    if (m) {
      starts.push({ ...m, lineIndex: i });
    }
  });

  const entries: ParsedRule[] = [];

  const firstIdx = starts.length > 0 ? starts[0].lineIndex : lines.length;
  const preambleLines = lines
    .slice(0, firstIdx)
    .map((l) => l.trim())
    .filter(Boolean);

  if (preambleLines.length > 0) {
    const [maybeHeading, ...rest] = preambleLines;
    const remaining = isBareHeading(maybeHeading) ? rest : preambleLines;
    if (remaining.length > 0) {
      entries.push({
        title: GENERAL_RULE_TITLE,
        type: "clarification",
        text: formatBody(remaining),
      });
    }
  }

  for (let s = 0; s < starts.length; s++) {
    const start = starts[s];
    const endLine =
      s + 1 < starts.length ? starts[s + 1].lineIndex : lines.length;
    const bodyLines = [start.bodyStart, ...lines.slice(start.lineIndex + 1, endLine)];
    entries.push({
      title: start.title,
      type: start.type,
      text: formatBody(bodyLines),
    });
  }

  return entries;
}
