import { Models } from "react-native-appwrite";
import { Team } from "./team";

export type Player = {
  name: string;
  team: Team;
  playerNumber: number;
  playerCode: string;
} & Models.Document;
