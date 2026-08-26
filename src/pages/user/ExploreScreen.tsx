import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, SafeAreaView, TextInput, Alert, StyleSheet, RefreshControl } from 'react-native';
import { PostCardItem } from '../../components/posts/PostCardItem';
import { CommentItem } from '../../components/posts/CommentItem';
import { CommentComposer } from '../../components/posts/CommentComposer';
import { TopicDiscussionScreen } from './TopicDiscussionScreen';
import { usePosts } from '../../context/PostContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { COLORS } from '../../styles/theme';
import { styles as appStyles } from '../../styles/appStyles';
import { TOPIC_CATEGORIES } from '../../utils/topicUtils';
import { apiService } from '../../services/apiService';
const CATEGORY_EMOJIS: Record<string, string> = {
  Heart: '❤️',
  Feather: '✍️',
  Briefcase: '💼',
  Landmark: '⚖️',
  Film: '🎬',
  Trophy: '🏆',
  Compass: '🧭',
  UserCheck: '💡',
};
export function ExploreScreen({ onNavigateToChat }: { onNavigateToChat: any }) {
  const { posts, reactToPost, addComment, fileReport, loadComments, refreshPosts } = usePosts() as any;
  const { currentUser } = useAuth() as any;
  const { t, currentLanguage, translationCache, translateText } = useLanguage() as any;

  const [query, setQuery] = useState('');
  const [activeTopic, setActiveTopic] = useState('All');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [databaseTopics, setDatabaseTopics] = useState<any[]>([]);

  // Handlers for comments & flags (identical to HomeFeedScreen)
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [commentText, setCommentText] = useState('');
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('Spam');
  const [reportNotes, setReportNotes] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadDatabaseTopics = async () => {
    try {
      const topics = await apiService.getTopics();
      setDatabaseTopics(topics || []);
    } catch (err) {
      console.warn('Failed to load database topics:', err);
    }
  };

  useEffect(() => {
    loadDatabaseTopics();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshPosts();
      await loadDatabaseTopics();
    } catch (err) {
      console.warn('[ExploreScreen] refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };
  const [activeReportPost, setActiveReportPost] = useState<any>(null);

  // Standardized Topic Presets derived from shared TOPIC_CATEGORIES
  const TOPIC_PRESETS = useMemo(() => {
    const presets: any[] = [];
    TOPIC_CATEGORIES.forEach((cat: any) => {
      cat.subtopics.forEach((sub: any) => {
        presets.push({
          name: sub.id,
          label: sub.label,
          category: cat.name,
          categoryKey: cat.categoryKey,
          icon: sub.icon,
          accent: cat.accent,
          gradient: cat.gradient,
        });
      });
    });
    return presets;
  }, []);

  // Dynamic calculation of topic statistics from real database topics
  const topicStats = useMemo(() => {
    const statsMap: { [key: string]: any } = {};
    TOPIC_PRESETS.forEach(tItem => {
      statsMap[tItem.name] = { count: 0, isTrending: false };
    });

    databaseTopics.forEach((topic: any) => {
      const key = String(topic.name || '').toUpperCase();
      const count = Number(topic.commentCount || 0);
      statsMap[key] = {
        count,
        isTrending: count > 0,
      };
    });

    return statsMap;
  }, [databaseTopics, TOPIC_PRESETS]);

  // Filter posts based on activeTopic and query
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
      list = list.filter((p: any) => (p.topic || '').toUpperCase().replace(/[\s_-]/g, '') === activeTopic.toUpperCase().replace(/[\s_-]/g, ''));
    }

    return list;
  }, [posts, query, activeTopic]);

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

  // Header content inside the FlatList to enable cohesive scrolling
  const renderHeader = () => (
    <View>
      {/* Discovery Hero Banner Card */}
      <View style={localStyles.heroCard}>
        <View style={localStyles.heroBannerPill}>
          <Text style={localStyles.heroBannerPillText}>मनातलं बोला… ओळख सुरक्षित ठेवा.</Text>
        </View>
        <Text style={localStyles.heroTitle}>
          {t('exploreTopicsDiscussions', 'Explore Topics & Discussions')}
        </Text>
        <Text style={localStyles.heroSubtitle}>
          {t('exploreSubtitle', 'Search topics, view last post timestamps, and join conversations across Bollywood, Cricket, Politics, and Tech.')}
        </Text>
      </View>

      {/* Category Section Header */}
      <View style={localStyles.featuredHeaderRow}>
        <Text style={localStyles.sectionTitle}>🏷️ {t('exploreCategories', 'Explore Topic Channels')}</Text>
        {activeTopic !== 'All' && (
          <TouchableOpacity onPress={() => setActiveTopic('All')} style={localStyles.clearFilterBtn}>
            <Text style={localStyles.clearFilterText}>
              ✕ {t('clearFilter', 'Clear Filter')} ({activeTopic})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Categorized grid list */}
      <View style={localStyles.categoriesList}>
        {TOPIC_CATEGORIES.map((cat: any) => {
          const catMatchesQuery = !query.trim() ||
            cat.name.toLowerCase().includes(query.toLowerCase()) ||
            t(cat.categoryKey, cat.name).toLowerCase().includes(query.toLowerCase()) ||
            cat.subtopics.some((s: any) => s.label.toLowerCase().includes(query.toLowerCase()) || s.id.toLowerCase().includes(query.toLowerCase()));

          if (!catMatchesQuery) return null;

          return (
            <View key={cat.categoryKey} style={[localStyles.categoryCard, { borderColor: cat.accent + '30' }]}>
              {/* Header */}
              <View style={[localStyles.categoryHeader, { borderBottomWidth: 1, borderBottomColor: cat.accent + '15' }]}>
                <View style={localStyles.categoryTitleRow}>
                  <View style={[localStyles.categoryIconWrapper, { backgroundColor: cat.accent + '18' }]}>
                    <Text style={{ fontSize: 15, color: cat.accent }}>{CATEGORY_EMOJIS[cat.iconName] || '💡'}</Text>
                  </View>
                  <Text style={localStyles.categoryName}>{translateText(cat.name, currentLanguage)}</Text>
                </View>
                <Text style={[localStyles.categorySubtopicCount, { color: cat.accent }]}>
                  {cat.subtopics.length} {t('topics', 'topics')}
                </Text>
              </View>

              {/* Subtopic chips */}
              <View style={localStyles.subtopicsContainer}>
                {cat.subtopics.map((sub: any) => {
                  const isSelected = activeTopic.toUpperCase() === sub.id.toUpperCase();
                  const isQueryMatch = query.trim() && (
                    sub.label.toLowerCase().includes(query.toLowerCase()) ||
                    sub.id.toLowerCase().includes(query.toLowerCase())
                  );
                  const stat = topicStats[sub.id] || { count: 0, isTrending: false };

                  return (
                    <TouchableOpacity
                      key={sub.id}
                      onPress={() => {
                        setSelectedTopic(sub.id);
                      }}
                      style={[
                        localStyles.subtopicChip,
                        { borderColor: cat.accent + '30' },
                        isSelected && { backgroundColor: cat.accent, borderColor: cat.accent },
                        isQueryMatch && !isSelected && { backgroundColor: cat.accent + '18' }
                      ]}
                    >
                      <Text style={localStyles.subtopicIcon}>{sub.icon}</Text>
                      <Text style={[localStyles.subtopicLabel, isSelected && { color: '#FFF' }]}>
                        {translateText(sub.label, currentLanguage)}
                      </Text>
                      <View style={[
                        localStyles.subtopicCountBadge,
                        { backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.25)' : cat.accent + '16' }
                      ]}>
                        <Text style={[
                          localStyles.subtopicCountText,
                          { color: isSelected ? '#FFFFFF' : cat.accent }
                        ]}>
                          {stat.count}
                        </Text>
                      </View>
                      {stat.isTrending && (
                        <Text style={{ fontSize: 9, marginLeft: 2 }}>🔥</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>

      {/* Recent Thoughts Section Title */}
      <View style={localStyles.feedHeader}>
        <Text style={localStyles.sectionTitle}>
          🧭 {t('recentThoughts', 'Recent Thoughts')} {activeTopic !== 'All' ? `under #${t(activeTopic, activeTopic)}` : ''} ({displayPosts.length})
        </Text>
      </View>
    </View>
  );

  if (selectedTopic !== 'All') {
    return (
      <TopicDiscussionScreen
        topicName={selectedTopic}
        currentUser={currentUser}
        onBack={() => setSelectedTopic('All')}
        onNavigateToChat={onNavigateToChat}
        topicDbId={databaseTopics.find(tObj => (tObj.name || '').toUpperCase().trim() === selectedTopic.toUpperCase().trim())?.id}
      />
    );
  }

  return (
    <View style={localStyles.container}>
      {/* Fixed Search Bar at top */}
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

      {/* Thoughts Feed & Catalog header scroll */}
      <FlatList
        data={displayPosts}
        keyExtractor={item => item.id}
        extraData={{ currentLanguage, translationCache }}
        style={{ flex: 1 }}
        contentContainerStyle={appStyles.feedScroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6F405F']}
            tintColor="#6F405F"
          />
        }
        ListHeaderComponent={renderHeader}
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
                    postAuthorUsername={activePostForModal.username}
                    onNavigateToChat={(username, authorId, initials, color) => {
                      setCommentModalVisible(false);
                      onNavigateToChat(username, authorId, initials, color);
                    }}
                  />
                )}
              />

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
    paddingTop: 14,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2D1D15',
  },
  clearFilterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(111,64,95,0.1)',
  },
  clearFilterText: {
    fontSize: 11,
    color: COLORS.deepPlum,
    fontWeight: 'bold',
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
  },

  // Explore Catalog Styles
  heroCard: {
    backgroundColor: '#6F405F',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 6,
  },
  heroBannerPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 8,
  },
  heroBannerPillText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFD1E8',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#E0C8D6',
    lineHeight: 16,
  },
  categoriesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  categoriesList: {
    paddingBottom: 8,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 6,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    marginBottom: 12,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryIconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#2D1D15',
  },
  categorySubtopicCount: {
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  subtopicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subtopicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  subtopicLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2D1D15',
  },
  subtopicCountBadge: {
    marginLeft: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtopicCountText: {
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  subtopicIcon: {
    fontSize: 13,
    marginRight: 4,
  },
});
