import { Models } from "react-native-appwrite";

export type RuleType = "change" | "addition" | "clarification";

export type Rule = {
  gameId: string;
  type: RuleType;
  text: string;
  title: string;
} & Models.Document;
