import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import german from "./translations/de";
import english from "./translations/en";

// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  resources: {
    de: german,
    en: english,
  },
  lng: "en",
});

export default i18n;
