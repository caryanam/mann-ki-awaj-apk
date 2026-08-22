export function toBackendTopic(topicLabel) {
  if (!topicLabel) return 'GENERAL';
  const norm = topicLabel.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');

  switch (norm) {
    case 'POETRY':
    case 'SHAYARI':
    case 'CONFESSION':
    case 'PERSONAL_STORY':
    case 'QUOTES':
    case 'CREATIVITY':
      return 'CREATIVITY';

    case 'LOVE':
    case 'BREAKUP':
    case 'MISSING_SOMEONE':
    case 'LONELINESS':
    case 'FRIENDSHIP':
    case 'FAMILY':
    case 'HAPPINESS':
    case 'FRUSTRATION':
    case 'RELATIONSHIPS':
      return 'RELATIONSHIPS';

    case 'LIFE':
    case 'JOB':
    case 'BOSS':
    case 'BUSINESS':
    case 'MONEY':
    case 'EDUCATION':
    case 'CAREER':
    case 'WORKPLACE':
      return 'CAREER';

    case 'POLITICS':
    case 'GOVERNMENT':
    case 'ELECTIONS':
    case 'LOCAL_ISSUES':
    case 'SOCIAL_ISSUES':
    case 'PUBLIC_PROBLEMS':
      return 'POLITICS';

    case 'MOVIE_REVIEW':
    case 'MUSIC':
    case 'WEB_SERIES':
    case 'CELEBRITY_DISCUSSION':
    case 'BOLLYWOOD':
    case 'ENTERTAINMENT':
      return 'ENTERTAINMENT';

    case 'CRICKET':
    case 'FOOTBALL':
    case 'OTHER_SPORTS':
    case 'SPORTS':
      return 'SPORTS';

    case 'TECH':
    case 'TECHNOLOGY':
      return 'TECH';

    case 'NEWS':
      return 'NEWS';

    case 'CULTURE':
      return 'CULTURE';

    case 'BOOKS':
      return 'BOOKS';

    case 'PARENTING':
      return 'PARENTING';

    case 'THOUGHTS':
      return 'THOUGHTS';

    default:
      return 'GENERAL';
  }
}

export function toBackendPostType(typeLabel, hasImage = false, isAudio = false) {
  if (isAudio) return 'AUDIO_TRANSCRIPT';
  if (hasImage) return 'IMAGE';
  if (!typeLabel) return 'TEXT';
  
  const norm = typeLabel.trim().toUpperCase();
  if (norm.includes('IMAGE') || norm.includes('PHOTO')) return 'IMAGE';
  if (norm.includes('AUDIO') || norm.includes('VOICE') || norm.includes('TRANSCRIPT')) return 'AUDIO_TRANSCRIPT';
  return 'TEXT';
}
