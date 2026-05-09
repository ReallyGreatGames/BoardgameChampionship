import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SvgXml } from "react-native-svg";
import { SIGNATURES_BUCKET_ID, storage } from "../appwrite";
import { useTheme } from "../bootstrap/ThemeProvider";
import { injectViewBox } from "../utils";

type Props = {
  fileId: string | undefined | null;
};

export function SignatureSlot({ fileId }: Props) {
  const { colors } = useTheme();
  const [svg, setSvg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!fileId) { setSvg(null); setError(false); setLoading(false); return; }
    setSvg(null);
    setError(false);
    setLoading(true);
    storage
      .getFileView({ bucketId: SIGNATURES_BUCKET_ID, fileId })
      .then((buffer) => setSvg(new TextDecoder("utf-8").decode(buffer)))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [fileId]);

  const borderColor = fileId ? colors.primary + "66" : colors.border;

  return (
    <View style={[styles.container, { borderColor, backgroundColor: "#ffffff" }]}>
      {loading && <ActivityIndicator size="small" color={colors.textMuted} />}
      {!loading && svg && <SvgXml xml={injectViewBox(svg)} width={64} height={40} />}
      {!loading && !svg && !error && (
        <Ionicons name="create-outline" size={20} color={colors.textMuted} />
      )}
      {error && (
        <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 68,
    height: 44,
    borderWidth: 1,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
