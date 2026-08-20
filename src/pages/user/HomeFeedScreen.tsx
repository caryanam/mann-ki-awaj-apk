import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Modal, SafeAreaView, TextInput, Alert, StyleSheet } from 'react-native';
import { PostCardItem } from '../../components/posts/PostCardItem';
import { CommentItem } from '../../components/posts/CommentItem';
import { usePosts } from '../../context/PostContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { COLORS } from '../../styles/theme';
import { styles as appStyles } from '../../styles/appStyles';
import { localStorage } from '../../services/localStorage';

export function HomeFeedScreen({ onNavigateToChat }: { onNavigateToChat: any }) {
  const { posts, reactToPost, addComment, fileReport, loadComments } = usePosts() as any;
  const { currentUser } = useAuth() as any;
  const { t, currentLanguage, translationCache } = useLanguage() as any;

  // Filter and Topic states
  const [activeTab, setActiveTab] = useState('Latest');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [commentText, setCommentText] = useState('');
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('Spam');
  const [reportNotes, setReportNotes] = useState('');
  const [activeReportPost, setActiveReportPost] = useState<any>(null);

  // Custom Topic Modal state
  const [customTopicModalVisible, setCustomTopicModalVisible] = useState(false);
  const [newCustomTopicName, setNewCustomTopicName] = useState('');
  const [localCustomTopics, setLocalCustomTopics] = useState<string[]>([]);

  // Initialize custom topics from localStorage
  useEffect(() => {
    async function loadCustomTopics() {
      try {
        await localStorage.init();
        const stored = localStorage.getItem('mka_custom_topics');
        if (stored) {
          setLocalCustomTopics(JSON.parse(stored));
        }
      } catch (e) {
        console.warn('[HomeFeedScreen] Failed to load custom topics:', e);
      }
    }
    loadCustomTopics();
  }, []);

  // Compute User Restriction / Muted Status
  const isUserMuted = useMemo(() => {
    return Boolean(
      (currentUser?.mutedUntil && new Date(currentUser.mutedUntil) > new Date()) ||
      currentUser?.warningCount >= 3 ||
      currentUser?.active === false ||
      currentUser?.isMuted
    );
  }, [currentUser]);

  // Compute dynamic topics list with post counts and badges
  const sortedTopics = useMemo(() => {
    const systemTopics = ['All', 'General', 'Mental Health', 'Career', 'Relationships', 'Tech & Society', 'Confessions'];
    const statsMap: { [key: string]: any } = {};
    
    // Seed system topics
    systemTopics.forEach(topicName => {
      statsMap[topicName.toLowerCase()] = {
        name: topicName,
        count: 0,
        recentCount: 0,
        lastPostTime: 0,
        isTrending: false,
        isNew: false,
        isCustom: false,
      };
    });

    // Seed local custom topics
    localCustomTopics.forEach(topicName => {
      const key = topicName.toLowerCase();
      if (!statsMap[key]) {
        statsMap[key] = {
          name: topicName,
          count: 0,
          recentCount: 0,
          lastPostTime: 0,
          isTrending: false,
          isNew: false,
          isCustom: true,
        };
      }
    });

    // Aggregate stats from posts
    const nowMs = Date.now();
    const fiveMinsMs = 5 * 60 * 1000;
    const fifteenMinsMs = 15 * 60 * 1000;

    posts.forEach((p: any) => {
      if (!p || !p.topic) return;
      const rawTopic = p.topic.trim();
      const key = rawTopic.toLowerCase();

      if (!statsMap[key]) {
        statsMap[key] = {
          name: rawTopic,
          count: 0,
          recentCount: 0,
          lastPostTime: 0,
          isTrending: false,
          isNew: false,
          isCustom: true,
        };
      }

      const stat = statsMap[key];
      stat.count += 1;

      const createdAt = p.createdAt ? new Date(p.createdAt).getTime() : 0;
      if (createdAt > stat.lastPostTime) {
        stat.lastPostTime = createdAt;
      }

      if (createdAt > 0 && nowMs - createdAt <= fiveMinsMs) {
        stat.recentCount += 1;
      }
    });

    // Map to array with badges and priority sorting
    return Object.values(statsMap).map((stat: any) => {
      const timeDiffMs = stat.lastPostTime > 0 ? nowMs - stat.lastPostTime : Infinity;
      const isTrending = stat.recentCount >= 2;
      const isNew = timeDiffMs <= fifteenMinsMs;

      let priority = 0;
      if (stat.name === 'All') {
        priority = 100;
      } else if (isTrending) {
        priority = 3;
      } else if (isNew) {
        priority = 2;
      } else if (stat.isCustom) {
        priority = 1;
      }

      return {
        ...stat,
        isTrending,
        isNew,
        priority,
      };
    }).sort((a: any, b: any) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      if (b.lastPostTime !== a.lastPostTime) return b.lastPostTime - a.lastPostTime;
      return b.count - a.count;
    });
  }, [posts, localCustomTopics]);

  // Handler for adding custom topics
  const handleAddCustomTopic = () => {
    const cleanTopic = newCustomTopicName.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
    if (!cleanTopic) {
      Alert.alert('Error', 'Topic name cannot be empty.');
      return;
    }

    if (localCustomTopics.includes(cleanTopic)) {
      Alert.alert('Info', 'This topic already exists.');
      return;
    }

    const updated = [...localCustomTopics, cleanTopic];
    setLocalCustomTopics(updated);
    localStorage.setItem('mka_custom_topics', JSON.stringify(updated));
    setSelectedTopic(cleanTopic);
    setNewCustomTopicName('');
    setCustomTopicModalVisible(false);
    Alert.alert('Success', `Topic #${cleanTopic} created!`);
  };

  // Filter and Sort posts
  const filteredAndSortedPosts = useMemo(() => {
    if (isUserMuted) return [];

    // 1. Filtering
    const filtered = posts.filter((p: any) => {
      // Topic Filter
      if (selectedTopic !== 'All') {
        const pTopic = (p.topic || 'General').toLowerCase();
        const sTopic = selectedTopic.toLowerCase();
        if (pTopic !== sTopic && !pTopic.includes(sTopic) && !sTopic.includes(pTopic)) {
          return false;
        }
      }

      // My Topics Filter Tab
      if (activeTab === 'My Topics') {
        const favTopics = currentUser?.preferredTopics?.length
          ? currentUser.preferredTopics
          : ['BOLLYWOOD', 'CRICKET', 'POLITICS', 'TECHNOLOGY'];
        const pTopic = (p.topic || 'GENERAL').toUpperCase();
        const matchesFav = favTopics.some((fav: string) => fav.toUpperCase() === pTopic || pTopic.includes(fav.toUpperCase()));
        if (!matchesFav) return false;
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const title = (p.title || '').toLowerCase();
        const content = (p.content || '').toLowerCase();
        const author = (p.username || '').toLowerCase();
        const topic = (p.topic || '').toLowerCase();
        if (!title.includes(q) && !content.includes(q) && !author.includes(q) && !topic.includes(q)) {
          return false;
        }
      }

      return true;
    });

    // 2. Sorting based on Active Tab
    const sorted = [...filtered];
    if (activeTab === 'Latest') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (activeTab === 'Most Helpful') {
      const getReactionsCount = (p: any) => {
        if (!p.reactions) return 0;
        return Object.values(p.reactions).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
      };
      sorted.sort((a, b) => getReactionsCount(b) - getReactionsCount(a));
    } else if (activeTab === 'Trending') {
      sorted.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
    }

    return sorted;
  }, [posts, selectedTopic, activeTab, searchQuery, isUserMuted, currentUser]);

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
    <View style={[appStyles.feedContainer, { backgroundColor: '#F8F5F4' }]}>
      {/* 1. Safety Muted Warning Banner */}
      {isUserMuted && (
        <View style={localStyles.warningBanner}>
          <Text style={localStyles.warningTitle}>🛡️ Account Restricted</Text>
          <Text style={localStyles.warningText}>
            Your account is currently restricted from creating or viewing thoughts due to a safety warning.
          </Text>
        </View>
      )}

      {/* 2. Search Box */}
      <View style={localStyles.searchBarContainer}>
        <TextInput
          placeholder={t('searchPlaceholderText', '🔍 Search thoughts, topics or authors...')}
          placeholderTextColor={COLORS.zorba}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={localStyles.searchBarInput}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={localStyles.clearSearchBtn}>
            <Text style={{ fontSize: 13, color: COLORS.zorba, fontWeight: 'bold' }}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* 3. Filter Tabs Bar */}
      <View style={localStyles.filterTabsContainer}>
        {['Latest', 'Most Helpful', 'Trending', 'My Topics'].map((tab) => {
          const isSelected = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                localStyles.filterTabButton,
                isSelected && { backgroundColor: COLORS.deepPlum, borderColor: COLORS.deepPlum }
              ]}
            >
              <Text style={[localStyles.filterTabText, isSelected && { color: '#FFF', fontWeight: 'bold' }]}>
                {tab === 'Latest' ? t('latest', 'Latest') :
                  tab === 'Most Helpful' ? t('mostHelpful', 'Most Helpful') :
                    tab === 'Trending' ? t('trending', 'Trending') : t('myTopics', 'My Topics')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 4. Dynamic Topics list */}
      <View style={[appStyles.topicsScrollContainer, { height: 60 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[appStyles.topicsScroll, { paddingVertical: 10 }]}>
          {sortedTopics.map((topicItem: any) => {
            const isSelected = selectedTopic.toLowerCase() === topicItem.name.toLowerCase();
            return (
              <TouchableOpacity
                key={topicItem.name}
                style={[
                  appStyles.topicChip,
                  isSelected && { backgroundColor: COLORS.deepPlum, borderColor: COLORS.deepPlum },
                  { flexDirection: 'row', alignItems: 'center', height: 38, borderRadius: 19 }
                ]}
                onPress={() => setSelectedTopic(topicItem.name)}
              >
                <Text style={[appStyles.topicChipText, isSelected && { color: '#FFF', fontWeight: 'bold' }]}>
                  #{topicItem.name === 'All' ? t('topicAll', 'All') : topicItem.name}
                  {topicItem.count > 0 ? ` (${topicItem.count})` : ''}
                </Text>
                {/* Topic Badges */}
                {topicItem.isTrending && (
                  <View style={localStyles.topicBadge}>
                    <Text style={localStyles.topicBadgeText}>🔥</Text>
                  </View>
                )}
                {topicItem.isNew && (
                  <View style={[localStyles.topicBadge, { backgroundColor: COLORS.success }]}>
                    <Text style={[localStyles.topicBadgeText, { color: '#FFF', fontSize: 8 }]}>✨</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Add custom topic button */}
          <TouchableOpacity
            style={[appStyles.topicChip, { flexDirection: 'row', alignItems: 'center', height: 38, borderRadius: 19, borderColor: COLORS.deepPlum, backgroundColor: 'rgba(111, 64, 95, 0.05)' }]}
            onPress={() => setCustomTopicModalVisible(true)}
          >
            <Text style={{ fontSize: 12, color: COLORS.deepPlum, fontWeight: 'bold' }}>
              ➕ {t('addCustomTopicBtn', 'Custom Topic')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 5. Feed list */}
      <FlatList
        data={filteredAndSortedPosts}
        keyExtractor={item => item.id}
        extraData={{ currentLanguage, translationCache }}
        style={{ flex: 1 }}
        contentContainerStyle={appStyles.feedScroll}
        ListEmptyComponent={
          <View style={localStyles.emptyContainer}>
            <Text style={localStyles.emptyText}>
              {isUserMuted ? 'Account Restricted. Feed is currently unavailable.' : 'No thoughts found. Be the first to share a thought!'}
            </Text>
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

      {/* Custom Topic Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={customTopicModalVisible}
        onRequestClose={() => setCustomTopicModalVisible(false)}
      >
        <SafeAreaView style={appStyles.centerModalOverlay}>
          <View style={appStyles.reportModalCard}>
            <Text style={appStyles.reportModalTitle}>➕ Create Custom Topic</Text>
            <Text style={appStyles.reportModalSubtitle}>Create a new topic handle for anonymous discussions.</Text>

            <TextInput
              placeholder="e.g. WELLNESS, FINANCE, TRAVEL"
              placeholderTextColor={COLORS.zorba}
              value={newCustomTopicName}
              onChangeText={setNewCustomTopicName}
              style={[appStyles.input, { textTransform: 'uppercase', marginTop: 10 }]}
              maxLength={20}
              autoCapitalize="characters"
            />

            <View style={appStyles.reportActionRow}>
              <TouchableOpacity onPress={() => setCustomTopicModalVisible(false)} style={appStyles.reportCancelButton}>
                <Text style={appStyles.reportCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddCustomTopic} style={[appStyles.reportSubmitButton, { backgroundColor: COLORS.deepPlum }]}>
                <Text style={appStyles.reportSubmitText}>Create Topic</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

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
  warningBanner: {
    backgroundColor: 'rgba(196, 111, 118, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(196, 111, 118, 0.4)',
    borderRadius: 14,
    padding: 14,
    margin: 12,
    marginBottom: 6,
  },
  warningTitle: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#C46F76',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12.5,
    color: '#8C8385',
    lineHeight: 18,
  },
  searchBarContainer: {
    paddingHorizontal: 12,
    paddingTop: 12,
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
  filterTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterTabButton: {
    flex: 1,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CEC7C5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabText: {
    fontSize: 11,
    color: '#8C8385',
    fontWeight: '600',
  },
  topicBadge: {
    marginLeft: 4,
    backgroundColor: 'rgba(217, 108, 61, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicBadgeText: {
    fontSize: 10,
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
    lineHeight: 20,
    fontWeight: '500',
  }
});


// â”€â”€ CREATE POST SCREEN â”€â”€
