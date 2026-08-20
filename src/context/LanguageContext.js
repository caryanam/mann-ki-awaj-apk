import React, { createContext, useContext, useState, useEffect } from 'react';
import { UI_DICTIONARY, SUPPORTED_LANGUAGES } from '../utils/translations';
import { apiTranslationService, detectTextLanguage, normalizeLanguageCode } from '../services/apiTranslationService';
import { apiService } from '../services/apiService';
import { localStorage } from '../services/localStorage';
import { useAuth } from './AuthContext';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState('EN');
  const [translationCache, setTranslationCache] = useState({});
  const { currentUser, updateProfile } = useAuth();

  // Sync preferred language from profile DB or Auth context reactively
  useEffect(() => {
    async function syncLanguage() {
      try {
        if (currentUser) {
          const preferred = currentUser.profile?.preferredLanguage || currentUser.preferredLanguage;
          if (preferred) {
            const langObj = SUPPORTED_LANGUAGES.find(l => l.label === preferred);
            const normalized = langObj ? langObj.code : 'EN';
            if (normalized !== currentLanguage) {
              setCurrentLanguage(normalized);
            }
            return;
          }
        }
        
        const token = localStorage.getItem('auth_token');
        if (token && !token.startsWith('mock')) {
          const profile = await apiService.getMyProfile();
          if (profile?.preferredLanguage) {
            const langObj = SUPPORTED_LANGUAGES.find(l => l.label === profile.preferredLanguage);
            const normalized = langObj ? langObj.code : 'EN';
            if (normalized !== currentLanguage) {
              setCurrentLanguage(normalized);
            }
          }
        }
      } catch (err) {
        console.warn('[LanguageContext] Failed to sync language from DB:', err.message);
      }
    }
    syncLanguage();
  }, [currentUser, currentLanguage]);

  const changeLanguage = async (langCode) => {
    if (!langCode || langCode === currentLanguage) return;

    setCurrentLanguage(langCode);

    // Normalize code for backend dynamically from SUPPORTED_LANGUAGES
    const langObj = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    const backendLang = langObj ? langObj.label : 'English';

    try {
      const token = localStorage.getItem('auth_token');
      if (token && !token.startsWith('mock')) {
        await apiService.updateLanguage(backendLang);
      }
      
      // Update local profile preferredLanguage if user is logged in
      if (currentUser && updateProfile) {
        const updatedProfile = { 
          ...(currentUser.profile || {}), 
          preferredLanguage: backendLang 
        };
        updateProfile({ profile: updatedProfile, preferredLanguage: backendLang });
      }
    } catch (err) {
      console.warn('[LanguageContext] Failed to update language on backend:', err.message);
    }
  };

  const t = (key, defaultText) => {
    // Resolve key code dynamically
    const langObj = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage);
    const langKey = langObj ? langObj.label : 'English';
    const dict = UI_DICTIONARY[langKey];
    if (dict && dict[key]) return dict[key];

    // Fallback to English dictionary or default text
    return UI_DICTIONARY['English']?.[key] || defaultText || key;
  };

  const getCacheKey = (text, targetLang, sourceLang) => {
    const src = sourceLang ? (normalizeLanguageCode(sourceLang) || 'EN') : detectTextLanguage(text);
    const target = normalizeLanguageCode(targetLang) || 'EN';
    return `${src}_${target}_${text.trim()}`;
  };

  const translateTextAsync = async (text, targetLang = currentLanguage, sourceLang = null) => {
    if (!text || !text.trim()) return text;
    
    const cacheKey = getCacheKey(text, targetLang, sourceLang);
    
    if (translationCache[cacheKey]) return translationCache[cacheKey];

    try {
      const result = await apiTranslationService.translateText(text, targetLang, sourceLang);
      setTranslationCache(prev => ({ ...prev, [cacheKey]: result }));
      return result;
    } catch (err) {
      console.warn('[LanguageContext] Async translation failed:', err.message);
      return text;
    }
  };

  const translateText = (text, targetLang = currentLanguage, sourceLang = null) => {
    if (!text || !text.trim()) return text;
    
    const cacheKey = getCacheKey(text, targetLang, sourceLang);
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
      translationCache,
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
