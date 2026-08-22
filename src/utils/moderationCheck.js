import { RESTRICTED_TERMS, RESTRICTED_CATEGORIES } from '../data/restrictedWords.js';
import { normalizeText } from './normalizeText.js';

/**
 * Shared moderation utility used across the entire application.
 * Checks posts, comments, replies, usernames, bios, reports, etc.
 * 
 * Returns {
 *   status: 'SAFE' | 'NEEDS_EDITING' | 'PENDING_REVIEW' | 'BLOCKED',
 *   category: string | null,
 *   risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null,
 *   message: string,
 *   explanation: string | null,
 *   matchedTerm: string | null
 * }
 */
export function moderationCheck(rawText) {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    return {
      status: 'SAFE',
      category: null,
      risk: 'LOW',
      message: 'Your text follows community guidelines.',
      explanation: null,
      matchedTerm: null,
    };
  }

  const normalized = normalizeText(rawText);

  // Check phone numbers (10+ digits), emails, & external URLs/links
  const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(com|org|net|io|co|in|info|biz|me|app|dev|xyz|tech|online|store|site|link|top)[^\s]*)/i;

  if (phonePattern.test(rawText) || emailPattern.test(rawText) || urlPattern.test(rawText)) {
    return {
      status: 'BLOCKED',
      category: RESTRICTED_CATEGORIES.SPAM,
      risk: 'HIGH',
      message: 'Sharing external links, URLs, phone numbers, or email addresses is not permitted.',
      explanation: 'To maintain platform safety, privacy, and protect users from external phishing/spam, web links and personal contact details are restricted.',
      matchedTerm: '[URL/Contact]',
    };
  }

  // Check restricted term list
  for (const item of RESTRICTED_TERMS) {
    const termPattern = new RegExp(`\\b${item.pattern}\\b`, 'i');
    const termNormalizedPattern = new RegExp(item.pattern, 'i');

    if (termPattern.test(rawText) || termNormalizedPattern.test(normalized)) {
      if (item.status === 'BLOCKED') {
        return {
          status: 'BLOCKED',
          category: item.category,
          risk: item.risk,
          message: `Violation detected: ${item.category}.`,
          explanation: 'Your content contains wording flagged as harmful or hostile under community guidelines.',
          matchedTerm: item.pattern,
        };
      }

      if (item.status === 'PENDING_REVIEW') {
        return {
          status: 'PENDING_REVIEW',
          category: item.category,
          risk: item.risk,
          message: 'Your content has been submitted for moderator review.',
          explanation: 'Sensitive subjects (such as political debates or controversial topics) are reviewed before public display.',
          matchedTerm: item.pattern,
        };
      }

      if (item.status === 'NEEDS_EDITING') {
        return {
          status: 'NEEDS_EDITING',
          category: item.category,
          risk: item.risk,
          message: 'Some wording may be harmful or disrespectful. Please edit it before posting.',
          explanation: 'Please revise disrespectful or offensive phrasing to maintain a supportive space.',
          matchedTerm: item.pattern,
        };
      }
    }
  }

  return {
    status: 'SAFE',
    category: null,
    risk: 'LOW',
    message: 'Your content follows the community guidelines.',
    explanation: null,
    matchedTerm: null,
  };
}
