import { Href, router } from "expo-router";

const backHistory: string[] = [];

export function goTo(origin: string, href: string): void {
  backHistory.push(origin);
  router.push(href as Href);
}

export function goBackTo(fallback: string): void {
  const previous = backHistory.pop();
  router.replace((previous ?? fallback) as Href);
}

export function redirectTo(href: string): void {
  router.replace(href as Href);
}

export function resetBackHistory(): void {
  backHistory.length = 0;
}
