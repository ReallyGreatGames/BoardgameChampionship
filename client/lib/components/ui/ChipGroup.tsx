import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";

export type ChipOption<T extends string = string> = {
  value: T;
  label: string;
  icon?: string;
  color?: string;
  isLive?: boolean;
};

type SelectProps<T extends string> = {
  mode: "select";
  options: ChipOption<T>[];
  value: T;
  onChange: (v: T) => void;
  style?: ViewStyle;
};

type CycleProps<T extends string> = {
  mode: "cycle";
  options: ChipOption<T>[];
  value: T;
  onChange: (v: T) => void;
  style?: ViewStyle;
};

export type ChipGroupProps<T extends string> = SelectProps<T> | CycleProps<T>;

export function ChipGroup<T extends string>(props: ChipGroupProps<T>) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (props.mode === "cycle") {
    const { options, value, onChange, style } = props;
    const idx = Math.max(0, options.findIndex((o) => o.value === value));
    const current = options[idx];
    const isNeutral = idx === 0;
    const tintColor = current.color ?? colors.textMuted;
    return (
      <TouchableOpacity
        style={[
          styles.chip,
          !isNeutral && {
            borderColor: tintColor,
            backgroundColor: tintColor + "22",
          },
          style,
        ]}
        onPress={() => onChange(options[(idx + 1) % options.length].value)}
        activeOpacity={0.7}
      >
        {current.icon && (
          <Ionicons name={current.icon as any} size={14} color={tintColor} />
        )}
        <Text style={[styles.chipLabel, { color: tintColor }]}>
          {current.label}
        </Text>
      </TouchableOpacity>
    );
  }

  const { options, value, onChange, style } = props;
  return (
    <View style={[styles.row, style]}>
      {options.map((opt) => {
        const isSelected = opt.value === value;
        const activeColor = opt.color ?? colors.primary;
        return (
          <Pressable
            key={opt.value}
            style={[
              styles.chip,
              isSelected && { backgroundColor: activeColor, borderColor: activeColor },
            ]}
            onPress={() => onChange(opt.value)}
          >
            {opt.isLive && (
              <View
                style={[
                  styles.liveDot,
                  { backgroundColor: isSelected ? colors.onAccent : colors.success },
                ]}
              />
            )}
            {opt.icon && (
              <Ionicons
                name={opt.icon as any}
                size={14}
                color={isSelected ? colors.onAccent : (opt.color ?? colors.textMuted)}
              />
            )}
            <Text
              style={[
                styles.chipLabel,
                { color: isSelected ? colors.onAccent : colors.textSecondary },
                isSelected && { fontWeight: "600" },
              ]}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: space[1],
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[1],
      paddingVertical: space[2],
      paddingHorizontal: space[4],
      borderRadius: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipLabel: {
      ...type.bodySmall,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
  });
}
