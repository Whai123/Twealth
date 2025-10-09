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
import vi from './locales/vi.json';
import tl from './locales/tl.json';
import ms from './locales/ms.json';
import tr from './locales/tr.json';
import ar from './locales/ar.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  id: { translation: id },
  th: { translation: th },
  pt: { translation: pt },
  hi: { translation: hi },
  vi: { translation: vi },
  tl: { translation: tl },
  ms: { translation: ms },
  tr: { translation: tr },
  ar: { translation: ar }
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