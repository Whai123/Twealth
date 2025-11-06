import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Languages that use RTL (right-to-left) text direction
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

export function RTLProvider({ children }: { children: React.ReactNode }) {
 const { i18n } = useTranslation();

 useEffect(() => {
  const isRTL = RTL_LANGUAGES.includes(i18n.language);
  const direction = isRTL ? 'rtl' : 'ltr';
  
  // Set direction on HTML element
  document.documentElement.setAttribute('dir', direction);
  document.documentElement.setAttribute('lang', i18n.language);
  
  // Add/remove RTL class for CSS styling
  if (isRTL) {
   document.documentElement.classList.add('rtl');
  } else {
   document.documentElement.classList.remove('rtl');
  }
 }, [i18n.language]);

 return <>{children}</>;
}
