import { useState } from "react";
import {
  FormField,
  ResizableTextInput,
  StyleSheet,
  View,
  inset,
  ui,
  useTheme,
  type as typography,
} from "boardgame-championship";

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 20, maxWidth: 380 },
});

function useInputStyle() {
  const { colors } = useTheme();
  return {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: ui.inputRadius,
    paddingHorizontal: inset.card,
  };
}

export const RuleText = () => {
  const input = useInputStyle();
  const [value, setValue] = useState(
    "Trading resources between players is not allowed during the final round of the championship bracket.",
  );
  return (
    <View style={styles.wrap}>
      <ResizableTextInput
        value={value}
        onChangeText={setValue}
        style={input}
        resetOn={false}
      />
    </View>
  );
};

export const EmptyWithPlaceholder = () => {
  const input = useInputStyle();
  const [value, setValue] = useState("");
  return (
    <View style={styles.wrap}>
      <ResizableTextInput
        value={value}
        onChangeText={setValue}
        placeholder="Describe the house rule…"
        style={input}
        resetOn={false}
      />
    </View>
  );
};

export const InRuleForm = () => {
  const input = useInputStyle();
  const [value, setValue] = useState(
    "Longest road counts for 2 victory points instead of 3 in the Championship format.",
  );
  return (
    <View style={styles.wrap}>
      <FormField icon="document-text-outline" label="Rule text" required>
        <ResizableTextInput
          value={value}
          onChangeText={setValue}
          placeholder="Describe the house rule…"
          style={input}
          resetOn={false}
        />
      </FormField>
    </View>
  );
};

export const ImportPasteBox = () => {
  const input = useInputStyle();
  const [value, setValue] = useState(
    "1. Setup takes 5 minutes.\n2. Rounds are 45 minutes.\n3. Ties break on strength of schedule.",
  );
  return (
    <View style={styles.wrap}>
      <FormField icon="clipboard-outline" label="Paste rules to import">
        <ResizableTextInput
          value={value}
          onChangeText={setValue}
          style={input}
          resetOn={false}
        />
      </FormField>
    </View>
  );
};
