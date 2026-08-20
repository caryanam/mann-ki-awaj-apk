import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Modal, SafeAreaView, TextInput, Alert } from 'react-native';
import { PostCardItem } from '../../components/posts/PostCardItem';
import { CommentItem } from '../../components/posts/CommentItem';
import { usePosts } from '../../context/PostContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { COLORS } from '../../styles/theme';
import { styles } from '../../styles/appStyles';

export function HomeFeedScreen({ onNavigateToChat }: { onNavigateToChat: any }) {
  const { posts, reactToPost, addComment, fileReport, loadComments } = usePosts() as any;
  const { currentUser } = useAuth() as any;
  const { t, currentLanguage, translationCache } = useLanguage() as any;

  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [commentText, setCommentText] = useState('');
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('Spam');
  const [reportNotes, setReportNotes] = useState('');
  const [activeReportPost, setActiveReportPost] = useState<any>(null);

  const topics = ['All', 'General', 'Mental Health', 'Career', 'Relationships', 'Tech & Society', 'Confessions'];

  const filteredPosts = posts.filter((p: any) => {
    if (selectedTopic === 'All') { return true; }
    const pTopic = (p.topic || 'General').toLowerCase();
    const sTopic = selectedTopic.toLowerCase();
    return pTopic.includes(sTopic) || sTopic.includes(pTopic);
  });

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
    <View style={styles.feedContainer}>
      {/* Topics list */}
      <View style={styles.topicsScrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicsScroll}>
          {topics.map(topic => (
            <TouchableOpacity
              key={topic}
              style={[
                styles.topicChip,
                selectedTopic === topic && { backgroundColor: COLORS.deepPlum, borderColor: COLORS.deepPlum },
              ]}
              onPress={() => setSelectedTopic(topic)}
            >
              <Text style={[styles.topicChipText, selectedTopic === topic && { color: '#FFF', fontWeight: 'bold' }]}>
                {topic === 'All' ? t('topicAll', 'All') :
                  topic === 'General' ? t('topicGeneral', 'General') :
                    topic === 'Mental Health' ? t('topicMentalHealth', 'Mental Health') :
                      topic === 'Career' ? t('topicCareer', 'Career') :
                        topic === 'Relationships' ? t('topicRelationships', 'Relationships') :
                          topic === 'Tech & Society' ? t('topicTechSociety', 'Tech & Society') :
                            topic === 'Confessions' ? t('topicConfessions', 'Confessions') : topic}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Feed list */}
      <FlatList
        data={filteredPosts}
        keyExtractor={item => item.id}
        extraData={{ currentLanguage, translationCache }}
        contentContainerStyle={styles.feedScroll}
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
        <SafeAreaView style={styles.centerModalOverlay}>
          <View style={styles.reportModalCard}>
            <Text style={styles.reportModalTitle}>Flag Content</Text>
            <Text style={styles.reportModalSubtitle}>Help us keep AwaajManki safe. Why are you flagging this?</Text>

            <View style={styles.reportSelectorRow}>
              {['Spam / Repetitive', 'Harassment', 'Hate Speech', 'Self-Harm'].map(reason => (
                <TouchableOpacity
                  key={reason}
                  style={[styles.reportReasonChip, reportReason === reason && styles.reportReasonChipActive]}
                  onPress={() => setReportReason(reason)}
                >
                  <Text style={[styles.reportReasonText, reportReason === reason && { color: '#FFF' }]}>{reason}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              placeholder="Additional details (Optional)"
              placeholderTextColor={COLORS.zorba}
              value={reportNotes}
              onChangeText={setReportNotes}
              style={[styles.input, { height: 70, textAlignVertical: 'top', marginTop: 10 }]}
              multiline
            />

            <View style={styles.reportActionRow}>
              <TouchableOpacity onPress={() => setReportModalVisible(false)} style={styles.reportCancelButton}>
                <Text style={styles.reportCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleFileReport} style={styles.reportSubmitButton}>
                <Text style={styles.reportSubmitText}>Submit Flag</Text>
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
          <SafeAreaView style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Comments ({activePostForModal.comments?.length || 0})</Text>
                <TouchableOpacity onPress={() => setCommentModalVisible(false)} style={styles.modalCloseButton}>
                  <Text style={styles.modalCloseText}>âœ•</Text>
                </TouchableOpacity>
              </View>

              {/* Selected post reference */}
              <View style={styles.modalPostBrief}>
                <Text style={styles.modalPostUser}>{activePostForModal.username}</Text>
                <Text style={styles.modalPostText} numberOfLines={2}>{activePostForModal.content}</Text>
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
              <View style={styles.commentComposerBar}>
                <TextInput
                  placeholder="Share a thoughtful reply..."
                  placeholderTextColor={COLORS.zorba}
                  value={commentText}
                  onChangeText={setCommentText}
                  style={styles.commentComposerInput}
                />
                <TouchableOpacity onPress={handleAddComment} style={styles.commentSendButton}>
                  <Text style={styles.commentSendText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </View>
  );
}

// â”€â”€ CREATE POST SCREEN â”€â”€
