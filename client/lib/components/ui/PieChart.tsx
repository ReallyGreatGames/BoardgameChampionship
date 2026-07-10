import { useMemo } from "react";
import Svg, { Circle, Path } from "react-native-svg";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";

export type PieSlice = {
  value: number;
  color: string;
};

type Props = {
  slices: PieSlice[];
  size?: number;
};

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function slicePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

/** Simple pie chart. Slices are drawn in order starting at 12 o'clock, clockwise. */
export function PieChart({ slices, size = 88 }: Props) {
  const { colors } = useTheme();
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;

  const paths = useMemo(() => {
    if (total <= 0) {
      return [];
    }
    let angle = -Math.PI / 2;
    return slices
      .filter((s) => s.value > 0)
      .map((s) => {
        const sweep = (s.value / total) * Math.PI * 2;
        const path = slicePath(cx, cy, r, angle, angle + sweep);
        angle += sweep;
        return { path, color: s.color };
      });
  }, [slices, total, cx, cy, r]);

  return (
    <Svg width={size} height={size}>
      {total <= 0 ? (
        <Circle cx={cx} cy={cy} r={r} fill={colors.border} />
      ) : (
        paths.map((p, i) => (
          <Path key={i} d={p.path} fill={p.color} stroke={colors.surface} strokeWidth={2} />
        ))
      )}
    </Svg>
  );
}
