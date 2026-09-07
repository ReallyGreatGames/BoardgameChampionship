// Browser shim for expo-localization (design-sync bundle only).
// lib/i18n/i18n.ts calls getLocales() to pick the initial language. This
// reports a FIXED en-US rather than the viewer's navigator locale: the locale
// decides preview copy, so reading it from the environment would make cards
// render differently per machine and churn the sync's render hashes. The
// authored previews are written in English, so en-US keeps every card coherent.
export function getLocales() {
  return [{ languageTag: "en-US", languageCode: "en", regionCode: "US" }];
}

export function getCalendars() {
  return [{ calendar: "gregory", timeZone: "UTC", uses24hourClock: true, firstWeekday: 1 }];
}
