import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Modal, SafeAreaView, TextInput, Alert, StyleSheet } from 'react-native';
import { PostCardItem } from '../../components/posts/PostCardItem';
import { CommentItem } from '../../components/posts/CommentItem';
import { usePosts } from '../../context/PostContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { COLORS } from '../../styles/theme';
import { styles as appStyles } from '../../styles/appStyles';

export function ExploreScreen({ onNavigateToChat }: { onNavigateToChat: any }) {
  const { posts, reactToPost, addComment, fileReport, loadComments } = usePosts() as any;
  const { currentUser } = useAuth() as any;
  const { t, currentLanguage, translationCache } = useLanguage() as any;

  const [query, setQuery] = useState('');
  const [activeTopic, setActiveTopic] = useState('All');
  
  // Handlers for comments & flags (identical to HomeFeedScreen)
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [commentText, setCommentText] = useState('');
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('Spam');
  const [reportNotes, setReportNotes] = useState('');
  const [activeReportPost, setActiveReportPost] = useState<any>(null);

  const TOPIC_PRESETS = [
    { name: 'BOLLYWOOD', category: 'Entertainment', categoryKey: 'ENTERTAINMENT_CAT', isTrending: true, isNew: false, defaultTime: '2mins ago' },
    { name: 'CRICKET', category: 'Sports', categoryKey: 'SPORTS_CAT', isTrending: true, isNew: true, defaultTime: '5mins ago' },
    { name: 'TECHNOLOGY', category: 'Innovation', categoryKey: 'INNOVATION_CAT', isTrending: false, isNew: true, defaultTime: '12mins ago' },
    { name: 'POLITICS', category: 'News', categoryKey: 'NEWS_CAT', isTrending: true, isNew: false, defaultTime: '18mins ago' },
    { name: 'ENTERTAINMENT', category: 'Media', categoryKey: 'MEDIA_CAT', isTrending: false, isNew: false, defaultTime: '25mins ago' },
    { name: 'LIFESTYLE', category: 'Personal', categoryKey: 'PERSONAL_CAT', isTrending: false, isNew: true, defaultTime: '35mins ago' },
    { name: 'SPORTS', category: 'Fitness', categoryKey: 'FITNESS_CAT', isTrending: false, isNew: false, defaultTime: '42mins ago' },
    { name: 'NEWS', category: 'Current Affairs', categoryKey: 'CURRENT_AFFAIRS_CAT', isTrending: true, isNew: false, defaultTime: '1h ago' },
    { name: 'GENERAL', category: 'Community', categoryKey: 'COMMUNITY_CAT', isTrending: false, isNew: false, defaultTime: '2h ago' },
  ];

  // Dynamic calculation of topic statistics from real posts
  const topicStats = useMemo(() => {
    const statsMap: { [key: string]: any } = {};
    TOPIC_PRESETS.forEach(tItem => {
      statsMap[tItem.name] = { count: 0, lastPostTime: tItem.defaultTime, isNew: tItem.isNew, isTrending: tItem.isTrending };
    });

    posts.forEach((p: any) => {
      const topicName = (p.topic || 'GENERAL').toUpperCase();
      if (!statsMap[topicName]) {
        statsMap[topicName] = { count: 0, lastPostTime: 'Just now', isNew: true, isTrending: false };
      }
      statsMap[topicName].count += 1;
      if (p.createdAt) {
        const timeDiff = Math.floor((Date.now() - new Date(p.createdAt).getTime()) / 60000);
        statsMap[topicName].lastPostTime = timeDiff <= 0 ? 'Just now' : timeDiff < 60 ? `${timeDiff}m ago` : `${Math.floor(timeDiff/60)}h ago`;
      }
    });

    return statsMap;
  }, [posts]);

  // Filter posts
  const displayPosts = useMemo(() => {
    let list = posts.filter((p: any) => {
      return p.status === 'ACTIVE' || p.status === 'PUBLISHED' || !p.hidden;
    });

    if (query.trim()) {
      const qLower = query.toLowerCase();
      list = list.filter(
        (p: any) => p.title?.toLowerCase().includes(qLower) || p.content?.toLowerCase().includes(qLower) || p.topic?.toLowerCase().includes(qLower)
      );
    }

    if (activeTopic !== 'All') {
      list = list.filter((p: any) => (p.topic || '').toUpperCase() === activeTopic.toUpperCase());
    }

    return list;
  }, [posts, query, activeTopic]);

  // Filter topic presets by search query
  const filteredTopicPresets = useMemo(() => {
    if (!query.trim()) return TOPIC_PRESETS;
    const q = query.toLowerCase();
    return TOPIC_PRESETS.filter(tItem => {
      const translatedName = t(tItem.name, tItem.name).toLowerCase();
      return tItem.name.toLowerCase().includes(q) || translatedName.includes(q) || tItem.category.toLowerCase().includes(q);
    });
  }, [query, t]);

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
      reportNotes.trim()
    );
    setReportNotes('');
    setReportModalVisible(false);
    setActiveReportPost(null);
    Alert.alert(t('thankYou', 'Thank you'), t('flaggedForMod', 'Content has been flagged for admin moderation.'));
  };

  const activePostForModal = posts.find((p: any) => p.id === selectedPost?.id) || selectedPost;

  return (
    <View style={localStyles.container}>
      {/* Search Input Bar */}
      <View style={localStyles.searchBarContainer}>
        <TextInput
          placeholder={t('exploreSearchPlaceholder', '🧭 Search topics (e.g. Bollywood, Cricket)...')}
          placeholderTextColor={COLORS.zorba}
          value={query}
          onChangeText={setQuery}
          style={localStyles.searchBarInput}
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')} style={localStyles.clearSearchBtn}>
            <Text style={{ fontSize: 13, color: COLORS.zorba, fontWeight: 'bold' }}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Featured Topics Section */}
      <View style={localStyles.featuredHeaderRow}>
        <Text style={localStyles.sectionTitle}>🏷️ {t('featuredTopics', 'Featured Topics')}</Text>
        {activeTopic !== 'All' && (
          <TouchableOpacity onPress={() => setActiveTopic('All')}>
            <Text style={localStyles.clearFilterBtn}>
              {t('clearFilter', 'Clear Filter')} ({activeTopic})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Dynamic Topics Grid */}
      <View style={{ height: 160, paddingHorizontal: 12 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingVertical: 4 }}
        >
          {filteredTopicPresets.map((tItem) => {
            const stat = topicStats[tItem.name] || { count: 0, lastPostTime: tItem.defaultTime };
            const isSelected = activeTopic.toUpperCase() === tItem.name.toUpperCase();

            return (
              <TouchableOpacity
                key={tItem.name}
                onPress={() => setActiveTopic(isSelected ? 'All' : tItem.name)}
                style={[
                  localStyles.topicCard,
                  isSelected && { borderColor: COLORS.deepPlum, backgroundColor: 'rgba(111, 64, 95, 0.04)' }
                ]}
              >
                <View style={localStyles.cardHeader}>
                  <Text style={localStyles.categoryText}>{t(tItem.categoryKey, tItem.category)}</Text>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {tItem.isTrending && (
                      <View style={localStyles.badgeTrending}>
                        <Text style={localStyles.badgeText}>🔥</Text>
                      </View>
                    )}
                    {tItem.isNew && (
                      <View style={localStyles.badgeNew}>
                        <Text style={localStyles.badgeText}>✨</Text>
                      </View>
                    )}
                  </View>
                </View>

                <Text style={localStyles.topicTitleText}>#{t(tItem.name, tItem.name)}</Text>

                <View style={localStyles.cardFooter}>
                  <Text style={localStyles.footerText}>⏱️ {stat.lastPostTime}</Text>
                  <Text style={[localStyles.footerText, { fontWeight: 'bold', color: COLORS.deepPlum }]}>
                    {stat.count} {t('posts', 'posts')}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Thoughts Feed */}
      <View style={localStyles.feedHeader}>
        <Text style={localStyles.sectionTitle}>
          🧭 {t('recentThoughts', 'Recent Thoughts')} {activeTopic !== 'All' ? `under #${activeTopic}` : ''} ({displayPosts.length})
        </Text>
      </View>

      <FlatList
        data={displayPosts}
        keyExtractor={item => item.id}
        extraData={{ currentLanguage, translationCache }}
        style={{ flex: 1 }}
        contentContainerStyle={appStyles.feedScroll}
        ListEmptyComponent={
          <View style={localStyles.emptyContainer}>
            <Text style={localStyles.emptyText}>No thoughts found matching this topic.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <PostCardItem
            item={item}
            currentUser={currentUser}
            handlePostReact={handlePostReact}
            onNavigateToChat={onNavigateToChat}
            setActiveReportPost={setActiveReportPost}
            setReportModalVisible={setReportModalVisible}
            onOpenComments={async (selectedPostItem: any) => {
              setSelectedPost(selectedPostItem);
              setCommentModalVisible(true);
              const comments = await loadComments(selectedPostItem.id);
              setSelectedPost((prev: any) => prev ? { ...prev, comments } : null);
            }}
          />
        )}
      />

      {/* Flag/Report Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={reportModalVisible}
        onRequestClose={() => setReportModalVisible(false)}
      >
        <SafeAreaView style={appStyles.centerModalOverlay}>
          <View style={appStyles.reportModalCard}>
            <Text style={appStyles.reportModalTitle}>Flag Content</Text>
            <Text style={appStyles.reportModalSubtitle}>Help us keep AwaajManki safe. Why are you flagging this?</Text>

            <View style={appStyles.reportSelectorRow}>
              {['Spam / Repetitive', 'Harassment', 'Hate Speech', 'Self-Harm'].map(reason => (
                <TouchableOpacity
                  key={reason}
                  style={[appStyles.reportReasonChip, reportReason === reason && appStyles.reportReasonChipActive]}
                  onPress={() => setReportReason(reason)}
                >
                  <Text style={[appStyles.reportReasonText, reportReason === reason && { color: '#FFF' }]}>{reason}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              placeholder="Additional details (Optional)"
              placeholderTextColor={COLORS.zorba}
              value={reportNotes}
              onChangeText={setReportNotes}
              style={[appStyles.input, { height: 70, textAlignVertical: 'top', marginTop: 10 }]}
              multiline
            />

            <View style={appStyles.reportActionRow}>
              <TouchableOpacity onPress={() => setReportModalVisible(false)} style={appStyles.reportCancelButton}>
                <Text style={appStyles.reportCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleFileReport} style={appStyles.reportSubmitButton}>
                <Text style={appStyles.reportSubmitText}>Submit Flag</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Discussion comments Modal */}
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
                <Text style={appStyles.modalTitle}>Comments ({activePostForModal.comments?.length || 0})</Text>
                <TouchableOpacity onPress={() => setCommentModalVisible(false)} style={appStyles.modalCloseButton}>
                  <Text style={appStyles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Selected post reference */}
              <View style={appStyles.modalPostBrief}>
                <Text style={appStyles.modalPostUser}>{activePostForModal.username}</Text>
                <Text style={appStyles.modalPostText} numberOfLines={2}>{activePostForModal.content}</Text>
              </View>

              {/* Comment list */}
              <FlatList
                data={activePostForModal.comments}
                keyExtractor={c => c.id}
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item: c }) => (
                  <CommentItem
                    comment={c}
                    postId={activePostForModal.id}
                    currentUser={currentUser}
                    onNavigateToChat={(username, authorId, initials, color) => {
                      setCommentModalVisible(false);
                      onNavigateToChat(username, authorId, initials, color);
                    }}
                  />
                )}
              />

              {/* Add comment drawer bar */}
              <View style={appStyles.commentComposerBar}>
                <TextInput
                  placeholder="Share a thoughtful reply..."
                  placeholderTextColor={COLORS.zorba}
                  value={commentText}
                  onChangeText={setCommentText}
                  style={appStyles.commentComposerInput}
                />
                <TouchableOpacity onPress={handleAddComment} style={appStyles.commentSendButton}>
                  <Text style={appStyles.commentSendText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5F4',
  },
  searchBarContainer: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 6,
    position: 'relative',
  },
  searchBarInput: {
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CEC7C5',
    paddingHorizontal: 16,
    paddingRight: 40,
    fontSize: 13,
    color: '#2D1D15',
  },
  clearSearchBtn: {
    position: 'absolute',
    right: 24,
    top: 24,
    padding: 2,
  },
  featuredHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2D1D15',
  },
  clearFilterBtn: {
    fontSize: 12,
    color: COLORS.deepPlum,
    fontWeight: 'bold',
  },
  topicCard: {
    width: 170,
    height: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E1DCDB',
    padding: 12,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8C8385',
    textTransform: 'uppercase',
  },
  badgeTrending: {
    backgroundColor: 'rgba(217, 108, 61, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeNew: {
    backgroundColor: 'rgba(63, 119, 114, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
  },
  topicTitleText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2D1D15',
    marginTop: -8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F8F5F4',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 10,
    color: '#8C8385',
  },
  feedHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13.5,
    color: COLORS.zorba,
    textAlign: 'center',
  }
});
