import { useState } from "react";
import { ActivityIndicator, Button, Text, View } from "react-native";
import client from "../lib/appwrite";
import { Locale } from "react-native-appwrite"

const locale = new Locale(client);

export default function Index() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ping() {
    setLoading(true);
    setStatus(null);
    try {
      // const res = await client.ping();
      const res = await locale.get();
      
      setStatus(`Pong: ${res.ip}`);
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 16 }}>
      <Button title="Ping Appwrite" onPress={ping} disabled={loading} />
      {loading && <ActivityIndicator />}
      {status && <Text>{status}</Text>}
    </View>
  );
}
