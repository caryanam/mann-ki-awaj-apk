import React, { createContext, useContext, useState, useEffect } from 'react';
import { UI_DICTIONARY, SUPPORTED_LANGUAGES } from '../utils/translations';
import { apiTranslationService } from '../services/apiTranslationService';
import { apiService } from '../services/apiService';
import { localStorage } from '../services/localStorage';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState('EN');
  const [translationCache, setTranslationCache] = useState({});

  // Sync preferred language from profile DB on mount if logged in
  useEffect(() => {
    async function syncLanguage() {
      try {
        const token = localStorage.getItem('auth_token');
        if (token && !token.startsWith('mock')) {
          const profile = await apiService.getMyProfile();
          if (profile?.preferredLanguage) {
            const normalized = profile.preferredLanguage === 'Hindi' ? 'HI' : (profile.preferredLanguage === 'Marathi' ? 'MR' : 'EN');
            setCurrentLanguage(normalized);
          }
        }
      } catch (err) {
        console.warn('[LanguageContext] Failed to sync language from DB:', err.message);
      }
    }
    syncLanguage();
  }, []);

  const changeLanguage = async (langCode) => {
    if (!langCode || langCode === currentLanguage) return;

    setCurrentLanguage(langCode);

    try {
      const token = localStorage.getItem('auth_token');
      if (token && !token.startsWith('mock')) {
        // Normalize code for backend: 'HI' -> 'Hindi', 'MR' -> 'Marathi', 'EN' -> 'English'
        const backendLang = langCode === 'HI' ? 'Hindi' : (langCode === 'MR' ? 'Marathi' : 'English');
        await apiService.updateLanguage(backendLang);
      }
    } catch (err) {
      console.warn('[LanguageContext] Failed to update language on backend:', err.message);
    }
  };

  const t = (key, defaultText) => {
    // Resolve key code
    const langKey = currentLanguage === 'HI' ? 'Hindi' : (currentLanguage === 'MR' ? 'Marathi' : 'English');
    const dict = UI_DICTIONARY[langKey];
    if (dict && dict[key]) return dict[key];

    // Fallback to English dictionary or default text
    return UI_DICTIONARY['English']?.[key] || defaultText || key;
  };

  const translateTextAsync = async (text, targetLang = currentLanguage, sourceLang = null) => {
    if (!text || !text.trim()) return text;
    // Map code HI/MR -> hin_Deva/mar_Deva
    const mappedTarget = targetLang === 'HI' ? 'hin_Deva' : (targetLang === 'MR' ? 'mar_Deva' : 'eng_Latn');
    const cacheKey = `${sourceLang || 'AUTO'}_${targetLang}_${text.trim()}`;
    if (translationCache[cacheKey]) return translationCache[cacheKey];

    try {
      const result = await apiTranslationService.translateText(text, mappedTarget, sourceLang);
      setTranslationCache(prev => ({ ...prev, [cacheKey]: result }));
      return result;
    } catch (err) {
      console.warn('[LanguageContext] Async translation failed:', err.message);
      return text;
    }
  };

  const translateText = (text, targetLang = currentLanguage, sourceLang = null) => {
    if (!text || !text.trim()) return text;
    const cacheKey = `${sourceLang || 'AUTO'}_${targetLang}_${text.trim()}`;
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }
    // Fire dynamic background request
    translateTextAsync(text, targetLang, sourceLang);
    return text;
  };

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      changeLanguage,
      t,
      translateText,
      translateTextAsync,
      supportedLanguages: SUPPORTED_LANGUAGES,
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
