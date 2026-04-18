import { Models } from "react-native-appwrite";

/**
 * Active = actualStartTime set and no actualEndTime
 */
export type Schedule = {
  sortIndex: number;
  title: string;
  icon?: string;
  description?: string;
  /**
   * In minutes
   */
  durationPlanned: number;
  gameId?: string;
  startTimePlanned: string;
  startTimeActual?: string;
  endTimeActual?: string;
  isActive?: boolean;
  isFinished?: boolean;
} & Models.Document;