export const PLAYER_COLORS = [
  {
    active: "#ff4136",
    muted: "#a82a23",
    elapsed: "#5c1510",
    elapsedMuted: "#2e0a08",
  },
  {
    active: "#2196f3",
    muted: "#1565a8",
    elapsed: "#0a2f60",
    elapsedMuted: "#051830",
  },
  {
    active: "#00e676",
    muted: "#00894a",
    elapsed: "#0a3d20",
    elapsedMuted: "#051e10",
  },
  {
    active: "#ffd600",
    muted: "#b8960a",
    elapsed: "#604800",
    elapsedMuted: "#302400",
  },
] as const;

export const PLAYER_COLOR_OPTIONS = [
  ...PLAYER_COLORS.map((color) => color.active),
  "#9c27b0",
  "#ff9800",
] as const;

export const MIN_PLAYER_COLOR_COUNT = 4;
export const MAX_PLAYER_COLOR_COUNT = 6;

function darkenHex(hex: string, factor: number): string {
  const h = hex.replace("#", "").padStart(6, "0");
  const n = parseInt(h, 16);
  const r = Math.max(0, Math.round(((n >> 16) & 0xff) * factor));
  const g = Math.max(0, Math.round(((n >> 8) & 0xff) * factor));
  const b = Math.max(0, Math.round((n & 0xff) * factor));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function liftNearBlack(hex: string): string {
  const h = hex.replace("#", "").padStart(6, "0");
  const n = parseInt(h, 16);
  const brightest = Math.max((n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff);
  return brightest < 64 ? "#7b8490" : hex;
}

export function buildPlayerColor(hex: string) {
  const active = liftNearBlack(hex);
  return {
    active,
    muted: darkenHex(active, 0.65),
    elapsed: darkenHex(active, 0.3),
    elapsedMuted: darkenHex(active, 0.15),
  };
}
