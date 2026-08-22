import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, TextInput, ActivityIndicator, Platform, PermissionsAndroid, ScrollView } from 'react-native';
import { InitialAvatar } from '../common/InitialAvatar';
import { usePosts } from '../../context/PostContext';
import { useLanguage } from '../../context/LanguageContext';
import { COLORS } from '../../styles/theme';
import { styles } from '../../styles/appStyles';
import { apiService } from '../../services/apiService';
import { normalizeLanguageCode, detectTextLanguage } from '../../services/apiTranslationService';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

const audioRecorderPlayer = new AudioRecorderPlayer();

const requestAudioPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const sdkVersion = typeof Platform.Version === 'number' ? Platform.Version : parseInt(Platform.Version, 10);
      if (sdkVersion < 29) {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ]);
        return (
          grants[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED &&
          grants[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone to record voice comments.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true;
};

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

// --- CUSTOM HIGH-FIDELITY VECTOR ICONS DRAWN WITH NATIVE VIEWS ---

const TrashIcon = ({ color = '#C46F76', size = 15 }) => (
  <View style={{ width: size, height: size + 2, justifyContent: 'center', alignItems: 'center' }}>
    {/* Lid handle */}
    <View style={{ width: size * 0.35, height: 1.8, backgroundColor: color, borderRadius: 0.5, marginBottom: 1 }} />
    {/* Lid */}
    <View style={{ width: size * 0.85, height: 1.8, backgroundColor: color, borderRadius: 0.8, marginBottom: 1.2 }} />
    {/* Can body */}
    <View style={{
      width: size * 0.65,
      height: size * 0.7,
      borderWidth: 1.6,
      borderColor: color,
      borderTopWidth: 0,
      borderBottomLeftRadius: 3,
      borderBottomRightRadius: 3,
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: 2,
    }}>
      {/* Ribs inside can */}
      <View style={{ width: 1.2, height: '70%', backgroundColor: color, opacity: 0.5 }} />
      <View style={{ width: 1.2, height: '70%', backgroundColor: color, opacity: 0.5 }} />
    </View>
  </View>
);

const BookmarkIcon = ({ active = false, color = '#8C8385', size = 15 }) => {
  const iconColor = active ? '#D96C3D' : color; // Warm terracotta/yellow for saved, matching web
  return (
    <View style={{ width: size, height: size + 2, justifyContent: 'center', alignItems: 'center' }}>
      {/* Outer border shape */}
      <View style={{
        width: size * 0.72,
        height: size * 0.95,
        borderWidth: 1.6,
        borderColor: iconColor,
        borderBottomWidth: 0,
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
        backgroundColor: active ? iconColor : 'transparent',
      }} />
      {/* Bottom notched lines */}
      <View style={{
        flexDirection: 'row',
        position: 'absolute',
        bottom: 0.8,
        width: size * 0.72,
        justifyContent: 'space-between',
      }}>
        <View style={{
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderLeftWidth: 0,
          borderRightWidth: (size * 0.72) / 2,
          borderBottomWidth: 4,
          borderRightColor: 'transparent',
          borderBottomColor: active ? iconColor : 'transparent',
          borderTopWidth: 0,
          borderColor: iconColor,
          borderLeftColor: iconColor,
        }} />
        <View style={{
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderLeftWidth: (size * 0.72) / 2,
          borderRightWidth: 0,
          borderBottomWidth: 4,
          borderLeftColor: 'transparent',
          borderBottomColor: active ? iconColor : 'transparent',
          borderTopWidth: 0,
          borderColor: iconColor,
          borderRightColor: iconColor,
        }} />
      </View>
    </View>
  );
};

export const CommentIcon = ({ color = '#8C8385', size = 13 }) => (
  <View style={{ width: size + 2, height: size + 1, justifyContent: 'center', alignItems: 'center', marginRight: 4 }}>
    {/* Bubble body */}
    <View style={{
      width: size * 0.95,
      height: size * 0.75,
      borderWidth: 1.5,
      borderColor: color,
      borderRadius: 4,
      backgroundColor: 'transparent',
    }} />
    {/* Left tail */}
    <View style={{
      position: 'absolute',
      bottom: 0.5,
      left: 1.8,
      width: 0,
      height: 0,
      borderStyle: 'solid',
      borderLeftWidth: 3,
      borderRightWidth: 3,
      borderTopWidth: 3.5,
      borderLeftColor: color,
      borderRightColor: 'transparent',
      borderTopColor: color,
    }} />
  </View>
);

export const DMIcon = ({ color = '#6F405F', size = 13 }) => (
  <View style={{ width: size + 2, height: size, justifyContent: 'center', alignItems: 'center', marginRight: 4 }}>
    {/* Envelope container */}
    <View style={{
      width: size * 1.05,
      height: size * 0.75,
      borderWidth: 1.5,
      borderColor: color,
      borderRadius: 2.2,
      justifyContent: 'flex-start',
      alignItems: 'center',
    }}>
      {/* V line lines */}
      <View style={{
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderLeftWidth: size * 0.42,
        borderRightWidth: size * 0.42,
        borderTopWidth: size * 0.28,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: color,
        marginTop: 0.5,
      }} />
    </View>
  </View>
);

export const FlagIcon = ({ color = '#C46F76', size = 13 }) => (
  <View style={{ width: size, height: size + 2, flexDirection: 'row', alignItems: 'flex-start' }}>
    {/* Pole */}
    <View style={{ width: 1.5, height: size + 1.5, backgroundColor: color }} />
    {/* Flag banner */}
    <View style={{
      width: size * 0.65,
      height: size * 0.5,
      backgroundColor: color,
      borderTopRightRadius: 1.2,
      borderBottomRightRadius: 1.2,
    }} />
  </View>
);

export function PostCardItem({ item, currentUser, handlePostReact, onNavigateToChat: _onNavigateToChat, setActiveReportPost, setReportModalVisible, onOpenComments, showInlineComment = true, flat = false }: {
  item: any;
  currentUser: any;
  handlePostReact: any;
  onNavigateToChat: any;
  setActiveReportPost: any;
  setReportModalVisible: any;
  onOpenComments: any;
  showInlineComment?: boolean;
  flat?: boolean;
}) {
  const { toggleSavePost, deletePost, addComment } = usePosts() as any;
  const { currentLanguage, translateText, t } = useLanguage() as any;

  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const displayTitle = translateText(item.originalTitle || item.title, currentLanguage);
  const displayContent = translateText(item.originalContent || item.content, currentLanguage);

  const detectedCode = detectTextLanguage(item.originalContent || item.content);
  const postLangCode = (detectedCode !== 'EN') ? detectedCode : (normalizeLanguageCode(item.language) || 'EN');
  const isDifferentLanguage = postLangCode !== currentLanguage;
  const hasTranslation = isDifferentLanguage && (
    (displayTitle && displayTitle !== (item.originalTitle || item.title)) ||
    (displayContent && displayContent !== (item.originalContent || item.content))
  );

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

  useEffect(() => {
    return () => {
      audioRecorderPlayer.stopRecorder().catch(() => {});
    };
  }, []);

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await addComment(item.id, commentText.trim(), currentUser);
      setCommentText('');
      Alert.alert('Success', 'Comment posted successfully!');
    } catch (err: any) {
      console.warn('Comment submit error:', err);
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const startVoiceComment = async () => {
    const hasPermission = await requestAudioPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Microphone permission is required to record voice comments.');
      return;
    }

    try {
      setIsRecording(true);
      await audioRecorderPlayer.startRecorder();
      
      Alert.alert(
        'Recording voice comment...',
        'Speak now. Converting your voice to anonymous text.',
        [
          {
            text: 'Stop & Transcribe',
            onPress: async () => {
              try {
                const resultUri = await audioRecorderPlayer.stopRecorder();
                setIsRecording(false);
                if (resultUri) {
                  Alert.alert('Processing', 'Transcribing your voice...');
                  const transcribed = await apiService.voiceToText(resultUri, currentLanguage || 'EN');
                  if (transcribed) {
                    setCommentText(prev => prev ? `${prev} ${transcribed}` : transcribed);
                    Alert.alert('Speech-to-Text Success', `Transcribed: "${transcribed}"`);
                  } else {
                    Alert.alert('Speech-to-Text Error', 'Could not transcribe speech. Please try again.');
                  }
                }
              } catch (err) {
                console.warn('Stop recorder failed:', err);
                setIsRecording(false);
              }
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              audioRecorderPlayer.stopRecorder().catch(() => {});
              setIsRecording(false);
            }
          }
        ],
        { cancelable: false }
      );
    } catch (err) {
      console.warn('Start recorder failed:', err);
      setIsRecording(false);
    }
  };

  const reactionButtons = [
    { key: 'relate', label: 'relate', icon: '♡', activeIcon: '❤️' },
    { key: 'stayStrong', label: 'support', icon: '🤝', activeIcon: '🤝' },
    { key: 'wellSaid', label: 'agree', icon: '👍', activeIcon: '👍' },
    { key: 'helpful', label: 'interesting', icon: '💡', activeIcon: '💡' },
  ];

  return (
    <View style={[
      styles.postCard,
      flat && {
        borderWidth: 0,
        borderRadius: 0,
        elevation: 0,
        shadowOpacity: 0,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        marginBottom: 0,
        backgroundColor: '#FFFFFF',
      }
    ]}>
      {/* Post Header with single line metadata */}
      <View style={[styles.postHeader, { alignItems: 'center', paddingBottom: 10 }]}>
        <InitialAvatar initials={item.avatarInitials} color={item.avatarColor} size={40} />
        
        {/* Center content containing Username, Type, Topic, and Time in one row */}
        <View style={{ flex: 1, marginLeft: 10, justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <Text style={{ fontSize: 13.5, fontWeight: '700', color: '#2D1D15' }} numberOfLines={1}>
              {item.username}
            </Text>
            
            <View style={{
              backgroundColor: topicThemeColor,
              borderRadius: 12,
              paddingHorizontal: 10,
              paddingVertical: 3,
            }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF', textTransform: 'uppercase' }}>
                🏷️ {item.topic}
              </Text>
            </View>

            <Text style={{ fontSize: 10.5, color: COLORS.zorba }}>
              • {item.postType}
            </Text>
            
            {item.createdAt && (
              <Text style={{ fontSize: 10.5, color: '#8C8385' }}>
                • {formatTimeAgo(item.createdAt)}
              </Text>
            )}
          </View>
        </View>

        {/* Right content containing Actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 2 }}>

          {/* Flag Button */}
          {item.username !== currentUser?.username && (
            <TouchableOpacity
              onPress={() => {
                setActiveReportPost(item);
                setReportModalVisible(true);
              }}
              style={{ padding: 4 }}
            >
              <Text style={{ fontSize: 14 }}>🏳️</Text>
            </TouchableOpacity>
          )}
          {/* Delete Button */}
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
              style={{ padding: 4 }}
            >
              <TrashIcon color="#C46F76" size={15} />
            </TouchableOpacity>
          )}
          {/* Bookmark Button */}
          <TouchableOpacity onPress={() => toggleSavePost(item.id)} style={{ padding: 4 }}>
            <BookmarkIcon active={item.isSaved} color="#8C8385" size={15} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Header Separator Line */}
      <View style={{ height: 1, backgroundColor: '#F0ECEE', marginBottom: 12 }} />

      <Text style={styles.postTitle}>{showOriginal ? (item.originalTitle || item.title) : displayTitle}</Text>
      <Text style={styles.postContent}>{showOriginal ? (item.originalContent || item.content) : displayContent}</Text>

      {hasTranslation && (
        <TouchableOpacity
          onPress={() => setShowOriginal(!showOriginal)}
          style={{ alignSelf: 'flex-start', marginTop: -4, marginBottom: 8, paddingVertical: 2 }}
        >
          <Text style={{ fontSize: 11, color: COLORS.deepPlum, fontWeight: 'bold' }}>
            🌐 {showOriginal ? t('showTranslation', 'Show Translation') : t('showOriginal', 'Show Original')}
          </Text>
        </TouchableOpacity>
      )}

      {item.imageUrl ? (
        <View style={{ marginBottom: 12, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F0ECEE' }}>
          <Image
            source={{ uri: item.imageUrl.startsWith('http') ? item.imageUrl : `https://api.awaazmanki.com${item.imageUrl}` }}
            style={{ width: '100%', height: 200, resizeMode: 'cover' }}
          />
        </View>
      ) : null}

      {/* Capsule reaction and comments row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 12 }}>
        {/* Left Reactions List */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 6 }}>
          {reactionButtons.map((btn) => {
            const count = item.reactions[btn.key] || 0;
            const isActive = userReacted === btn.key;
            return (
              <TouchableOpacity
                key={btn.key}
                onPress={() => handlePostReact(item.id, btn.key)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: isActive ? '#6F405F' : '#E8E1E5',
                  backgroundColor: isActive ? 'rgba(111, 64, 95, 0.06)' : '#FFFFFF',
                }}
              >
                <Text style={{ fontSize: 13, marginRight: 4 }}>
                  {isActive ? btn.activeIcon : btn.icon}
                </Text>
                <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: isActive ? '#6F405F' : '#5C5254' }}>
                  {btn.label} {count > 0 ? `(${count})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Right Comments Pill */}
        <TouchableOpacity
          onPress={() => onOpenComments(item)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#E8E1E5',
            backgroundColor: '#F6F3F2',
          }}
        >
          <Text style={{ fontSize: 13, marginRight: 4 }}>💬</Text>
          <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#5C5254' }}>
            {t('comments', 'Comments')} ({item.commentCount || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Inline Comment Input Bar */}
      {showInlineComment && (
        <>
          {/* Separator line */}
          <View style={{ height: 1, backgroundColor: '#F0ECEE', marginVertical: 8 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}>
            <InitialAvatar
              initials={currentUser?.avatarInitials || 'AN'}
              color={currentUser?.avatarColor || '#6F405F'}
              size={32}
            />
            
            <View style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FAF8F8',
              borderWidth: 1,
              borderColor: '#E8E1E5',
              borderRadius: 20,
              paddingHorizontal: 12,
              marginHorizontal: 8,
              height: 38,
            }}>
              <TextInput
                placeholder={`Comment as ${currentUser?.username || '@anonymous'}...`}
                placeholderTextColor="#CEC7C5"
                value={commentText}
                onChangeText={setCommentText}
                style={{
                  flex: 1,
                  fontSize: 12.5,
                  color: '#2D1D15',
                  paddingVertical: 0,
                }}
              />
              
              {/* Microphone Icon Button */}
              <TouchableOpacity
                onPress={startVoiceComment}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: isRecording ? '#C46F76' : '#F2EDED',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 12, color: isRecording ? '#FFFFFF' : '#6F405F' }}>🎙️</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleCommentSubmit}
              disabled={submittingComment || !commentText.trim()}
              style={{
                height: 34,
                paddingHorizontal: 14,
                borderRadius: 17,
                backgroundColor: commentText.trim() ? '#6F405F' : '#E8E1E5',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {submittingComment ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{
                  color: commentText.trim() ? '#FFFFFF' : '#8C8385',
                  fontSize: 12,
                  fontWeight: 'bold',
                }}>
                  Post
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}
