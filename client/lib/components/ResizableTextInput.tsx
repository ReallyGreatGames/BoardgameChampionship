import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  PanResponder,
  StyleSheet,
  TextInput,
  TextStyle,
  View,
} from "react-native";
import { useTheme } from "../bootstrap/ThemeProvider";

const MIN_HEIGHT = 96;

type ResizableTextInputProps = {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  style?: TextStyle;
  /** Height resets to the default whenever this becomes true (e.g. pass the modal's `visible` prop). */
  resetOn: boolean;
};

export function ResizableTextInput({
  value,
  onChangeText,
  placeholder,
  style,
  resetOn,
}: ResizableTextInputProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [height, setHeight] = useState(MIN_HEIGHT);
  const heightRef = useRef(MIN_HEIGHT);
  const startHeightRef = useRef(MIN_HEIGHT);

  useEffect(() => {
    if (resetOn) {
      heightRef.current = MIN_HEIGHT;
      setHeight(MIN_HEIGHT);
    }
  }, [resetOn]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dy) > 2,
      onPanResponderGrant: () => {
        startHeightRef.current = heightRef.current;
      },
      onPanResponderMove: (_, gesture) => {
        const next = Math.max(MIN_HEIGHT, startHeightRef.current + gesture.dy);
        heightRef.current = next;
        setHeight(next);
      },
    }),
  ).current;

  return (
    <View style={styles.wrapper}>
      <TextInput
        style={[style, styles.input, { height }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textPlaceholder}
        multiline
        textAlignVertical="top"
      />
      <View
        style={styles.handle}
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        {...panResponder.panHandlers}
      >
        <Ionicons name="resize-outline" size={14} color={colors.textMuted} />
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    wrapper: {
      position: "relative",
    },
    input: {
      paddingTop: 10,
      paddingBottom: 20,
    },
    handle: {
      position: "absolute",
      right: 4,
      bottom: 4,
    },
  });
}
