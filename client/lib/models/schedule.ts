import { Models } from "react-native-appwrite";

export type Schedule = {
  sortIndex: number;
  title: string;
  icon?: string;
  description?: string;
  durationPlanned: number;
  gameId?: string;
  startTimePlanned: string;
  isActive?: boolean;
  isFinished?: boolean;
  allowUserChange?: boolean;
} & Models.Document;