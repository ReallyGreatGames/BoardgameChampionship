import { Account, Client, ID, Storage, TablesDB } from "react-native-appwrite";

function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing ${name}. Copy .env.example to .env.local and fill in Appwrite config.`);
  }
  return value;
}

const endpoint = requireEnv("EXPO_PUBLIC_APPWRITE_ENDPOINT", process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT);
const projectId = requireEnv("EXPO_PUBLIC_APPWRITE_PROJECT_ID", process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);
export const DATABASE_ID = requireEnv(
  "EXPO_PUBLIC_APPWRITE_DATABASE_ID",
  process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
);

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setPlatform("games.reallygreat.bgchampion");

const HEARTBEAT_INTERVAL_MS = 20000;

const realtime = (client as any).realtime;
if (realtime) {
  realtime.createHeartbeat = () => {
    if (realtime.heartbeat) {
      clearInterval(realtime.heartbeat);
    }
    realtime.heartbeat = setInterval(() => {
      const socket: WebSocket | undefined = realtime.socket;
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        return;
      }
      try {
        socket.send(JSON.stringify({ type: "ping" }));
      } catch (e) {
        console.warn("[realtime] heartbeat ping failed", e);
      }
    }, HEARTBEAT_INTERVAL_MS);
  };
}

const account = new Account(client);
const tablesDB = new TablesDB(client);
const storage = new Storage(client);

export const SIGNATURES_BUCKET_ID = "signatures";
export const LOTTERY_BUCKET_ID = "lottery";

export { account, client, ID, storage, tablesDB };

