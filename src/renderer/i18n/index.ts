// Språkstödsmodul
import sv from './sv';
import en from './en';
import fi from './fi';
import no from './no';
import da from './da';

// Typ för översättningsobjekt
export type TranslationObject = {
  [key: string]: string | TranslationObject;
};

// Exportera alla språk
export const translations: { [key: string]: TranslationObject } = {
  sv,
  en,
  fi,
  no,
  da
};

// Standardspråk
export const DEFAULT_LANGUAGE = 'sv';

// Hämta en översättningstext baserat på en nyckel med punktnotation (t.ex. "common.welcome")
export const translate = (key: string, language: string = DEFAULT_LANGUAGE): string => {
  // Kontrollera om språket finns
  if (!translations[language]) {
    console.warn(`Språk "${language}" finns inte. Använder standardspråket istället.`);
    language = DEFAULT_LANGUAGE;
  }

  // Dela upp nyckeln i delar (t.ex. "common.welcome" -> ["common", "welcome"])
  const keyParts = key.split('.');
  
  // Börja med hela översättningsmappen för det valda språket
  let translation: any = translations[language];
  
  // Navigera genom översättningsobjektet
  for (const part of keyParts) {
    if (translation[part] === undefined) {
      // Om översättning saknas, försök med standardspråket
      if (language !== DEFAULT_LANGUAGE) {
        return translate(key, DEFAULT_LANGUAGE);
      }
      console.warn(`Översättningsnyckel "${key}" hittades inte.`);
      return key; // Returnera nyckeln som fallback
    }
    translation = translation[part];
  }
  
  return translation as string;
};

// Fördefinierad React-hook för att använda översättningar
import { useCallback } from 'react';

export const useTranslation = (language: string = DEFAULT_LANGUAGE) => {
  const t = useCallback(
    (key: string): string => translate(key, language),
    [language]
  );
  
  return { t, language };
}; 