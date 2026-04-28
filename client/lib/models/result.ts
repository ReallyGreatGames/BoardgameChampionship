import { Models } from "react-native-appwrite";


export type Result = {
  gameId: string;
  table: number;
  note?: string;
  placements?: string[];
  scores?: number[];
  signatureIds?: string[];
  submitted: boolean;
} & Models.Document;
