import { Models } from "react-native-appwrite";
import { Player } from "./player";

export type Table = {
  tableNumber: number;
  game: string | { $id: string };
  players: Player[];
} & Models.Row & Models.Document;

