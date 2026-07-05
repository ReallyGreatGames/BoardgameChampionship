import { Models } from "react-native-appwrite";

export type Tournament = {
  locale: "de" | "en";
  active: boolean;
  pin: string;
  type: "dmmib" | "europemasters";
} & Models.Document;
