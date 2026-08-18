import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { InitialAvatar } from '../common/InitialAvatar';
import { usePosts } from '../../context/PostContext';
import { useLanguage } from '../../context/LanguageContext';
import { COLORS } from '../../styles/theme';
import { styles } from '../../styles/appStyles';

export function PostCardItem({ item, currentUser, handlePostReact, onNavigateToChat, setActiveReportPost, setReportModalVisible, onOpenComments }: {
  item: any;
  currentUser: any;
  handlePostReact: any;
  onNavigateToChat: any;
  setActiveReportPost: any;
  setReportModalVisible: any;
  onOpenComments: any;
}) {
  const { toggleSavePost, deletePost } = usePosts() as any;
  const { currentLanguage, translateText, t } = useLanguage() as any;

  const displayTitle = translateText(item.originalTitle || item.title, currentLanguage);
  const displayContent = translateText(item.originalContent || item.content, currentLanguage);

  const userReacted = item.userReaction;
  const topicColors: Record<string, string> = {
    'mental health': '#3F7772',
    'career': '#D96C3D',
    'relationships': '#C46F76',
    'general': '#6F405F',
  };
  let topicThemeColor = COLORS.zorba;
  const topicLower = (item.topic || 'General').toLowerCase();
  for (const [key, val] of Object.entries(topicColors)) {
    if (topicLower.includes(key)) {
      topicThemeColor = val;
      break;
    }
  }

  const isPostOwner = item.username === currentUser?.username;

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <InitialAvatar initials={item.avatarInitials} color={item.avatarColor} size={40} />
        <View style={styles.postHeaderInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.postUsername}>{item.username}</Text>
            {isPostOwner && (
              <TouchableOpacity onPress={() => {
                Alert.alert(
                  t('delete', 'Delete'),
                  t('deletePostConfirm', 'Are you sure you want to delete this post?'),
                  [
                    { text: t('cancel', 'Cancel'), style: 'cancel' },
                    { text: t('delete', 'Delete'), style: 'destructive', onPress: () => deletePost(item.id) }
                  ]
                );
              }}>
                <Text style={{ fontSize: 11, color: COLORS.error }}>🗑️ {t('delete', 'Delete')}</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.postMeta}>{item.postType}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={() => toggleSavePost(item.id)} style={{ padding: 4 }}>
            <Text style={{ fontSize: 18 }}>{item.isSaved ? '⭐' : '☆'}</Text>
          </TouchableOpacity>
          <View style={[styles.topicBadgePill, { backgroundColor: topicThemeColor + '1E', borderColor: topicThemeColor }]}>
            <Text style={[styles.topicBadgeText, { color: topicThemeColor }]}>{item.topic}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.postTitle}>{displayTitle}</Text>
      <Text style={styles.postContent}>{displayContent}</Text>

      {/* Reactions display pills */}
      <View style={styles.reactionsDisplayRow}>
        {Object.keys(item.reactions).map(reaction => {
          const emojis: Record<string, string> = { relate: '❤️', wellSaid: '👍', helpful: '🔥', stayStrong: '🤝', madeMeThink: '💯' };
          const count = item.reactions[reaction];
          const active = userReacted === reaction;
          if (count === 0 && !active) { return null; }
          return (
            <TouchableOpacity
              key={reaction}
              style={[styles.reactionBadge, active && styles.reactionBadgeActive]}
              onPress={() => handlePostReact(item.id, reaction)}
            >
              <Text style={[styles.reactionBadgeText, active && { color: '#FFF', fontWeight: 'bold' }]}>
                {emojis[reaction]} {count}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Action row */}
      <View style={styles.postActionRow}>
        {/* Emoji bar picker */}
        <View style={styles.emojiPickerBar}>
          {Object.entries({ relate: '❤️', wellSaid: '👍', helpful: '🔥', stayStrong: '🤝', madeMeThink: '💯' }).map(([key, emoji]) => (
            <TouchableOpacity key={key} onPress={() => handlePostReact(item.id, key)} style={styles.emojiPickerButton}>
              <Text style={[styles.emojiPickerText, userReacted === key && { transform: [{ scale: 1.3 }] }]}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actionButtonContainer}>
          {/* Comment triggers */}
          <TouchableOpacity
            style={styles.commentActionButton}
            onPress={() => onOpenComments(item)}
          >
            <Text style={styles.commentActionButtonText}>💬 {item.commentCount}</Text>
          </TouchableOpacity>

          {/* Chat triggers */}
          {item.username !== currentUser?.username && (
            <TouchableOpacity
              style={styles.chatActionButton}
              onPress={() => onNavigateToChat(item.username, item.authorId || item.userId || item.user?.id, item.avatarInitials, item.avatarColor)}
            >
              <Text style={styles.chatActionButtonText}>DM</Text>
            </TouchableOpacity>
          )}

          {/* Flag / Report Trigger */}
          {item.username !== currentUser?.username && (
            <TouchableOpacity
              style={styles.flagActionButton}
              onPress={() => {
                setActiveReportPost(item);
                setReportModalVisible(true);
              }}
            >
              <Text style={styles.flagActionButtonText}>🚩</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
