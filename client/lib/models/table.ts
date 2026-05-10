import { Models } from "react-native-appwrite";
import { Player } from "./player";
import { Game } from "./game"

export type Table = {
  tableNumber: number;
  players: Player[];
  game: Game;
} & Models.Row & Models.Document;

