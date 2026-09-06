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
  { phrase: "Ruling for", type: "change" },
  { phrase: "Ruling on", type: "change" },
  { phrase: "Rulings for", type: "change" },
  { phrase: "Clarification for", type: "clarification" },
  { phrase: "Clarification on", type: "clarification" },
  { phrase: "Clarification of", type: "clarification" },
  { phrase: "Clarifications for", type: "clarification" },
  { phrase: "Clarifications on", type: "clarification" },
  { phrase: "Note for", type: "clarification" },
  { phrase: "Note on", type: "clarification" },
  { phrase: "Reminder for", type: "clarification" },
  { phrase: "Reminder on", type: "clarification" },
  { phrase: "Change to", type: "change" },
  { phrase: "Change of", type: "change" },
  { phrase: "Changes to", type: "change" },
  { phrase: "Correction to", type: "change" },
  { phrase: "Addition to", type: "addition" },
  { phrase: "Additions to", type: "addition" },
  { phrase: "Erläuterung zu", type: "clarification" },
  { phrase: "Erläuterung für", type: "clarification" },
  { phrase: "Änderung zu", type: "change" },
  { phrase: "Änderung an", type: "change" },
  { phrase: "Änderungen zu", type: "change" },
  { phrase: "Korrektur zu", type: "change" },
  { phrase: "Ergänzung zu", type: "addition" },
  { phrase: "Ergänzungen zu", type: "addition" },
  { phrase: "Festlegung zu", type: "change" },
  { phrase: "Festlegung für", type: "change" },
  { phrase: "Klarstellung zu", type: "clarification" },
  { phrase: "Erinnerung zu", type: "clarification" },
  { phrase: "Hinweis zu", type: "clarification" },
  { phrase: "Anmerkung zu", type: "clarification" },
];

const LABELS: LabelDef[] = [...RAW_LABELS].sort(
  (a, b) => b.phrase.length - a.phrase.length,
);

const QUOTE_CHAR = /[„“”"«»]/;
const TITLE_TAIL = /^([^:\n]{0,80}?)\s*:\s*([\s\S]*)$/;
const SEPARATOR_LINE = /^[-–—_=*~]{2,}$/;

type TitleSplit = { title: string; bodyStart: string };

type EntryStart = {
  lineIndex: number;
  type: RuleType;
  title: string;
  bodyStart: string;
};

function firstQuoteIndex(s: string): number {
  for (let i = 0; i < s.length; i++) {
    if (QUOTE_CHAR.test(s[i])) {
      return i;
    }
  }
  return -1;
}

function buildTitle(prefix: string, quoted: string, suffix: string): string {
  return [prefix.trim(), quoted.trim(), suffix.trim()]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function splitTitleAndBody(rest: string): TitleSplit | null {
  const openIdx = firstQuoteIndex(rest);

  if (openIdx >= 0) {
    const prefix = rest.slice(0, openIdx);
    for (let i = openIdx + 1; i < rest.length; i++) {
      if (!QUOTE_CHAR.test(rest[i])) {
        continue;
      }
      const tail = rest.slice(i + 1).match(TITLE_TAIL);
      if (!tail) {
        continue;
      }
      const title = buildTitle(prefix, rest.slice(openIdx + 1, i), tail[1]);
      if (title) {
        return { title, bodyStart: tail[2] };
      }
    }
  }

  const plain = rest.match(TITLE_TAIL);
  if (plain) {
    const title = plain[1].replace(QUOTE_CHAR, "").trim();
    if (title) {
      return { title, bodyStart: plain[2] };
    }
  }

  return null;
}

function matchEntryStart(
  trimmedLine: string,
): { type: RuleType; title: string; bodyStart: string } | null {
  const lower = trimmedLine.toLowerCase();
  for (const label of LABELS) {
    if (!lower.startsWith(label.phrase.toLowerCase())) {
      continue;
    }
    const boundary = trimmedLine[label.phrase.length];
    if (boundary !== undefined && !/\s/.test(boundary)) {
      continue;
    }
    const split = splitTitleAndBody(
      trimmedLine.slice(label.phrase.length).trimStart(),
    );
    if (split) {
      return { type: label.type, ...split };
    }
  }
  return null;
}

function indentOf(line: string): number {
  return line.length - line.trimStart().length;
}

const BULLET_LINE = /^([-•◦*]|\d+[.)])\s+(.*)$/;

function bulletsWithContinuations(lines: string[]): string {
  const items: string[] = [];
  for (const line of lines) {
    const previous = items[items.length - 1];
    if (previous !== undefined && previous.endsWith(":")) {
      items[items.length - 1] = `${previous}\n  ${line}`;
      continue;
    }
    items.push(line);
  }
  return items.map((i) => `- ${i}`).join("\n");
}

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
    return bulletsWithContinuations(run.map((l) => l.trim()));
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
  if (line.length >= 60 || /[.!?;,]$/.test(line) || line.endsWith(":")) {
    return false;
  }
  if (line.split(/\s+/).filter(Boolean).length > 8) {
    return false;
  }
  return matchEntryStart(line) === null;
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
    .filter((l) => l && !SEPARATOR_LINE.test(l));

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
