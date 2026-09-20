type WorkbenchI18nDictionary = Record<string, Record<string, string>>;

let currentLang = 'en';
let dictionary: WorkbenchI18nDictionary = {};

export function configureWorkbenchI18n(nextDictionary: WorkbenchI18nDictionary): void {
  dictionary = nextDictionary;
}

export function setLang(lang: string): void {
  currentLang = lang;
}

export function getLang(): string {
  return currentLang;
}

export function t(key: string): string {
  return dictionary[currentLang]?.[key] ?? dictionary.en?.[key] ?? key;
}
