import { vi, LocaleTranslations } from "./vi";
import { en } from "./en";

export type SupportedLocale = "vi" | "en";

const dictionaries: Record<SupportedLocale, LocaleTranslations> = {
  vi,
  en,
};

let currentLocale: SupportedLocale = "vi";

export function setLocale(locale: SupportedLocale) {
  currentLocale = locale;
}

export function getLocale(): SupportedLocale {
  return currentLocale;
}

export function getDictionary(locale?: SupportedLocale): LocaleTranslations {
  return dictionaries[locale || currentLocale] || vi;
}

/**
 * Lấy chuỗi ngôn ngữ theo dot notation (VD: t("builder.title") hoặc t("messages.templateSavedSuccess"))
 */
export function t(path: string, params?: Record<string, any>, locale?: SupportedLocale): string {
  const dict = getDictionary(locale);
  const keys = path.split(".");
  let current: any = dict;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = current[key];
    } else {
      return path; // Fallback to path key if missing
    }
  }

  if (typeof current !== "string") {
    return path;
  }

  let result = current;
  if (params) {
    Object.keys(params).forEach((paramKey) => {
      result = result.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(params[paramKey]));
    });
  }

  return result;
}

export { vi, en };
