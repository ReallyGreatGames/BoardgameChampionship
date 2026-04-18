import { Account, Client, TablesDB } from "react-native-appwrite";

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!)
  .setPlatform("games.reallygreat.bgchampion");

const account = new Account(client);
const tablesDB = new TablesDB(client);

export const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;


export { account, client, tablesDB };

