import { ReactNode, useEffect } from "react";
import {
  DialogProvider,
  StyleSheet,
  Text,
  View,
  space,
  type,
  useDialog,
  useTheme,
} from "boardgame-championship";

// DialogProvider only paints once confirm() has been called, so each cell
// mounts the provider around a screen and fires confirm() from an effect —
// the same call the app makes from a press handler.
type Options = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string | null;
  destructive?: boolean;
  icon?: string;
};

const styles = StyleSheet.create({
  screen: { padding: 24, gap: space[3] },
  screenTitle: { ...type.h2 },
  screenLine: { ...type.body },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: space[3],
    borderBottomWidth: 1,
  },
  rowLabel: { ...type.body },
  rowValue: { ...type.body, fontWeight: "700" },
});

function AutoOpen({ options, children }: { options: Options; children: ReactNode }) {
  const { confirm } = useDialog();
  useEffect(() => {
    void confirm(options);
    // confirm is a stable useCallback; the options are fixed per cell.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirm]);
  return <>{children}</>;
}

function Screen({ heading, rows }: { heading: string; rows: [string, string][] }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Text style={[styles.screenTitle, { color: colors.text }]}>{heading}</Text>
      {rows.map(([label, value]) => (
        <View key={label} style={[styles.row, { borderBottomColor: colors.divider }]}>
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{label}</Text>
          <Text style={[styles.rowValue, { color: colors.text }]}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

export const DestructiveConfirm = () => (
  <DialogProvider>
    <AutoOpen
      options={{
        title: "Delete result?",
        message: "Round 3, table 2 — Meeple United vs Dice & Glory. This cannot be undone.",
        confirmLabel: "Delete",
        destructive: true,
      }}
    >
      <Screen
        heading="Round 3 results"
        rows={[
          ["Table 1", "Cardboard Knights"],
          ["Table 2", "Meeple United"],
          ["Table 3", "The Rulebook Rebels"],
        ]}
      />
    </AutoOpen>
  </DialogProvider>
);

export const InfoOnly = () => (
  <DialogProvider>
    <AutoOpen
      options={{
        title: "Tie breakers",
        message:
          "Ties are broken by head-to-head result first, then strength of schedule, then total victory points.",
        cancelLabel: null,
      }}
    >
      <Screen
        heading="Standings"
        rows={[
          ["1. Meeple United", "18 pts"],
          ["2. Cardboard Knights", "18 pts"],
          ["3. Dice & Glory", "12 pts"],
        ]}
      />
    </AutoOpen>
  </DialogProvider>
);

export const WithIcon = () => (
  <DialogProvider>
    <AutoOpen
      options={{
        title: "Publish the final standings?",
        message: "All 24 players will be notified and the tournament closes for new results.",
        confirmLabel: "Publish",
        cancelLabel: "Not yet",
        icon: "trophy-outline",
      }}
    >
      <Screen
        heading="Tournament admin"
        rows={[
          ["Rounds played", "6 of 6"],
          ["Results signed", "24 of 24"],
          ["Status", "Ready to publish"],
        ]}
      />
    </AutoOpen>
  </DialogProvider>
);

export const TitleOnly = () => (
  <DialogProvider>
    <AutoOpen options={{ title: "Start round 4?", confirmLabel: "Start" }}>
      <Screen
        heading="Schedule"
        rows={[
          ["Round 4", "Ticket to Ride"],
          ["Starts", "14:30"],
          ["Tables ready", "4 of 4"],
        ]}
      />
    </AutoOpen>
  </DialogProvider>
);
