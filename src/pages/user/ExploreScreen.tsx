import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  SafeAreaView,
  TextInput,
  Alert,
  RefreshControl,
  ImageBackground,
  Image,
  ScrollView,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { InitialAvatar } from '../../components/common/InitialAvatar';
import { CommentItem } from '../../components/posts/CommentItem';
import { CommentComposer } from '../../components/posts/CommentComposer';
import { usePosts } from '../../context/PostContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { COLORS } from '../../styles/theme';
import { styles as appStyles } from '../../styles/appStyles';
import { CloseIcon, ExploreIcon, StarIcon, ShieldIcon, FlagIcon } from '../../components/common/Icons';

function formatTimeAgo(dateString: string) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  } catch (e) {
    return '';
  }
}

const REACTION_CONFIG = [
  { key: 'relate', emoji: '❤️', label: 'Relate' },
  { key: 'wellSaid', emoji: '👍', label: 'Well Said' },
  { key: 'helpful', emoji: '🔥', label: 'Helpful' },
  { key: 'stayStrong', emoji: '🤝', label: 'Strong' },
  { key: 'madeMeThink', emoji: '💯', label: 'Think' },
];

export function ExploreScreen({ onNavigateToChat }: { onNavigateToChat?: any } = {}) {
  const { posts, reactToPost, addComment, toggleSavePost, fileReport, loadComments, refreshPosts } = usePosts() as any;
  const { currentUser } = useAuth() as any;
  const { t, currentLanguage, translationCache, translateText } = useLanguage() as any;

  // Modals & Refresh
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [commentText, setCommentText] = useState('');
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('Spam / Repetitive');
  const [reportNotes, setReportNotes] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeReportPost, setActiveReportPost] = useState<any>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (refreshPosts) {
        await refreshPosts();
      }
    } catch (err) {
      console.warn('[ExploreScreen] refresh error:', err);
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  };

  const [query, setQuery] = useState('');

  // Filter community thoughts (active/published + query)
  const displayPosts = useMemo(() => {
    let list = posts.filter((p: any) => {
      return p.status === 'ACTIVE' || p.status === 'PUBLISHED' || !p.hidden;
    });

    if (query.trim()) {
      const qLower = query.toLowerCase().trim();
      list = list.filter(
        (p: any) =>
          p.title?.toLowerCase().includes(qLower) ||
          p.content?.toLowerCase().includes(qLower) ||
          p.topic?.toLowerCase().includes(qLower) ||
          p.username?.toLowerCase().includes(qLower)
      );
    }

    return list;
  }, [posts, query]);

  const handlePostReact = (postId: any, key: any) => {
    reactToPost(postId, key);
  };

  const handleAddComment = () => {
    if (!commentText.trim() || !selectedPost) { return; }
    addComment(selectedPost.id, commentText.trim(), currentUser);
    setCommentText('');
  };

  const handleFileReport = () => {
    if (!activeReportPost) { return; }
    fileReport(
      activeReportPost.id,
      'POST',
      activeReportPost.content,
      activeReportPost.username,
      reportReason,
      reportNotes.trim(),
      currentUser?.username || '@anonymous'
    );
    setReportNotes('');
    setReportModalVisible(false);
    setActiveReportPost(null);
    Alert.alert(t('thankYou', 'Thank you'), t('flaggedForMod', 'Content has been flagged for admin moderation.'));
  };

  const activePostForModal = posts.find((p: any) => p.id === selectedPost?.id) || selectedPost;

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F5F4' }}>
      {/* ── COMMUNITY THOUGHTS STREAM WITH PULL-TO-REFRESH ── */}
      <FlatList
        data={displayPosts}
        keyExtractor={item => String(item.id)}
        extraData={{ currentLanguage, translationCache, query }}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6F405F', '#C46F76']}
            tintColor="#6F405F"
          />
        }
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            {/* ── DISCOVERY HERO COVER BANNER ── */}
            <View style={{
              backgroundColor: '#FFFFFF',
              borderBottomLeftRadius: 28,
              borderBottomRightRadius: 28,
              overflow: 'hidden',
              shadowColor: '#1A0C16',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.08,
              shadowRadius: 14,
              elevation: 4,
            }}>
              <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=900&auto=format&fit=crop&q=80' }}
                defaultSource={require('../../assets/music-cover.jpg')}
                style={{ width: '100%', minHeight: 150 }}
                resizeMode="cover"
              >
                {/* Twilight plum soft overlay */}
                <View style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(30, 16, 29, 0.42)',
                }} />

                {/* Banner Content */}
                <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 22 }}>
                  {/* Top Pill Emblem */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: 'rgba(255, 255, 255, 0.18)',
                    alignSelf: 'flex-start',
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    marginBottom: 10,
                  }}>
                    <ExploreIcon color="#93C5FD" size={14} />
                    <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#BFDBFE', letterSpacing: 0.4 }}>
                      COMMUNITY DISCOVERY
                    </Text>
                  </View>

                  {/* Title & Subtitle */}
                  <Text style={{ fontSize: 24, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.4, marginBottom: 4 }}>
                    Community Thoughts
                  </Text>
                  <Text style={{ fontSize: 12.5, color: 'rgba(255, 255, 255, 0.85)', lineHeight: 18 }}>
                    {displayPosts.length} {displayPosts.length === 1 ? 'thought shared by community' : 'thoughts shared by community'}
                  </Text>
                </View>
              </ImageBackground>
            </View>

            {/* ── FLOATING PROPER SEARCH BAR ── */}
            <View style={{
              backgroundColor: '#FFFFFF',
              marginHorizontal: 16,
              marginTop: -16,
              borderRadius: 18,
              paddingHorizontal: 14,
              height: 44,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#F0EAEE',
              shadowColor: '#1A0C16',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 10,
              elevation: 4,
            }}>
              <Text style={{ fontSize: 14, marginRight: 8, color: '#9E8E98' }}>🔍</Text>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search thoughts by topic, author, text..."
                placeholderTextColor="#9E8E98"
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: '#2D1D15',
                  paddingVertical: 0,
                }}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} style={{ padding: 4 }}>
                  <CloseIcon color="#8C8385" size={13} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
            paddingVertical: 60,
          }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#2D1D15', textAlign: 'center', marginBottom: 8 }}>
              No Thoughts Found
            </Text>
            <Text style={{ fontSize: 13, color: '#8C8385', textAlign: 'center', lineHeight: 20, maxWidth: 300 }}>
              Pull down to refresh or check back soon for new community thoughts.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const displayTitle = translateText(item.originalTitle || item.title, currentLanguage);
          const displayContent = translateText(item.originalContent || item.content, currentLanguage);
          const isSaved = item.isSaved;

          return (
            <View style={{
              backgroundColor: '#FFFFFF',
              marginHorizontal: 16,
              marginBottom: 14,
              borderRadius: 22,
              padding: 16,
              borderWidth: 1,
              borderColor: '#F0EAEE',
              shadowColor: '#1A0C16',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 10,
              elevation: 3,
            }}>
              {/* ── CARD HEADER: AUTHOR & VECTOR ACTION ICONS (NO MSG, CLEAN VECTOR FLAG & STAR) ── */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <InitialAvatar
                    initials={item.avatarInitials}
                    color={item.avatarColor || '#6F405F'}
                    size={42}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 14.5, fontWeight: '800', color: '#2D1D15' }}>
                        {item.username}
                      </Text>
                      {item.verified && (
                        <ShieldIcon color="#10B981" size={13} />
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 }}>
                      {item.topic && (
                        <View style={{
                          backgroundColor: 'rgba(111, 64, 95, 0.08)',
                          paddingHorizontal: 7,
                          paddingVertical: 2,
                          borderRadius: 6,
                        }}>
                          <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#6F405F' }}>
                            #{item.topic}
                          </Text>
                        </View>
                      )}
                      <Text style={{ fontSize: 11, color: '#8C8385' }}>
                        {formatTimeAgo(item.createdAt) || item.postType || 'Thought'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* ── TOP RIGHT CARD ACTIONS (ONLY VECTOR STAR & FLAG ICONS) ── */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {/* Bookmark Vector Star Button */}
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => toggleSavePost(item.id)}
                    style={{
                      padding: 7,
                      borderRadius: 10,
                      backgroundColor: isSaved ? '#FEF3C7' : '#FAF9FA',
                      borderWidth: 1,
                      borderColor: isSaved ? '#FDE68A' : '#EFEAE8',
                    }}
                  >
                    <StarIcon color={isSaved ? '#D97706' : '#8C8385'} size={15} />
                  </TouchableOpacity>

                  {/* Report Vector Flag Button */}
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => {
                      setActiveReportPost(item);
                      setReportModalVisible(true);
                    }}
                    style={{
                      padding: 7,
                      borderRadius: 10,
                      backgroundColor: '#FAF9FA',
                      borderWidth: 1,
                      borderColor: '#EFEAE8',
                    }}
                  >
                    <FlagIcon color="#C46F76" size={15} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ── CARD BODY: TITLE & CONTENT ── */}
              {displayTitle ? (
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#2D1D15', letterSpacing: -0.2, marginBottom: 6, lineHeight: 22 }}>
                  {displayTitle}
                </Text>
              ) : null}

              <Text style={{ fontSize: 14, color: '#3D2A35', lineHeight: 21 }}>
                {displayContent}
              </Text>

              {/* Attached Image Preview */}
              {item.imageUrl && (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={{
                    width: '100%',
                    height: 170,
                    borderRadius: 14,
                    marginTop: 10,
                    backgroundColor: '#FAF4F7',
                  }}
                  resizeMode="cover"
                />
              )}

              {/* ── CARD FOOTER ACTIONS: REACTIONS & COMMENTS ── */}
              <View style={{
                borderTopWidth: 1,
                borderTopColor: '#F6F0F4',
                paddingTop: 12,
                marginTop: 12,
              }}>
                {/* Horizontal Reactions Deck */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {REACTION_CONFIG.map(({ key, emoji }) => {
                    const count = Number(item.reactions?.[key] || 0);
                    const isUserReacted = item.userReaction === key;

                    return (
                      <TouchableOpacity
                        key={key}
                        activeOpacity={0.7}
                        onPress={() => handlePostReact(item.id, key)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          backgroundColor: isUserReacted ? '#6F405F' : '#FAF9FA',
                          paddingHorizontal: 9,
                          paddingVertical: 5,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: isUserReacted ? '#6F405F' : '#EFEAE8',
                        }}
                      >
                        <Text style={{ fontSize: 12 }}>{emoji}</Text>
                        {count > 0 && (
                          <Text style={{
                            fontSize: 11.5,
                            fontWeight: '800',
                            color: isUserReacted ? '#FFFFFF' : '#5C5254',
                          }}>
                            {count}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}

                  {/* Comments Trigger Pill */}
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={async () => {
                      setSelectedPost(item);
                      setCommentModalVisible(true);
                      const comments = await loadComments(item.id);
                      setSelectedPost((prev: any) => (prev ? { ...prev, comments } : null));
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      backgroundColor: '#FAF9FA',
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#EFEAE8',
                      marginLeft: 4,
                    }}
                  >
                    <Text style={{ fontSize: 12 }}>💬</Text>
                    <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#5C5254' }}>
                      {item.comments?.length || item.commentCount || 0} Comments
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          );
        }}
      />

      {/* ── REPORT MODAL ── */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={reportModalVisible}
        onRequestClose={() => setReportModalVisible(false)}
      >
        <SafeAreaView style={appStyles.centerModalOverlay}>
          <View style={appStyles.reportModalCard}>
            <View style={appStyles.modalHeader}>
              <Text style={appStyles.modalTitle}>🚩 {t('reportPost', 'Flag Content')}</Text>
              <TouchableOpacity onPress={() => setReportModalVisible(false)} style={appStyles.modalCloseButton}>
                <CloseIcon color="#8C8385" size={14} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ width: '100%' }}>
              <Text style={{ fontSize: 12.5, color: '#8C8385', marginBottom: 12 }}>
                Help keep Man Ki Aavaj safe. Select the reason for flagging:
              </Text>

              {['Spam / Repetitive', 'Harassment', 'Hate Speech', 'Self-Harm', 'Inappropriate Content'].map(reason => (
                <TouchableOpacity
                  key={reason}
                  onPress={() => setReportReason(reason)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 11,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    backgroundColor: reportReason === reason ? 'rgba(111, 64, 95, 0.08)' : 'transparent',
                    borderWidth: 1,
                    borderColor: reportReason === reason ? '#6F405F' : '#F0ECEB',
                    marginBottom: 8,
                  }}
                >
                  <Text style={{
                    fontSize: 13.5,
                    fontWeight: reportReason === reason ? '800' : '600',
                    color: reportReason === reason ? '#6F405F' : '#2D1D15',
                  }}>
                    {reason}
                  </Text>
                  {reportReason === reason && <Text style={{ color: '#6F405F', fontWeight: 'bold' }}>✓</Text>}
                </TouchableOpacity>
              ))}

              <TextInput
                placeholder="Additional details (Optional)"
                placeholderTextColor={COLORS.zorba}
                value={reportNotes}
                onChangeText={setReportNotes}
                style={[appStyles.input, { height: 70, textAlignVertical: 'top', marginTop: 8 }]}
                multiline
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <TouchableOpacity
                  onPress={handleFileReport}
                  style={[appStyles.primaryButton, { flex: 1, backgroundColor: '#C46F76' }]}
                >
                  <Text style={appStyles.primaryButtonText}>Submit Flag</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setReportModalVisible(false)}
                  style={{
                    flex: 1,
                    backgroundColor: '#FAF9FA',
                    borderWidth: 1,
                    borderColor: '#EFEAE8',
                    borderRadius: 12,
                    paddingVertical: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#8C8385', fontSize: 13.5, fontWeight: '700' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ── COMMENTS MODAL ── */}
      {activePostForModal && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={commentModalVisible}
          onRequestClose={() => setCommentModalVisible(false)}
        >
          <SafeAreaView style={appStyles.modalOverlay}>
            <View style={appStyles.modalContent}>
              <View style={appStyles.modalHeader}>
                <Text style={appStyles.modalTitle}>
                  {t('comments', 'Comments')} ({activePostForModal.comments?.length || 0})
                </Text>
                <TouchableOpacity onPress={() => setCommentModalVisible(false)} style={appStyles.modalCloseButton}>
                  <CloseIcon color="#8C8385" size={14} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
                <View style={{
                  padding: 14,
                  backgroundColor: '#FAF9FA',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: '#EFEAE8',
                  marginBottom: 16,
                }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#8C8385', marginBottom: 4 }}>
                    {activePostForModal.username}
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#2D1D15', marginBottom: 4 }}>
                    {translateText(activePostForModal.originalTitle || activePostForModal.title, currentLanguage)}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#5C5254', lineHeight: 18 }}>
                    {translateText(activePostForModal.originalContent || activePostForModal.content, currentLanguage)}
                  </Text>
                </View>

                {(!activePostForModal.comments || activePostForModal.comments.length === 0) ? (
                  <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#8C8385', fontStyle: 'italic' }}>
                      {t('noComments', 'No comments yet. Share your thoughts respectfully!')}
                    </Text>
                  </View>
                ) : (
                  activePostForModal.comments.map((c: any) => (
                    <CommentItem
                      key={c.id}
                      comment={c}
                      postId={activePostForModal.id}
                      currentUser={currentUser}
                      postAuthorUsername={activePostForModal.username}
                      onNavigateToChat={(username: any, authorId: any, initials: any, color: any) => {
                        setCommentModalVisible(false);
                        if (onNavigateToChat) onNavigateToChat(username, authorId, initials, color);
                      }}
                    />
                  ))
                )}
              </ScrollView>

              {/* Add comment drawer bar */}
              <CommentComposer
                postId={activePostForModal.id}
                onSubmit={(text) => addComment(activePostForModal.id, text, currentUser)}
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
