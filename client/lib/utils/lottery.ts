import { Models } from "react-native-appwrite";

/**
 * Lottery photos have no database row — the game they belong to is encoded
 * directly in the storage file's name (`lottery_<gameId>_<uploadedAt>.<ext>`),
 * and the bucket listing is the source of truth.
 */
const FILENAME_PATTERN = /^lottery_(.+)_(\d+)\.[^.]+$/;

export function buildLotteryFileName(gameId: string, extension: string): string {
  return `lottery_${gameId}_${Date.now()}.${extension}`;
}

export function parseLotteryFileName(name: string): { gameId: string } | null {
  const match = name.match(FILENAME_PATTERN);
  if (!match) {
    return null;
  }
  return { gameId: match[1] };
}

export type NumberedLotteryPhoto = {
  fileId: string;
  gameId: string;
  createdAt: string;
  number: number;
};

/** Filters a bucket file listing down to one game's photos, numbered by upload order (oldest = 1), newest first. */
export function getLotteryPhotosForGame(
  files: Models.File[],
  gameId: string,
): NumberedLotteryPhoto[] {
  const chronological = files
    .map((file) => {
      const info = parseLotteryFileName(file.name);
      if (!info || info.gameId !== gameId) {
        return null;
      }
      return { fileId: file.$id, gameId: info.gameId, createdAt: file.$createdAt };
    })
    .filter((x): x is Omit<NumberedLotteryPhoto, "number"> => x !== null)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((photo, i) => ({ ...photo, number: i + 1 }));

  return [...chronological].reverse();
}
