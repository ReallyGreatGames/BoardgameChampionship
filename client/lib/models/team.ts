import { Models } from "react-native-appwrite";

export type Team = {
  name: string;
  code: string;
  country: string;
} & Models.Document;
