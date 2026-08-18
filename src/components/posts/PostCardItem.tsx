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
      <View style={[styles.postHeader, { alignItems: 'center' }]}>
        <InitialAvatar initials={item.avatarInitials} color={item.avatarColor} size={40} />
        
        {/* Center content containing Username, Type, and Topic Pill */}
        <View style={[styles.postHeaderInfo, { flex: 1, marginLeft: 10, justifyContent: 'center' }]}>
          <Text style={[styles.postUsername, { fontSize: 13.5, fontWeight: '700', color: '#2D1D15' }]} numberOfLines={1}>
            {item.username}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 6 }}>
            <Text style={[styles.postMeta, { fontSize: 10.5, color: COLORS.zorba, marginTop: 0 }]}>{item.postType}</Text>
            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.zorba }} />
            <View style={[styles.topicBadgePill, {
              backgroundColor: topicThemeColor + '12',
              borderColor: topicThemeColor + '40',
              borderWidth: 1,
              borderRadius: 6,
              paddingHorizontal: 6,
              paddingVertical: 1.5,
            }]}>
              <Text style={{ fontSize: 9.5, fontWeight: 'bold', color: topicThemeColor }}>{item.topic}</Text>
            </View>
          </View>
        </View>

        {/* Right content containing Save & Delete Actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {isPostOwner && (
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  t('delete', 'Delete'),
                  t('deletePostConfirm', 'Are you sure you want to delete this post?'),
                  [
                    { text: t('cancel', 'Cancel'), style: 'cancel' },
                    { text: t('delete', 'Delete'), style: 'destructive', onPress: () => deletePost(item.id) }
                  ]
                );
              }}
              style={{ padding: 6 }}
            >
              <Text style={{ fontSize: 16, color: '#C46F76' }}>🗑️</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => toggleSavePost(item.id)} style={{ padding: 6 }}>
            <Text style={{ fontSize: 18 }}>{item.isSaved ? '⭐' : '☆'}</Text>
          </TouchableOpacity>
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
