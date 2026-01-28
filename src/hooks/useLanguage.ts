import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

export type Language = 'en' | 'es';

export const useLanguage = () => {
  const { i18n } = useTranslation();

  const currentLanguage = i18n.language as Language;

  const changeLanguage = useCallback((lang: Language) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  }, [i18n]);

  const toggleLanguage = useCallback(() => {
    const newLang = currentLanguage === 'en' ? 'es' : 'en';
    changeLanguage(newLang);
  }, [currentLanguage, changeLanguage]);

  return {
    currentLanguage,
    changeLanguage,
    toggleLanguage,
    languages: [
      { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
      { code: 'es' as Language, name: 'Español', flag: '🇪🇸' }
    ]
  };
};
