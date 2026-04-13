/**
 * 4pt spacing scale for React Native
 *
 * Use semantic aliases in components, not raw numbers.
 * Rhythm comes from contrast between tight (siblings) and generous (sections).
 */

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

/** Semantic aliases — use these in components */
export const inset = {
  /** 32 — standard screen horizontal padding */
  screen: space[8],
  /** 64 — screen content top offset */
  screenTop: space[16],
  /** 80 — admin/tall-header screen top */
  screenTopTall: space[20],
  /** 48 — bottom safe area padding */
  screenBottom: space[12],
  /** 16 — card internal padding */
  card: space[4],
  /** 48 — between major page sections */
  section: space[12],
  /** 32 — between related groups within a section */
  group: space[8],
  /** 8 — between siblings in a tight group (label+input, title+badge) */
  tight: space[2],
  /** 12 — between list items, form fields */
  list: space[3],
} as const;
