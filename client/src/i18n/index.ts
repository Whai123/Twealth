import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
import en from './locales/en.json';
import es from './locales/es.json';
import id from './locales/id.json';
import th from './locales/th.json';
import pt from './locales/pt.json';
import hi from './locales/hi.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  id: { translation: id },
  th: { translation: th },
  pt: { translation: pt },
  hi: { translation: hi }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    },
    
    interpolation: {
      escapeValue: false
    },
    
    react: {
      useSuspense: false
    }
  });

export default i18n;