import { Button, StyleSheet, View } from "boardgame-championship";

const styles = StyleSheet.create({
  stack: { gap: 16, padding: 16, maxWidth: 320 },
});

export const StartRound = () => (
  <View style={styles.stack}>
    <Button label="Start round" icon="play" onPress={() => {}} />
  </View>
);

export const Variants = () => (
  <View style={styles.stack}>
    <Button label="Start round" icon="play" onPress={() => {}} />
    <Button label="Save draft" variant="secondary" onPress={() => {}} />
    <Button label="View rules" variant="ghost" onPress={() => {}} />
    <Button label="Delete result" variant="danger" icon="trash-outline" onPress={() => {}} />
  </View>
);

export const States = () => (
  <View style={styles.stack}>
    <Button label="Saving" loading onPress={() => {}} />
    <Button label="Unavailable" disabled onPress={() => {}} />
  </View>
);
