import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from"@/components/ui/select";

const languages = [
 { code: 'en', name: 'English' },
 { code: 'es', name: 'Español' },
 { code: 'ar', name: 'العربية' },
 { code: 'th', name: 'ไทย' },
 { code: 'id', name: 'Bahasa Indonesia' },
 { code: 'pt', name: 'Português' },
 { code: 'hi', name: 'हिंदी' },
 { code: 'vi', name: 'Tiếng Việt' },
 { code: 'tl', name: 'Filipino' },
 { code: 'ms', name: 'Bahasa Melayu' },
 { code: 'tr', name: 'Türkçe' },
];

export default function LanguageSwitcher() {
 const { i18n } = useTranslation();

 const handleLanguageChange = (languageCode: string) => {
  i18n.changeLanguage(languageCode);
 };

 const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

 return (
  <Select value={i18n.language} onValueChange={handleLanguageChange}>
   <SelectTrigger className="w-40 h-9 text-sm" data-testid="language-switcher">
    <div className="flex items-center gap-2">
     <Globe className="w-4 h-4" />
     <span className="hidden sm:inline">{currentLanguage.name}</span>
    </div>
   </SelectTrigger>
   <SelectContent>
    {languages.map((language) => (
     <SelectItem key={language.code} value={language.code}>
      {language.name}
     </SelectItem>
    ))}
   </SelectContent>
  </Select>
 );
}