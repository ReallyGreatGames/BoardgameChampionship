import { Models } from "react-native-appwrite";
import { Player } from "./player";

export type Table = {
  tableNumber: number;
  game: string;
  players: Player[];
} & Models.Document;
