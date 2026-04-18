import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { tablesDB } from "../../../lib/appwrite";
import { useTheme } from "../../../lib/bootstrap/ThemeProvider";
import { inset } from "../../../lib/theme/spacing";
import { type } from "../../../lib/theme/typography";
import { Ionicons } from "@expo/vector-icons";
import { Query } from "react-native-appwrite";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const TABLE_ID = "tournament";

type TournamentRow = {
  $id: string;
  locale: "de" | "en";
  active: boolean;
  pin: string;
  type: "dmmib" | "europemasters";
};

type EnumPickerProps<T extends string> = {
  value: T;
  options: T[];
  labels: Record<T, string>;
  onChange: (value: T) => void;
};

function EnumPicker<T extends string>({
  value,
  options,
  labels,
  onChange,
}: EnumPickerProps<T>) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable style={styles.combobox} onPress={() => setOpen(true)}>
        <Text style={styles.comboboxText}>{labels[value]}</Text>
        <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.dropdown}>
            {options.map((opt) => {
              const active = value === opt;
              return (
                <Pressable
                  key={opt}
                  style={[
                    styles.dropdownItem,
                    active && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      active && styles.dropdownTextActive,
                    ]}
                  >
                    {labels[opt]}
                  </Text>
                  {active && (
                    <Ionicons name="checkmark" size={14} color={colors.text} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

type TournamentCardProps = {
  row: TournamentRow;
  onSaved: () => void;
};

function TournamentCard({ row, onSaved }: TournamentCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [locale, setLocale] = useState<"de" | "en">(row.locale);
  const [active, setActive] = useState(row.active);
  const [pin, setPin] = useState(row.pin);
  const [tournamentType, setTournamentType] = useState<"dmmib" | "europemasters">(row.type);

  const dirty =
    locale !== row.locale ||
    active !== row.active ||
    pin !== row.pin ||
    tournamentType !== row.type;

  const { mutate, isPending, isSuccess, error } = useMutation({
    mutationFn: () =>
      tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: TABLE_ID,
        rowId: row.$id,
        data: { locale, active, pin, type: tournamentType },
      }),
    onSuccess: onSaved,
  });

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardId} numberOfLines={1}>
          {row.$id}
        </Text>
        {active && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>ACTIVE</Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>Locale</Text>
        <EnumPicker<"de" | "en">
          value={locale}
          options={["de", "en"]}
          labels={{ de: "German (de)", en: "English (en)" }}
          onChange={setLocale}
        />
      </View>

      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>Type</Text>
        <EnumPicker<"dmmib" | "europemasters">
          value={tournamentType}
          options={["dmmib", "europemasters"]}
          labels={{ dmmib: "DMMiB", europemasters: "Europe Masters" }}
          onChange={setTournamentType}
        />
      </View>

      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>PIN</Text>
        <TextInput
          style={styles.pinInput}
          value={pin}
          onChangeText={setPin}
          placeholder="Enter PIN"
          placeholderTextColor={colors.textPlaceholder}
          secureTextEntry={false}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>Active</Text>
        <Switch
          value={active}
          onValueChange={setActive}
          trackColor={{ false: colors.border, true: colors.accent }}
          thumbColor={colors.text}
        />
      </View>

      {error && <Text style={styles.errorText}>{(error as Error).message}</Text>}

      <View style={styles.cardFooter}>
        {isSuccess && !dirty && (
          <View style={styles.savedIndicator}>
            <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
            <Text style={styles.savedText}>Saved</Text>
          </View>
        )}
        <Pressable
          style={[
            styles.saveButton,
            (!dirty || isPending) && styles.saveButtonDisabled,
          ]}
          onPress={() => mutate()}
          disabled={!dirty || isPending}
        >
          {isPending ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { data, isLoading, error, refetch } = useQuery<TournamentRow[]>({
    queryKey: ["admin-tournaments"],
    queryFn: async () => {
      const res = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLE_ID,
        queries: [Query.orderDesc("$createdAt"), Query.limit(25)],
      });
      return res.rows as unknown as TournamentRow[];
    },
  });

  function handleSaved() {
    queryClient.invalidateQueries({ queryKey: ["tournament"] });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Admin</Text>
        <Text style={styles.title}>Tournament Settings</Text>
      </View>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {error && (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load tournaments.</Text>
          <Pressable onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {data && (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {data.length === 0 && (
            <Text style={styles.emptyText}>No tournament rows found.</Text>
          )}
          {data.map((row) => (
            <TournamentCard key={row.$id} row={row} onSaved={handleSaved} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: inset.screen,
      paddingTop: inset.screenTopTall,
      paddingBottom: inset.screenBottom,
    },
    header: {
      marginBottom: inset.group,
    },
    eyebrow: {
      ...type.eyebrow,
      color: colors.accent,
      marginBottom: inset.tight,
    },
    title: {
      ...type.h1,
      color: colors.text,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    list: {
      gap: inset.list,
      paddingBottom: inset.screenBottom,
    },
    // Card
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: inset.card,
      overflow: "hidden",
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: inset.tight,
    },
    cardId: {
      ...type.caption,
      color: colors.textMuted,
      flex: 1,
      marginRight: 8,
    },
    activeBadge: {
      backgroundColor: colors.accent,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    activeBadgeText: {
      ...type.eyebrow,
      color: "#fff",
      fontSize: 9,
    },
    divider: {
      height: 1,
      backgroundColor: colors.divider,
      marginBottom: inset.tight,
    },
    fieldRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    fieldLabel: {
      ...type.bodySmall,
      color: colors.textSecondary,
    },
    pinInput: {
      ...type.bodySmall,
      color: colors.text,
      backgroundColor: colors.surfaceHigh,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      paddingVertical: 6,
      paddingHorizontal: 10,
      minWidth: 120,
      textAlign: "right",
    },
    cardFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 12,
      marginTop: 12,
    },
    savedIndicator: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    savedText: {
      ...type.bodySmall,
      color: colors.accent,
    },
    saveButton: {
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 20,
      minWidth: 72,
      alignItems: "center",
    },
    saveButtonDisabled: {
      opacity: 0.4,
    },
    saveButtonText: {
      ...type.button,
      color: "#fff",
      fontSize: 14,
    },
    errorText: {
      ...type.bodySmall,
      color: colors.error,
      marginTop: 4,
    },
    retryButton: {
      marginTop: 12,
      paddingVertical: 8,
      paddingHorizontal: 20,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    retryText: {
      ...type.button,
      color: colors.text,
      fontSize: 14,
    },
    emptyText: {
      ...type.body,
      color: colors.textMuted,
      textAlign: "center",
      marginTop: 40,
    },
    // Combobox / dropdown
    combobox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.surfaceHigh,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    comboboxText: {
      ...type.bodySmall,
      color: colors.text,
    },
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    dropdown: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      minWidth: 200,
      overflow: "hidden",
    },
    dropdownItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    dropdownItemActive: {
      backgroundColor: colors.surfaceHigh,
    },
    dropdownText: {
      ...type.bodySmall,
      color: colors.textSecondary,
    },
    dropdownTextActive: {
      color: colors.text,
      fontWeight: "600",
    },
  });
}
