import { useState } from "react";
import {
  DirectionPicker,
  FormField,
  StyleSheet,
  Text,
  View,
  useTheme,
  type as typography,
} from "boardgame-championship";

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 20, maxWidth: 360 },
  group: { gap: 8 },
});

const Caption = ({ children }: { children: string }) => {
  const { colors } = useTheme();
  return (
    <Text
      style={[
        typography.caption,
        { color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
      ]}
    >
      {children}
    </Text>
  );
};

export const CountDown = () => {
  const [value, setValue] = useState<"up" | "down">("down");
  return (
    <View style={styles.wrap}>
      <DirectionPicker
        value={value}
        onChange={setValue}
        labelDown="Count down"
        labelUp="Count up"
      />
    </View>
  );
};

export const BothStates = () => {
  const [down, setDown] = useState<"up" | "down">("down");
  const [up, setUp] = useState<"up" | "down">("up");
  return (
    <View style={styles.wrap}>
      <View style={styles.group}>
        <Caption>Down selected</Caption>
        <DirectionPicker value={down} onChange={setDown} labelDown="Count down" labelUp="Count up" />
      </View>
      <View style={styles.group}>
        <Caption>Up selected</Caption>
        <DirectionPicker value={up} onChange={setUp} labelDown="Count down" labelUp="Count up" />
      </View>
    </View>
  );
};

export const InTimerField = () => {
  const [value, setValue] = useState<"up" | "down">("up");
  return (
    <View style={styles.wrap}>
      <FormField icon="swap-vertical-outline" label="Timer direction">
        <DirectionPicker
          value={value}
          onChange={setValue}
          labelDown="Count down"
          labelUp="Count up"
        />
      </FormField>
    </View>
  );
};
