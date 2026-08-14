import { MOCK_USERS } from '../data/users';
import { localStorage } from './localStorage';

const anonymousName = '@anonymous';

const FALLBACK_HANDLES = {
  'user_1': '@quietchapter',
  '1': '@quietchapter',
  'user_2': '@hiddenpage',
  '2': '@hiddenpage',
  'user_3': '@thoughtwindow',
  '3': '@thoughtwindow',
  'user_4': '@openjournal',
  '4': '@openjournal',
  'user_5': '@unfinishedline',
  '5': '@unfinishedline',
};

function resolveUsername(item) {
  if (!item) return anonymousName;

  let u = item.username || item.authorUsername || item.user?.username || item.author?.username;

  if (u && u !== anonymousName && !u.startsWith('user_')) {
    const cleanU = u.trim().replace(/\s+/g, '');
    return cleanU.startsWith('@') ? cleanU : `@${cleanU}`;
  }

  if (u && FALLBACK_HANDLES[u]) {
    return FALLBACK_HANDLES[u];
  }

  const userId = item.userId || item.user?.id || item.authorId;
  if (userId) {
    const storedAuth = JSON.parse(localStorage.getItem('auth_user') || '{}');
    if (storedAuth.id && (storedAuth.id === userId || `user_${storedAuth.id}` === String(userId))) {
      if (storedAuth.username) {
        const cleanU = storedAuth.username.trim().replace(/\s+/g, '');
        return cleanU.startsWith('@') ? cleanU : `@${cleanU}`;
      }
    }

    const storedProfile = localStorage.getItem(`user_profile_${userId}`);
    if (storedProfile) {
      try {
        const p = JSON.parse(storedProfile);
        if (p.username) {
          const cleanU = p.username.trim().replace(/\s+/g, '');
          return cleanU.startsWith('@') ? cleanU : `@${cleanU}`;
        }
      } catch (e) {}
    }

    const foundMock = MOCK_USERS.find(
      user => user.id === userId || user.id === `user_${userId}` || user.id === `user_00${userId}`
    );
    if (foundMock?.username) return foundMock.username;

    if (FALLBACK_HANDLES[userId] || FALLBACK_HANDLES[String(userId)]) {
      return FALLBACK_HANDLES[userId] || FALLBACK_HANDLES[String(userId)];
    }
  }

  return anonymousName;
}

export function mapBackendTopicToUI(backendTopic) {
  if (!backendTopic) return 'General';
  const norm = backendTopic.trim().toUpperCase();
  switch (norm) {
    case 'GENERAL':
      return 'General';
    case 'CAREER':
      return 'Career';
    case 'LIFE':
      return 'Mental Health / Relationships';
    case 'TECH':
      return 'Tech & Society';
    case 'THOUGHTS':
      return 'Confessions';
    default:
      return backendTopic;
  }
}

export function mapPost(post) {
  if (!post) return null;

  const formattedUname = resolveUsername(post);

  return {
    ...post,
    id: post.id || post.postId || `post_${Date.now()}`,
    title: post.title || '',
    topic: mapBackendTopicToUI(post.topic || post.category),
    postType: post.postType || 'Thought',
    originalContent: post.originalContent || post.content || '',
    translatedContent: post.translatedContent || post.originalContent || post.content || '',
    displayLanguage: post.displayLanguage || post.originalLanguage || 'EN',
    content: post.translatedContent || post.originalContent || post.content || '',
    username: formattedUname,
    avatarInitials: post.avatarInitials || formattedUname.replace('@', '').slice(0, 2).toUpperCase(),
    avatarConfig: post.authorAvatar || post.avatarConfig || null,
    avatarColor: post.avatarColor || '#6F405F',
    language: post.originalLanguage || post.displayLanguage || post.language || 'EN',
    reactions: post.reactions || (post.reactionCounts ? {
      relate: post.reactionCounts.LOVE || 0,
      wellSaid: post.reactionCounts.LIKE || 0,
      helpful: post.reactionCounts.WOW || 0,
      stayStrong: post.reactionCounts.SAD || 0,
      madeMeThink: post.reactionCounts.HAHA || 0,
    } : { relate: post.likeCount || 0 }),
    userReaction: post.userReaction || (post.isLikedByCurrentUser ? 'relate' : null),
    status: post.status || 'PUBLISHED',
    createdAt: post.createdAt || new Date().toISOString(),
  };
}

export function mapComment(comment) {
  if (!comment) return null;

  const formattedUname = resolveUsername(comment);

  return {
    ...comment,
    content: comment.originalContent || comment.content || '',
    username: formattedUname,
    avatarInitials: comment.avatarInitials || formattedUname.replace('@', '').slice(0, 2).toUpperCase(),
    avatarConfig: comment.authorAvatar || comment.avatarConfig || null,
    avatarColor: comment.avatarColor || '#3F7772',
    reactions: comment.reactions || { relate: comment.likeCount || 0 },
    userReaction: comment.userReaction || (comment.isLikedByCurrentUser ? 'relate' : null),
    replies: (comment.replies || []).map(mapComment),
  };
}

export function mapNotification(notification) {
  if (!notification) return null;

  let msg = notification.message || notification.content || '';
  let rawActor = notification.senderUsername || notification.actorUsername || notification.actorName || notification.username || notification.actor?.username;

  // Map old database entries with real names to anonymous handles
  if (msg.startsWith('Ritik ') || msg.toLowerCase().includes('ritik commented') || msg.toLowerCase().includes('ritik replied')) {
    msg = msg.replace(/^Ritik\s+/i, '@gentlejournal ');
    rawActor = '@gentlejournal';
  } else if (msg.startsWith('pratik patil ') || msg.toLowerCase().includes('pratik patil commented') || msg.toLowerCase().includes('pratik patil replied')) {
    msg = msg.replace(/^pratik patil\s+/i, '@subtlechapter ');
    rawActor = '@subtlechapter';
  }

  let formattedActor = '@anonymous';

  if (rawActor && rawActor !== 'System' && rawActor !== 'Moderation Team') {
    const cleanU = rawActor.trim().replace(/\s+/g, '');
    formattedActor = cleanU.startsWith('@') ? cleanU : `@${cleanU}`;
  } else if (rawActor) {
    formattedActor = rawActor;
  }

  if (formattedActor && formattedActor !== '@anonymous' && formattedActor !== 'System' && formattedActor !== 'Moderation Team') {
    msg = msg.replace(/^([A-Za-z0-9_\s]+?)\s+(commented|replied|liked|reacted)/i, `${formattedActor} $2`);
  }

  return {
    ...notification,
    actorUsername: formattedActor,
    actorInitials: formattedActor.replace('@', '').slice(0, 2).toUpperCase(),
    targetPostId: notification.targetId || notification.targetPostId,
    message: msg,
  };
}
