import { Markdown, StyleSheet, View, type } from "boardgame-championship";

const styles = StyleSheet.create({
  wrap: { padding: 16, maxWidth: 420 },
});

export const Rules = () => (
  <View style={styles.wrap}>
    <Markdown textStyle={type.body}>
      {"## Tournament rules\n\n- Be kind\n- Play fair\n\nRead the **full rules** before round one."}
    </Markdown>
  </View>
);

export const RichText = () => (
  <View style={styles.wrap}>
    <Markdown textStyle={type.body}>
      {[
        "# Round 3 — Catan",
        "",
        "Each table plays **one full game**. Scoring:",
        "",
        "1. Winner takes 3 points",
        "2. Runner-up takes 1 point",
        "3. Everyone else scores 0",
        "",
        "> Ties are broken by longest road, then by largest army.",
        "",
        "Questions? Ask your `table captain` before the round starts.",
      ].join("\n")}
    </Markdown>
  </View>
);

export const Caption = () => (
  <View style={styles.wrap}>
    <Markdown textStyle={type.bodySmall}>
      {"Submitted by *Meeple United* — awaiting a second signature."}
    </Markdown>
  </View>
);
