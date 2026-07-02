import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import { getItemAsync } from "../secureStorage";
import german from "./translations/de";
import english from "./translations/en";

export const LANGUAGE_STORE_KEY = "app_language";

// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  resources: {
    de: german,
    en: english,
  },
  lng: "de",
});

getItemAsync(LANGUAGE_STORE_KEY).then((lang) => {
  if (lang) {
    // eslint-disable-next-line import/no-named-as-default-member
    i18n.changeLanguage(lang);
  } else {
    const systemLang = getLocales()[0]?.languageCode === "de" ? "de" : "en";
    // eslint-disable-next-line import/no-named-as-default-member
    i18n.changeLanguage(systemLang);
  }
});

export default i18n;
