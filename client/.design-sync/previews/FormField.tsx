import { useState } from "react";
import {
  FormField,
  StyleSheet,
  TextInput,
  View,
  inset,
  ui,
  useTheme,
  type as typography,
} from "boardgame-championship";

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 20, maxWidth: 360 },
});

function useInputStyles() {
  const { colors } = useTheme();
  const input = {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: ui.inputRadius,
    paddingVertical: 10,
    paddingHorizontal: inset.card,
  };
  return {
    input,
    inputError: { ...input, borderColor: colors.error },
    placeholder: colors.textPlaceholder,
  };
}

export const PlayerName = () => {
  const s = useInputStyles();
  const [value, setValue] = useState("");
  return (
    <View style={styles.wrap}>
      <FormField icon="person-outline" label="Player name" required error="A name is required">
        <TextInput
          style={s.inputError}
          value={value}
          onChangeText={setValue}
          placeholder="Ada Lovelace"
          placeholderTextColor={s.placeholder}
        />
      </FormField>
    </View>
  );
};

export const FilledState = () => {
  const s = useInputStyles();
  const [value, setValue] = useState("Cardboard Knights");
  return (
    <View style={styles.wrap}>
      <FormField icon="people-outline" label="Team" required>
        <TextInput
          style={s.input}
          value={value}
          onChangeText={setValue}
          placeholderTextColor={s.placeholder}
        />
      </FormField>
    </View>
  );
};

export const OptionalField = () => {
  const s = useInputStyles();
  const [value, setValue] = useState("");
  return (
    <View style={styles.wrap}>
      <FormField icon="chatbubble-ellipses-outline" label="Referee note">
        <TextInput
          style={s.input}
          value={value}
          onChangeText={setValue}
          placeholder="Optional — visible to admins only"
          placeholderTextColor={s.placeholder}
        />
      </FormField>
    </View>
  );
};

export const RoundForm = () => {
  const s = useInputStyles();
  const [name, setName] = useState("Semi-final");
  const [duration, setDuration] = useState("45");
  const [tables, setTables] = useState("0");
  return (
    <View style={styles.wrap}>
      <FormField icon="text-outline" label="Round name" required>
        <TextInput
          style={s.input}
          value={name}
          onChangeText={setName}
          placeholderTextColor={s.placeholder}
        />
      </FormField>
      <FormField icon="hourglass-outline" label="Duration (minutes)" required>
        <TextInput
          style={s.input}
          value={duration}
          onChangeText={setDuration}
          placeholderTextColor={s.placeholder}
        />
      </FormField>
      <FormField
        icon="grid-outline"
        label="Tables"
        required
        error="At least one table must be assigned"
      >
        <TextInput
          style={s.inputError}
          value={tables}
          onChangeText={setTables}
          placeholderTextColor={s.placeholder}
        />
      </FormField>
    </View>
  );
};
