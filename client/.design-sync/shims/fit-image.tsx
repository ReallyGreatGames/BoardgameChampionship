// Browser shim for react-native-fit-image (design-sync bundle only).
// The real package is CJS and calls require("react") at runtime, which the
// IIFE bundle can't satisfy. Only react-native-markdown-display uses it, for
// images inside markdown; an auto-sizing RN Image is the browser equivalent.
import { Image, ImageProps } from "react-native";

export default function FitImage({ style, ...rest }: ImageProps) {
  return <Image resizeMode="contain" {...rest} style={[{ width: "100%" }, style]} />;
}
