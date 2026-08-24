import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, SafeAreaView, TextInput } from 'react-native';
import { InitialAvatar } from '../../components/common/InitialAvatar';
import { useNotifications } from '../../context/NotificationContext';
import { usePosts } from '../../context/PostContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { COLORS } from '../../styles/theme';
import { styles } from '../../styles/appStyles';

import { PostCardItem } from '../../components/posts/PostCardItem';
import { CommentItem } from '../../components/posts/CommentItem';
import { CommentComposer } from '../../components/posts/CommentComposer';
import { CheckIcon, TrashIcon, ArrowRightIcon } from '../../components/common/Icons';
import { Platform } from 'react-native';

export function NotificationsScreen({ onNavigateToChat }: { onNavigateToChat?: (username: any, authorId: any, initials: any, color: any) => void }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications() as any;
  const { posts, loadComments, addComment, reactToPost } = usePosts() as any;
  const { currentUser } = useAuth() as any;
  const { t, currentLanguage, translateText, translationCache } = useLanguage() as any;

  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [filterUnread, setFilterUnread] = useState(false);

  const displayList = filterUnread ? notifications.filter((n: any) => !n.isRead) : notifications;

  const handleOpenPostDetails = async (post: any) => {
    setSelectedPost(post);
    setCommentModalVisible(true);
    setComments([]);
    try {
      const cms = await loadComments(post.id);
      setComments(cms || []);
    } catch (e) {
      console.warn('Failed to load comments in notifications screen:', e);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPost) { return; }
    try {
      await addComment(selectedPost.id, commentText.trim(), currentUser);
      setCommentText('');
      const cms = await loadComments(selectedPost.id);
      setComments(cms || []);
    } catch (e) {
      console.warn('Failed to add comment:', e);
    }
  };

  const handlePostReact = (postId: any, key: any) => {
    reactToPost(postId, key);
  };

  const currentPost = posts.find((p: any) => String(p.id) === String(selectedPost?.id)) || selectedPost;

  return (
    <View style={[styles.feedContainer, { backgroundColor: '#FAF8F8' }]}>
      {/* Header Bar */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3ECEB',
        elevation: 2,
        shadowColor: '#2D1D15',
        shadowOpacity: 0.05,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#2D1D15' }}>
            {t('notificationCenter', 'Notification Center')}
          </Text>
          {unreadCount > 0 && (
            <View style={{ backgroundColor: '#C46F76', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ fontSize: 10.5, fontWeight: 'bold', color: '#FFFFFF' }}>{unreadCount} New</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TouchableOpacity
            onPress={() => setFilterUnread(!filterUnread)}
            style={{
              backgroundColor: filterUnread ? '#6F405F' : '#FAF8F8',
              borderWidth: 1,
              borderColor: filterUnread ? '#6F405F' : '#E6E1E0',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: filterUnread ? '#FFFFFF' : '#6F405F' }}>
              {filterUnread ? t('showAll', 'Show All') : t('filterUnread', 'Filter Unread')}
            </Text>
          </TouchableOpacity>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={markAllAsRead}
              style={{
                backgroundColor: '#FAF8F8',
                borderWidth: 1,
                borderColor: '#E6E1E0',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#6F405F' }}>
                {t('markAllRead', 'Mark all read')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {displayList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {filterUnread ? t('noUnreadNotifications', 'No unread notifications.') : t('noNotifications', 'No notifications yet.')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={item => item.id}
          extraData={{ currentLanguage, translationCache }}
          contentContainerStyle={{ paddingBottom: 110, paddingTop: 4 }}
          renderItem={({ item }) => {
            const targetPost = posts.find((p: any) => String(p.id) === String(item.targetPostId));
            
            const isWarning = item.actorUsername === 'System' || item.actorUsername === 'Moderation Team' || item.message.toLowerCase().includes('warning') || item.message.toLowerCase().includes('refrain');
            const isLike = item.message.toLowerCase().includes('liked');
            const isComment = item.message.toLowerCase().includes('commented') || item.message.toLowerCase().includes('replied') || item.message.toLowerCase().includes('reply');
            const isMessage = item.message.toLowerCase().includes('message') || item.message.toLowerCase().includes('sent you a');

            const avatarColor = isWarning ? '#C46F76' : '#6F405F';

            const renderBadge = () => {
              if (isWarning) {
                return (
                  <View style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: '#EF4444',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1.5,
                    borderColor: '#FFFFFF',
                  }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 8, fontWeight: 'bold', marginTop: -1 }}>⚠️</Text>
                  </View>
                );
              }
              if (isLike) {
                return (
                  <View style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: '#EC4899',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1.5,
                    borderColor: '#FFFFFF',
                  }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 8, fontWeight: 'bold', marginTop: -0.5 }}>❤️</Text>
                  </View>
                );
              }
              if (isComment) {
                return (
                  <View style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: '#8B5CF6',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1.5,
                    borderColor: '#FFFFFF',
                  }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 8, fontWeight: 'bold', marginTop: -1 }}>💬</Text>
                  </View>
                );
              }
              if (isMessage) {
                return (
                  <View style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: '#3B82F6',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1.5,
                    borderColor: '#FFFFFF',
                  }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 8, fontWeight: 'bold', marginTop: -0.5 }}>✉️</Text>
                  </View>
                );
              }
              return null;
            };

            const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            return (
              <View
                style={{
                  backgroundColor: item.isRead ? '#FFFFFF' : '#FAF5F8',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: item.isRead ? '#F1ECEF' : '#E6D3DF',
                  borderLeftWidth: item.isRead ? 1 : 4,
                  borderLeftColor: item.isRead ? '#F1ECEF' : '#6F405F',
                  padding: 14,
                  marginHorizontal: 16,
                  marginTop: 12,
                  flexDirection: 'row',
                  shadowColor: '#2D1D15',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.03,
                  shadowRadius: 5,
                  elevation: 2,
                  alignItems: 'center',
                  position: 'relative',
                }}
              >
                <View style={{ width: 40, height: 40, position: 'relative', marginRight: 12 }}>
                  <InitialAvatar initials={item.actorInitials} color={avatarColor} size={40} />
                  {renderBadge()}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{
                    color: '#2D1D15',
                    fontSize: 13,
                    fontWeight: item.isRead ? '500' : 'bold',
                    lineHeight: 18,
                    paddingRight: 6,
                  }}>
                    {item.message}
                  </Text>
                  
                  <Text style={{ fontSize: 10, color: COLORS.zorba, marginTop: 4, fontWeight: '500' }}>
                    {formattedDate}
                  </Text>

                  {isComment && item.content && (
                    <View style={{
                      marginTop: 8,
                      backgroundColor: '#FAF6F8',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                      borderLeftWidth: 3,
                      borderLeftColor: '#6F405F',
                    }}>
                      <Text style={{ fontSize: 12.5, color: '#2D1D15', lineHeight: 18, fontStyle: 'italic' }}>
                        "{item.content}"
                      </Text>
                    </View>
                  )}

                  {targetPost && (
                    <View style={{
                      marginTop: 10,
                      backgroundColor: '#FCFAF9',
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: '#F3ECEB',
                      overflow: 'hidden',
                      flexDirection: 'row',
                    }}>
                      <View style={{ width: 4, backgroundColor: '#6F405F' }} />
                      <View style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 10 }}>
                        {targetPost.title ? (
                          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#2D1D15', marginBottom: 3 }}>
                            {translateText(targetPost.originalTitle || targetPost.title, currentLanguage)}
                          </Text>
                        ) : null}
                        <Text numberOfLines={2} style={{ fontSize: 11.5, color: '#5C5254', lineHeight: 16 }}>
                          {targetPost.content}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Action controls row on the right */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                  {(item.targetPostId || item.targetId || isMessage) && (
                    <TouchableOpacity
                      onPress={() => {
                        markAsRead(item.id);
                        if (isMessage && onNavigateToChat) {
                          const cleanUsername = item.actorUsername ? item.actorUsername.replace('@', '') : '';
                          const cleanInitials = item.actorInitials || 'AN';
                          const cleanColor = item.actorAvatarColor || '#6F405F';
                          const authorId = item.senderId || item.actorId || 0;
                          onNavigateToChat(cleanUsername, authorId, cleanInitials, cleanColor);
                        } else if (targetPost) {
                          handleOpenPostDetails(targetPost);
                        }
                      }}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: '#FAF5F8',
                        borderWidth: 1,
                        borderColor: '#E6D3DF',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <ArrowRightIcon color="#6F405F" size={14} />
                    </TouchableOpacity>
                  )}

                  {!item.isRead && (
                    <TouchableOpacity
                      onPress={() => markAsRead(item.id)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: '#F0FAF5',
                        borderWidth: 1,
                        borderColor: '#D0EFE0',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <CheckIcon color="#10B981" size={14} />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => deleteNotification(item.id)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: '#FAF0F0',
                      borderWidth: 1,
                      borderColor: '#EFD0D0',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <TrashIcon color="#EF4444" size={14} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {selectedPost && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={commentModalVisible}
          onRequestClose={() => setCommentModalVisible(false)}
        >
          <SafeAreaView style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Comments ({comments.length})</Text>
                <TouchableOpacity onPress={() => setCommentModalVisible(false)} style={styles.modalCloseButton}>
                  <Text style={styles.modalCloseText}>✖</Text>
                </TouchableOpacity>
              </View>

              {/* Comment list with scrollable post card header */}
              <FlatList
                data={comments}
                keyExtractor={c => c.id}
                style={{ flex: 1 }}
                extraData={{ currentLanguage, translationCache }}
                contentContainerStyle={{ paddingBottom: 16 }}
                ListHeaderComponent={() => (
                  <View style={{ borderBottomWidth: 1, borderBottomColor: '#F0ECEE', backgroundColor: '#FFFFFF', marginBottom: 16 }}>
                    <PostCardItem
                      item={currentPost}
                      currentUser={currentUser}
                      handlePostReact={handlePostReact}
                      onNavigateToChat={() => { }}
                      setActiveReportPost={() => { }}
                      setReportModalVisible={() => { }}
                      onOpenComments={() => { }}
                      showInlineComment={false}
                      flat={true}
                    />
                  </View>
                )}
                renderItem={({ item: c }) => (
                  <View style={{ paddingHorizontal: 16 }}>
                    <CommentItem
                      comment={c}
                      postId={selectedPost.id}
                      currentUser={currentUser}
                      postAuthorUsername={selectedPost.username}
                      onNavigateToChat={(username, authorId, initials, color) => {
                        setCommentModalVisible(false);
                        if (onNavigateToChat) {
                          onNavigateToChat(username, authorId, initials, color);
                        }
                      }}
                    />
                  </View>
                )}
              />

              {/* Add comment drawer bar */}
              <CommentComposer
                postId={selectedPost.id}
                onSubmit={async (text) => {
                  await addComment(selectedPost.id, text, currentUser);
                  const comments = await loadComments(selectedPost.id);
                  setSelectedPost((prev: any) => prev ? { ...prev, comments } : null);
                }}
                placeholder="Share a thoughtful reply..."
                currentUser={currentUser}
              />
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </View>
  );
}

// â”€â”€ NEW SCREEN: SAVED BOOKMARKS SCREEN â”€â”€
