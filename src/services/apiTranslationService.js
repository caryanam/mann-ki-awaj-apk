import { apiService } from './apiService';

// Mapping UI language names, 2-letter ISO codes, and FLORES-200 codes to standard ISO codes
export const LANGUAGE_MAP = {
  // 2-Letter ISO Codes
  EN: 'EN',
  HI: 'HI',
  MR: 'MR',
  PA: 'PA',
  TA: 'TA',
  TE: 'TE',
  GU: 'GU',
  BN: 'BN',
  KN: 'KN',
  ML: 'ML',
  OR: 'OR',
  AS: 'AS',
  UR: 'UR',
  SAT: 'SAT',
  KS: 'KS',
  MNI: 'MNI',
  DOI: 'DOI',
  BHO: 'BHO',
  AUTO: 'AUTO',

  // Full Display Names
  English: 'EN',
  Hindi: 'HI',
  Marathi: 'MR',
  Punjabi: 'PA',
  Tamil: 'TA',
  Telugu: 'TE',
  Gujarati: 'GU',
  Bengali: 'BN',
  Kannada: 'KN',
  Malayalam: 'ML',
  Odia: 'OR',
  Assamese: 'AS',
  Urdu: 'UR',
  Santali: 'SAT',
  Kashmiri: 'KS',
  Manipuri: 'MNI',
  Dogri: 'DOI',
  Bhojpuri: 'BHO',
  'Auto Detect': 'AUTO',
  Auto: 'AUTO',

  // FLORES-200 Codes
  eng_Latn: 'EN',
  hin_Deva: 'HI',
  mar_Deva: 'MR',
  pan_Guru: 'PA',
  tam_Taml: 'TA',
  tel_Telu: 'TE',
  guj_Gujr: 'GU',
  ben_Beng: 'BN',
  kan_Knda: 'KN',
  mal_Mlym: 'ML',
  ory_Orya: 'OR',
  asm_Beng: 'AS',
  urd_Arab: 'UR',
};

/**
 * Normalizes any language input (name, 2-letter code, FLORES code) to standard ISO code.
 */
export const normalizeLanguageCode = (lang) => {
  if (!lang || typeof lang !== 'string') return null;
  const trimmed = lang.trim();
  if (LANGUAGE_MAP[trimmed]) return LANGUAGE_MAP[trimmed];
  const upper = trimmed.toUpperCase();
  if (LANGUAGE_MAP[upper]) return LANGUAGE_MAP[upper];
  return upper;
};

/**
 * Detects text script language from Unicode character ranges for Indian languages and English.
 */
export const detectTextLanguage = (text) => {
  if (!text || typeof text !== 'string') return 'EN';

  // Devanagari script (Marathi / Hindi)
  if (/[\u0900-\u097F]/.test(text)) return 'MR';
  // Bengali / Assamese script
  if (/[\u0980-\u09FF]/.test(text)) return 'BN';
  // Gurmukhi script (Punjabi)
  if (/[\u0A00-\u0A7F]/.test(text)) return 'PA';
  // Gujarati script
  if (/[\u0A80-\u0AFF]/.test(text)) return 'GU';
  // Odia script
  if (/[\u0B00-\u0B7F]/.test(text)) return 'OR';
  // Tamil script
  if (/[\u0B80-\u0BFF]/.test(text)) return 'TA';
  // Telugu script
  if (/[\u0C00-\u0C7F]/.test(text)) return 'TE';
  // Kannada script
  if (/[\u0C80-\u0CFF]/.test(text)) return 'KN';
  // Malayalam script
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ML';
  // Arabic / Urdu script
  if (/[\u0600-\u06FF]/.test(text)) return 'UR';

  return 'EN';
};

// In-memory cache for client-side translation results
const translationCache = new Map();

export const apiTranslationService = {
  /**
   * Translates content dynamically via Spring Boot Backend (OpenAI Engine).
   */
  async translateText(text, targetLang, sourceLang = null) {
    if (!text || !text.trim()) {
      return text;
    }

    const tgtCode = normalizeLanguageCode(targetLang) || 'EN';
    const srcCode = normalizeLanguageCode(sourceLang) || detectTextLanguage(text);

    // If source and target language are identical, return original text immediately
    if (srcCode === tgtCode) {
      return text;
    }

    const cacheKey = `${srcCode}_${tgtCode}_${text.trim()}`;
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey);
    }

    const srcSent = sourceLang === 'auto' ? 'auto' : (LANGUAGE_MAP[sourceLang] || sourceLang);

    // PRESERVATION PRE-PROCESSING
    const placeholders = [];
    let placeholderCount = 0;

    // 1. URLs
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
    let processedText = text.replace(urlRegex, (match) => {
      const placeholder = `__PRESERVED_URL_${placeholderCount++}__`;
      placeholders.push({ placeholder, original: match });
      return placeholder;
    });

    // 2. Usernames
    const usernameRegex = /@[\w-]+/g;
    processedText = processedText.replace(usernameRegex, (match) => {
      const placeholder = `__PRESERVED_USER_${placeholderCount++}__`;
      placeholders.push({ placeholder, original: match });
      return placeholder;
    });

    // 3. Numbers
    const numRegex = /\b\d+\b/g;
    processedText = processedText.replace(numRegex, (match) => {
      const placeholder = `__PRESERVED_NUM_${placeholderCount++}__`;
      placeholders.push({ placeholder, original: match });
      return placeholder;
    });

    console.log('[MKA MOBILE TRANSLATION DEBUG]', {
      'Input text': text.trim(),
      'Processed text': processedText,
      'Target language': tgtCode,
      'Source language sent': srcSent,
    });

    try {
      const translated = await apiService.translateText(processedText, tgtCode, srcSent || 'auto');
      if (translated) {
        // PRESERVATION POST-PROCESSING (RESTORE)
        let restored = translated;
        for (const item of placeholders) {
          const escapedPlaceholder = item.placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const spacingRegex = new RegExp(escapedPlaceholder.split('_').join('\\s*_\\s*'), 'gi');
          restored = restored.replace(spacingRegex, item.original);
        }
        
        translationCache.set(cacheKey, restored);
        return restored;
      }
    } catch (err) {
      console.warn('Mobile translation service error:', err?.message || err);
    }

    return text;
  },
};
