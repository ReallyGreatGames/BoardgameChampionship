// Browser shim for @expo/vector-icons (design-sync bundle only). The real
// package imports its .ttf via Metro's asset system, which esbuild can't
// load; this renders the same glyphs from the package's own glyphmap with
// the real Ionicons font shipped via .design-sync/fonts.css.
import glyphMap from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json";
import { StyleProp, Text, TextStyle } from "react-native";

type IoniconsProps = {
  name: keyof typeof glyphMap | (string & {});
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

export function Ionicons({ name, size = 24, color, style }: IoniconsProps) {
  const glyph = (glyphMap as Record<string, number>)[name as string];
  return (
    <Text
      selectable={false}
      style={[{ fontFamily: "ionicons", fontSize: size, color, lineHeight: size }, style]}
    >
      {glyph ? String.fromCodePoint(glyph) : "?"}
    </Text>
  );
}
