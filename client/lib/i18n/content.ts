export type ContentLanguage = "de" | "en";

export type LocalizedText = Partial<Record<ContentLanguage, string>>;

const PREFIX = "__localized__:";

function languageOf(language: string | undefined): ContentLanguage {
  return language?.toLowerCase().startsWith("en") ? "en" : "de";
}

/**
 * Keeps localized schedule text in an existing string column, so it works with
 * existing Appwrite installations without a schema migration. Plain strings
 * written by older clients remain valid and are used as the fallback.
 */
export function readLocalizedText(value: string | undefined): LocalizedText {
  if (!value?.startsWith(PREFIX)) {
    return { de: value ?? "", en: value ?? "" };
  }
  try {
    const parsed = JSON.parse(value.slice(PREFIX.length));
    if (parsed && typeof parsed === "object") {
      return {
        de: typeof parsed.de === "string" ? parsed.de : "",
        en: typeof parsed.en === "string" ? parsed.en : "",
      };
    }
  } catch {
    // A malformed value should still be visible rather than disappearing.
  }
  return { de: value, en: value };
}

export function writeLocalizedText(text: LocalizedText): string {
  return PREFIX + JSON.stringify({ de: text.de?.trim() ?? "", en: text.en?.trim() ?? "" });
}

export function localizeText(
  value: string | undefined,
  language: string | undefined,
): string {
  const text = readLocalizedText(value);
  const preferred = languageOf(language);
  return text[preferred] || text.de || text.en || "";
}

export function localizeOptionText(
  fallback: string | undefined,
  translations: LocalizedText | undefined,
  language: string | undefined,
): string {
  const preferred = languageOf(language);
  return translations?.[preferred] || translations?.de || translations?.en || fallback || "";
}
