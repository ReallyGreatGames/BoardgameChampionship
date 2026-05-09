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

function darkenHex(hex: string, factor: number): string {
  const h = hex.replace("#", "").padStart(6, "0");
  const n = parseInt(h, 16);
  const r = Math.max(0, Math.round(((n >> 16) & 0xff) * factor));
  const g = Math.max(0, Math.round(((n >> 8) & 0xff) * factor));
  const b = Math.max(0, Math.round((n & 0xff) * factor));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function buildPlayerColor(hex: string) {
  return {
    active: hex,
    muted: darkenHex(hex, 0.65),
    elapsed: darkenHex(hex, 0.3),
    elapsedMuted: darkenHex(hex, 0.15),
  };
}
