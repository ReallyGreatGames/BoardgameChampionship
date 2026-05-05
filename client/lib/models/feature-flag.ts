import { Models } from "react-native-appwrite";

export type FeatureFlag = {
  feature: string;
  slug: string;
  enabled: boolean;
} & Models.Document;
