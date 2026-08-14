export function toBackendTopic(topicLabel) {
  if (!topicLabel) return 'GENERAL';
  const norm = topicLabel.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
  
  switch (norm) {
    case 'CULTURE': return 'CULTURE';
    case 'ENTERTAINMENT': return 'ENTERTAINMENT';
    case 'POLITICS': return 'POLITICS';
    case 'NEWS': return 'NEWS';
    case 'SPORTS': return 'SPORTS';
    case 'TECH':
    case 'TECH___SOCIETY':
    case 'TECH_AND_SOCIETY':
    case 'TECHNOLOGY': return 'TECH';
    case 'THOUGHTS':
    case 'CONFESSIONS': return 'THOUGHTS';
    case 'CAREER':
    case 'WORKPLACE': return 'CAREER';
    case 'LIFE':
    case 'MENTAL_HEALTH':
    case 'PERSONAL_GROWTH':
    case 'RELATIONSHIPS':
    case 'PARENTING': return 'LIFE';
    default: return 'GENERAL';
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
