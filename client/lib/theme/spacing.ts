
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

export const inset = {
  screen: space[8],
  screenTop: space[16],
  screenTopTall: space[20],
  screenBottom: space[12],
  card: space[4],
  section: space[12],
  group: space[8],
  tight: space[2],
  list: space[3],
} as const;
