/**
 * Normalizes input text by removing obfuscations used to bypass filters.
 */
export function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';

  let normalized = text.toLowerCase();

  // Basic numeric / leet-speak replacements
  const leetMap = {
    '@': 'a',
    '4': 'a',
    '8': 'b',
    '3': 'e',
    '1': 'i',
    '!': 'i',
    '0': 'o',
    '$': 's',
    '5': 's',
    '7': 't',
    '+': 't',
  };

  normalized = normalized.split('').map(char => leetMap[char] || char).join('');

  // Remove punctuation inserted between characters (e.g. h.a.t.e -> hate)
  // Remove dots, dashes, underscores, spaces between single characters
  normalized = normalized.replace(/([a-z])[\.\-\_\*\#\s]+(?=[a-z])/gi, '$1');

  // Collapse repeated spaces
  normalized = normalized.replace(/\s+/g, ' ');

  // Collapse 3+ repeated characters (e.g., hhhate -> hate)
  normalized = normalized.replace(/(.)\1{2,}/g, '$1$1');

  return normalized.trim();
}
