import { apiService } from './apiService';
import { localStorage } from './localStorage';

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

  // Devanagari script (Hindi / Marathi)
  if (/[\u0900-\u097F]/.test(text)) return 'HI';
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
let rateLimitPauseUntil = 0;

const getCachedTranslation = (cacheKey) => {
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }
  try {
    const lsKey = `mka_tr_${cacheKey.substring(0, 100)}`;
    const saved = localStorage.getItem(lsKey);
    if (saved) {
      translationCache.set(cacheKey, saved);
      return saved;
    }
  } catch (e) {}
  return null;
};

const setCachedTranslation = (cacheKey, value) => {
  if (!cacheKey || !value) return;
  translationCache.set(cacheKey, value);
  try {
    const lsKey = `mka_tr_${cacheKey.substring(0, 100)}`;
    localStorage.setItem(lsKey, value);
  } catch (e) {}
};

export const apiTranslationService = {
  /**
   * Translates content dynamically via Spring Boot Backend or Google GTX Fallback.
   */
  async translateText(rawInputText, targetLang, sourceLang = null) {
    if (!rawInputText || !rawInputText.trim()) {
      return rawInputText;
    }

    let text = rawInputText.trim();
    if (text.includes('%')) {
      try {
        text = decodeURIComponent(text);
      } catch (e) {}
    }
    text = text
      .replace(/%2सी/gi, ',')
      .replace(/%3एफ/gi, '?')
      .replace(/%2स/gi, ',')
      .replace(/%3ए/gi, '?')
      .replace(/%2C/gi, ',')
      .replace(/%3F/gi, '?')
      .replace(/%21/gi, '!')
      .replace(/%20/g, ' ')
      .replace(/%3([Ff]|एफ)?/gi, '?')
      .replace(/%2([Cc]|सी)?/gi, ',');

    const tgtCode = normalizeLanguageCode(targetLang) || 'EN';
    let srcCode = normalizeLanguageCode(sourceLang);
    const detectedScriptCode = detectTextLanguage(text);

    // If sourceLang was defaulted to EN, but text contains non-English script, trust script detection
    if (srcCode === 'EN' && detectedScriptCode !== 'EN') {
      srcCode = detectedScriptCode;
    } else if (!srcCode && sourceLang !== 'auto') {
      srcCode = detectedScriptCode;
    }

    // Only skip if source and target language are confirmed identical
    if (srcCode && tgtCode && srcCode === tgtCode) {
      return text;
    }

    // 1. Separate leading @username handles from main text body
    let remainingText = text.trim();
    const leadingHandles = [];
    while (true) {
      const match = remainingText.match(/^(@[a-zA-Z0-9_-]+)\s*/);
      if (match) {
        const handle = match[1];
        if (!leadingHandles.includes(handle)) {
          leadingHandles.push(handle);
        }
        remainingText = remainingText.substring(match[0].length);
      } else {
        break;
      }
    }

    // If text consists ONLY of @username handles, return handles directly
    if (!remainingText.trim()) {
      return text;
    }

    const bodyToTranslate = remainingText.trim();

    // 2. Mask any inline handles (@username) using safe handle tokens like @MKAHDL0
    const inlineHandles = [];
    const maskedBody = bodyToTranslate.replace(/@([a-zA-Z0-9_-]+)/g, (match) => {
      const token = `@MKAHDL${inlineHandles.length}`;
      inlineHandles.push({ token, original: match });
      return token;
    });

    const reattachHandles = (translatedBody) => {
      if (!translatedBody) return text;
      let clean = translatedBody.trim();
      for (const h of inlineHandles) {
        const regex = new RegExp(h.token.replace('@', '@\\s*'), 'gi');
        clean = clean.replace(regex, h.original);
      }
      if (leadingHandles.length > 0) {
        return `${leadingHandles.join(' ')} ${clean}`;
      }
      return clean;
    };

    const cacheKey = `${srcCode || 'auto'}_${tgtCode}_${text.trim()}`;
    const cached = getCachedTranslation(cacheKey);
    if (cached) {
      return cached;
    }

    // 1. Attempt primary backend translation endpoint with rate-limit pause check
    if (Date.now() >= rateLimitPauseUntil) {
      try {
        const translated = await apiService.translateText(maskedBody, tgtCode, srcCode || 'auto');
        if (translated && translated.trim() && translated !== maskedBody) {
          const result = reattachHandles(translated);
          setCachedTranslation(cacheKey, result);
          return result;
        }
      } catch (err) {
        console.warn('Mobile backend translation error, rate limiting primary client:', err?.message || err);
        // Pause primary translation API calls for 20s
        rateLimitPauseUntil = Date.now() + 20000;
      }
    }

    // 2. Secondary Fallback: Free Google Translate GTX service
    try {
      const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tgtCode.toLowerCase()}&dt=t&q=${encodeURIComponent(maskedBody)}`;
      const gtxResponse = await fetch(gtxUrl).catch(() => null);
      if (gtxResponse && gtxResponse.ok) {
        const gtxData = await gtxResponse.json().catch(() => null);
        if (Array.isArray(gtxData) && Array.isArray(gtxData[0])) {
          const translatedParts = gtxData[0]
            .filter((item) => Array.isArray(item) && item[0])
            .map((item) => item[0])
            .join('');

          if (translatedParts && translatedParts.trim()) {
            const finalResult = reattachHandles(translatedParts.trim());
            setCachedTranslation(cacheKey, finalResult);
            return finalResult;
          }
        }
      }
    } catch (fallbackErr) {
      console.warn('Mobile translation fallback failed:', fallbackErr?.message || fallbackErr);
    }

    return text;
  },
};
