export const EMPTY = Symbol("empty");

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}