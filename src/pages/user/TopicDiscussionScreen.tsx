import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useMoodMusic } from '../../context/MoodMusicContext';
import { COLORS } from '../../styles/theme';
import { styles as appStyles } from '../../styles/appStyles';
import { TOPIC_CATEGORIES } from '../../utils/topicUtils';
import { apiService } from '../../services/apiService';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useLanguage } from '../../context/LanguageContext';
import { CommentItem } from '../../components/posts/CommentItem';
import { InitialAvatar } from '../../components/common/InitialAvatar';

const EMOJI_PRESETS = ['😊', '❤️', '🔥', '👍', '🙏', '💡', '🤝', '💯', '🌸', '✨', '👏', '😍', '🤣', '🎉', '🚀', '🙌'];

const ImageAttachmentIcon = ({ color = '#8C8385', size = 18 }) => (
  <View style={{ width: size, height: size * 0.8, borderWidth: 1.5, borderColor: color, borderRadius: 3, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
    {/* Sun/Dot */}
    <View style={{ position: 'absolute', top: 2, left: 3, width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
    {/* Mountains */}
    <View style={{ position: 'absolute', bottom: -2, width: size * 1.2, height: size * 0.5, flexDirection: 'row', justifyContent: 'center' }}>
      <View style={{ width: size * 0.6, height: size * 0.6, backgroundColor: color, transform: [{ rotate: '45deg' }], marginRight: -2 }} />
      <View style={{ width: size * 0.5, height: size * 0.5, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
    </View>
  </View>
);

const SmileyEmojiIcon = ({ color = '#8C8385', size = 18 }) => (
  <View style={{ width: size, height: size, borderWidth: 1.5, borderColor: color, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}>
    {/* Eyes */}
    <View style={{ flexDirection: 'row', gap: 3, position: 'absolute', top: 4 }}>
      <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: color }} />
      <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: color }} />
    </View>
    {/* Smile */}
    <View style={{ width: 8, height: 4, borderBottomWidth: 1.5, borderBottomColor: color, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, position: 'absolute', bottom: 3 }} />
  </View>
);

const KeyboardInputIcon = ({ color = '#8C8385', size = 18 }) => (
  <View style={{ width: size, height: size * 0.7, borderWidth: 1.5, borderColor: color, borderRadius: 3, justifyContent: 'space-between', padding: 2 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 2 }}>
      <View style={{ width: 2, height: 1.5, backgroundColor: color }} />
      <View style={{ width: 2, height: 1.5, backgroundColor: color }} />
      <View style={{ width: 2, height: 1.5, backgroundColor: color }} />
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 2 }}>
      <View style={{ width: 2, height: 1.5, backgroundColor: color }} />
      <View style={{ width: 2, height: 1.5, backgroundColor: color }} />
      <View style={{ width: 2, height: 1.5, backgroundColor: color }} />
    </View>
    <View style={{ width: '80%', height: 1.5, backgroundColor: color, alignSelf: 'center', borderRadius: 0.5 }} />
  </View>
);

const MicrophoneIcon = ({ color = '#8C8385', size = 18 }) => (
  <View style={{ width: size, height: size * 1.2, justifyContent: 'center', alignItems: 'center' }}>
    {/* Body */}
    <View style={{ width: size * 0.45, height: size * 0.7, borderWidth: 1.5, borderColor: color, borderRadius: size * 0.22, backgroundColor: 'transparent' }} />
    {/* Stand U-shape */}
    <View style={{ position: 'absolute', bottom: size * 0.15, width: size * 0.7, height: size * 0.4, borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderRightWidth: 1.5, borderBottomLeftRadius: size * 0.35, borderBottomRightRadius: size * 0.35, borderColor: color }} />
    {/* Stand Base */}
    <View style={{ position: 'absolute', bottom: 0, width: 2, height: size * 0.2, backgroundColor: color }} />
    <View style={{ position: 'absolute', bottom: 0, width: size * 0.4, height: 1.5, backgroundColor: color }} />
  </View>
);

const MicrophoneOffIcon = ({ color = '#B33A3A', size = 18 }) => (
  <View style={{ width: size, height: size * 1.2, justifyContent: 'center', alignItems: 'center' }}>
    <MicrophoneIcon color={color} size={size} />
    <View style={{ position: 'absolute', width: size * 1.2, height: 1.5, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
  </View>
);

interface TopicDiscussionScreenProps {
  topicName: string;
  currentUser: any;
  onBack: () => void;
  onNavigateToChat: any;
  topicDbId?: any;
}

export function TopicDiscussionScreen({
  topicName,
  currentUser,
  onBack,
  onNavigateToChat,
  topicDbId: initialTopicDbId,
}: TopicDiscussionScreenProps) {
  const { t, currentLanguage } = useLanguage() as any;
  const [topicDbId, setTopicDbId] = useState<string | null>(initialTopicDbId ? String(initialTopicDbId) : null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Composer states
  const [commentText, setCommentText] = useState('');
  const [attachedImageUrl, setAttachedImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const audioRecorderPlayerRef = useRef<AudioRecorderPlayer | null>(null);

  // Clean up audio recorder on unmount
  useEffect(() => {
    return () => {
      if (audioRecorderPlayerRef.current) {
        audioRecorderPlayerRef.current.stopRecorder().catch(() => {});
      }
    };
  }, []);

  const getAudioRecorder = () => {
    if (!audioRecorderPlayerRef.current) {
      audioRecorderPlayerRef.current = new AudioRecorderPlayer();
    }
    return audioRecorderPlayerRef.current;
  };

  const startRecording = async () => {
    try {
      const recorder = getAudioRecorder();
      await recorder.startRecorder();
      setIsRecording(true);
    } catch (err) {
      console.warn('Start recorder failed:', err);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      const recorder = getAudioRecorder();
      const resultUri = await recorder.stopRecorder();
      setIsRecording(false);

      if (resultUri) {
        setIsTranscribing(true);
        const transcribed = await apiService.voiceToText(resultUri, currentLanguage || 'EN');
        if (transcribed) {
          setCommentText((prev) => (prev ? `${prev} ${transcribed}` : transcribed));
        } else {
          Alert.alert('Voice Note Failed', 'Could not transcribe speech. Please try again.');
        }
      }
    } catch (err) {
      console.warn('Stop recorder failed:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const pressStartTimeRef = useRef(0);
  const holdTimerRef = useRef<any>(null);
  const isHoldModeRef = useRef(false);

  const handlePressIn = () => {
    if (isTranscribing || submitting) return;
    pressStartTimeRef.current = Date.now();
    isHoldModeRef.current = false;

    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      isHoldModeRef.current = true;
      if (!isRecording) {
        startRecording();
      }
    }, 300);
  };

  const handlePressOut = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    const pressDuration = Date.now() - pressStartTimeRef.current;
    if (isHoldModeRef.current || pressDuration > 300) {
      if (isRecording) {
        stopRecording();
      }
    }
  };

  const handlePress = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    const pressDuration = Date.now() - pressStartTimeRef.current;

    if (!isHoldModeRef.current && pressDuration <= 300) {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
    isHoldModeRef.current = false;
  };

  // Dynamic Category Accent Color
  const accentColor = useMemo(() => {
    try {
      const { TOPIC_CATEGORIES } = require('../../utils/topicUtils');
      const upperName = topicName.toUpperCase().replace(/^#/, '').trim();
      const cat = TOPIC_CATEGORIES.find((c: any) =>
        c.subtopics.some((st: any) => st.id.toUpperCase() === upperName)
      );
      return cat ? cat.accent : '#6F405F';
    } catch {
      return '#6F405F';
    }
  }, [topicName]);

  // Load / Sync topic details and comments
  const loadTopicAndComments = useCallback(async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setLoading(true);
    try {
      let currentDbId = topicDbId;

      if (!currentDbId) {
        // 1. Fetch topics list from backend
        const topicsList = await apiService.getTopics();
        const upperName = topicName.toUpperCase().replace(/^#/, '').trim();

        let found = topicsList.find(
          (tObj: any) => (tObj.name || '').toUpperCase().trim() === upperName
        );

        // 2. If topic does not exist on DB, auto-create it (matching web parity)
        if (!found) {
          const { TOPIC_CATEGORIES } = require('../../utils/topicUtils');
          let icon = '💡';
          const cat = TOPIC_CATEGORIES.find((c: any) =>
            c.subtopics.some((st: any) => st.id.toUpperCase() === upperName)
          );
          if (cat) {
            const sub = cat.subtopics.find((st: any) => st.id.toUpperCase() === upperName);
            if (sub) icon = sub.icon;
          }

          found = await apiService.createTopic({
            name: upperName,
            icon: icon,
            createdByUsername: currentUser?.username || '@anonymous',
          });
        }

        if (found && found.id) {
          currentDbId = String(found.id);
          setTopicDbId(currentDbId);
        }
      }

      if (currentDbId) {
        // 3. Fetch comments associated with the resolved topic DB ID
        const commentsList = await apiService.getCommentsByTopicId(currentDbId);
        
        // Normalize comment usernames, properties, and reactions
        const normalized = (commentsList || []).map((cObj: any) => ({
          ...cObj,
          originalContent: cObj.originalContent || cObj.content || '',
          content: cObj.translatedContent || cObj.originalContent || cObj.content || '',
          username: cObj.authorUsername || cObj.username || '@anonymous',
          reactions: cObj.reactions || {},
          replies: (cObj.replies || []).map((rObj: any) => ({
            ...rObj,
            originalContent: rObj.originalContent || rObj.content || '',
            content: rObj.translatedContent || rObj.originalContent || rObj.content || '',
            username: rObj.authorUsername || rObj.username || '@anonymous',
          })),
        }));

        // Sort chronologically (oldest at top, newest at bottom) to form a conversation stream
        const sorted = normalized.sort(
          (a: any, b: any) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );

        setComments(sorted);
      }
    } catch (err) {
      console.warn('[TopicDiscussionScreen] Failed to load topic comments:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [topicName, currentUser, topicDbId]);

  // Reset topicDbId when topicName changes to force a fresh lookup
  useEffect(() => {
    setTopicDbId(null);
    setComments([]);
  }, [topicName]);

  useEffect(() => {
    loadTopicAndComments();
  }, [loadTopicAndComments]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTopicAndComments(false);
  };

  // Composer submit opinion
  const handleSubmitOpinion = async () => {
    const text = commentText.trim();
    if ((!text && !attachedImageUrl) || submitting || uploadingImage || !topicDbId) return;

    setSubmitting(true);
    try {
      await apiService.createTopicComment(
        topicDbId,
        text,
        currentLanguage || 'EN',
        attachedImageUrl
      );
      setCommentText('');
      setAttachedImageUrl(null);
      setShowEmojis(false);
      
      // Reload stream
      await loadTopicAndComments(false);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 300);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit opinion. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Reply submit callback
  const handleReplySubmit = async (commentId: string, text: string) => {
    try {
      await apiService.replyToComment(commentId, text, currentLanguage || 'EN');
      await loadTopicAndComments(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to post reply.');
    }
  };

  // Edit comment callback
  const handleEditSubmit = async (commentId: string, text: string) => {
    try {
      await apiService.updateComment(commentId, text);
      await loadTopicAndComments(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to edit comment.');
    }
  };

  // Delete comment callback
  const handleDeleteComment = async (commentId: string) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to permanently delete this comment/reply?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteComment(commentId);
              await loadTopicAndComments(false);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete comment.');
            }
          },
        },
      ]
    );
  };

  // React to comment callback
  const handleReactComment = async (commentId: string, reactionKey: string) => {
    try {
      // Find comment and toggle reaction state locally for instant UI update
      setComments((prev) =>
        prev.map((cObj) => {
          const updateItem = (item: any) => {
            if (item.id !== commentId) return item;
            const rx = { ...item.reactions };
            let userReaction = item.userReaction;

            if (userReaction === reactionKey) {
              rx[reactionKey] = Math.max(0, (rx[reactionKey] || 0) - 1);
              userReaction = null;
            } else {
              if (userReaction) {
                rx[userReaction] = Math.max(0, (rx[userReaction] || 0) - 1);
              }
              rx[reactionKey] = (rx[reactionKey] || 0) + 1;
              userReaction = reactionKey;
            }
            return { ...item, reactions: rx, userReaction };
          };

          const updated = updateItem(cObj);
          if (updated.replies) {
            updated.replies = updated.replies.map(updateItem);
          }
          return updated;
        })
      );

      if (reactionKey.toLowerCase() === 'relate') {
        // Toggle relate/like
        const target = comments.find((cObj) => cObj.id === commentId);
        if (target && target.userReaction === 'relate') {
          await apiService.unlikeComment(commentId);
        } else {
          await apiService.likeComment(commentId);
        }
      } else {
        await apiService.reactToComment(commentId, reactionKey);
      }
      
      // Reload from backend to sync
      await loadTopicAndComments(false);
    } catch (err) {
      console.warn('[TopicDiscussionScreen] React error:', err);
    }
  };

  // Image Attach Handlers
  const handleAttachImage = () => {
    Alert.alert(
      t('uploadImage', 'Upload Image'),
      t('selectImageSource', 'Select how you would like to add an image.'),
      [
        {
          text: t('camera', 'Camera'),
          onPress: () => performImageAction('camera'),
        },
        {
          text: t('gallery', 'Gallery'),
          onPress: () => performImageAction('gallery'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const performImageAction = async (source: 'camera' | 'gallery') => {
    try {
      setUploadingImage(true);
      const options = {
        mediaType: 'photo' as const,
        quality: 0.8 as const,
        maxWidth: 1000,
        maxHeight: 1000,
      };

      const result = source === 'camera'
        ? await launchCamera(options)
        : await launchImageLibrary(options);

      if (result.didCancel || !result.assets || result.assets.length === 0) {
        setUploadingImage(false);
        return;
      }

      const pickedFile = result.assets[0];
      if (!pickedFile.uri) {
        setUploadingImage(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'android' ? pickedFile.uri : pickedFile.uri.replace('file://', ''),
        name: pickedFile.fileName || 'upload.jpg',
        type: pickedFile.type || 'image/jpeg',
      } as any);

      const response = await apiService.uploadImage(formData);
      const url = response?.url || response?.data?.url || response?.imageUrl || response?.data?.imageUrl;

      if (url) {
        setAttachedImageUrl(url);
      } else {
        Alert.alert('Upload Failed', 'Could not save the image. Please try again.');
      }
    } catch (err) {
      console.warn('Image picker error:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const cleanTopicName = topicName.replace(/^#/, '').toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        style={{ flex: 1 }}
      >
        {/* Dynamic Category Banner Layout */}
        <View style={[styles.headerBanner, { backgroundColor: accentColor }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            
            <View style={styles.headerInfo}>
              <View style={styles.titleRow}>
                <Text style={styles.headerTitle}>#{cleanTopicName}</Text>
                <View style={styles.trendingBadge}>
                  <Text style={styles.trendingBadgeText}>TRENDING TOPIC</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>🕒 {t('recentlyUpdated', 'Recently updated')}</Text>
                <Text style={styles.metaText}>🔥 {comments.length} {t('opinionsShared', 'Opinions shared')}</Text>
              </View>
            </View>
          </View>

          <InitialAvatar initials={cleanTopicName.slice(0, 2)} color="rgba(255, 255, 255, 0.22)" size={48} />
        </View>

        {/* Opinion List Feed */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.deepPlum} />
            <Text style={styles.loadingText}>{t('loadingOpinions', 'Loading opinions...')}</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={comments}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.deepPlum]}
                tintColor={COLORS.deepPlum}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {t('noOpinionsYet', 'No opinions yet. Start the discussion.')}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={[styles.commentCardWrapper, { borderLeftColor: accentColor }]}>
                <CommentItem
                  comment={item}
                  postId={null}
                  currentUser={currentUser}
                  postAuthorUsername={undefined}
                  onNavigateToChat={onNavigateToChat}
                  onReplySubmit={handleReplySubmit}
                  onEditSubmit={handleEditSubmit}
                  onDelete={handleDeleteComment}
                  onReact={handleReactComment}
                />
              </View>
            )}
          />
        )}

        {/* Footer Composer Bar */}
        <View style={styles.composerWrapper}>
          {/* Optional Attached Image Thumbnail Preview */}
          {attachedImageUrl && (
            <View style={styles.imagePreviewRow}>
              <Image source={{ uri: attachedImageUrl }} style={styles.imagePreview} />
              <TouchableOpacity onPress={() => setAttachedImageUrl(null)} style={styles.removeImageBtn}>
                <Text style={styles.removeImageBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Emoji Preset Shortcut Bar */}
          {showEmojis && (
            <View style={styles.emojisShortcutBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {EMOJI_PRESETS.map((emoji) => (
                  <TouchableOpacity key={emoji} onPress={() => setCommentText((prev) => prev + emoji)} style={styles.emojiPresetBtn}>
                    <Text style={{ fontSize: 18 }}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.inputBar}>
            {/* Input Pill Container wrapping Emoji Toggle, Input, Attach Icon, and Mic */}
            <View style={styles.inputPillContainer}>
              <TouchableOpacity onPress={() => setShowEmojis(!showEmojis)} style={styles.pillIconBtn}>
                {showEmojis ? (
                  <KeyboardInputIcon color="#8C8385" size={20} />
                ) : (
                  <SmileyEmojiIcon color="#8C8385" size={20} />
                )}
              </TouchableOpacity>

              <TextInput
                placeholder={t('writeCommentPlaceholder', 'Write a comment...')}
                placeholderTextColor={COLORS.zorba}
                value={commentText}
                onChangeText={setCommentText}
                style={styles.pillTextInput}
                multiline
                maxLength={1000}
              />

              <TouchableOpacity onPress={handleAttachImage} disabled={uploadingImage} style={styles.pillIconBtn}>
                {uploadingImage ? (
                  <ActivityIndicator size="small" color={COLORS.zorba} />
                ) : (
                  <ImageAttachmentIcon color="#8C8385" size={20} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handlePress}
                disabled={isTranscribing || submitting}
                style={[
                  styles.pillIconBtn,
                  isRecording && { backgroundColor: '#FFEBEB', borderRadius: 17 }
                ]}
              >
                {isTranscribing ? (
                  <ActivityIndicator size="small" color={COLORS.zorba} />
                ) : isRecording ? (
                  <MicrophoneOffIcon color="#B33A3A" size={20} />
                ) : (
                  <MicrophoneIcon color="#8C8385" size={20} />
                )}
              </TouchableOpacity>
            </View>

            {/* Floating Send Button */}
            <TouchableOpacity
              onPress={handleSubmitOpinion}
              disabled={submitting || uploadingImage || (!commentText.trim() && !attachedImageUrl)}
              style={[
                styles.floatingSendBtn,
                { backgroundColor: accentColor },
                (!commentText.trim() && !attachedImageUrl) && { opacity: 0.4 },
              ]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.sendIconText}>➔</Text>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5F4',
  },
  headerBanner: {
    backgroundColor: '#34231E',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#2D1D15',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  backButton: {
    padding: 8,
    marginRight: 6,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  headerInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  trendingBadge: {
    backgroundColor: '#D96C3D',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  trendingBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
  },
  metaText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 10.5,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.zorba,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  commentCardWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFEAE8',
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#2D1D15',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    borderLeftWidth: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.zorba,
    textAlign: 'center',
    fontWeight: '700',
  },
  composerWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5DFDE',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  imagePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
    alignSelf: 'flex-start',
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CEC7C5',
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(45, 29, 21, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageBtnText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  emojisShortcutBar: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF8F8',
    marginBottom: 8,
  },
  emojiPresetBtn: {
    padding: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputPillContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F8',
    borderWidth: 1,
    borderColor: '#CEC7C5',
    borderRadius: 22,
    paddingHorizontal: 8,
  },
  pillTextInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 100,
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'ios' ? 10 : 6,
    paddingBottom: Platform.OS === 'ios' ? 10 : 6,
    fontSize: 13.5,
    color: '#2D1D15',
  },
  pillIconBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#2D1D15',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sendIconText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
