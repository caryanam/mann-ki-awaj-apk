import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { useLanguage } from '../../context/LanguageContext';
import { apiService } from '../../services/apiService';
import { COLORS } from '../../styles/theme';
import { moderationCheck } from '../../utils/moderationCheck';

// WhatsApp-style categorized emoji collection
const EMOJI_CATEGORIES = [
  {
    name: 'Popular',
    icon: '🔥',
    emojis: ['😊', '❤️', '🔥', '👍', '🙏', '💡', '🤝', '💯', '🌸', '✨', '👏', '😍', '🤣', '🎉', '🚀', '🙌'],
  },
  {
    name: 'Smileys',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😊', '😇',
      '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑',
      '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄',
      '😬', '😌', '😔', '😪', '😴', '😷', '🤒', '🤕', '🤮', '😎',
      '🥳', '🥸', '🤓', '🧐'
    ],
  },
  {
    name: 'Gestures',
    icon: '👍',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '✌️', '🤞', '🤟', '🤘',
      '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜',
      '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '💪'
    ],
  },
  {
    name: 'Hearts',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '❣️',
      '💓', '💗', '💖', '💘', '💝', '💌', '😍', '🥰', '😘', '💋'
    ],
  },
];

interface CommentComposerProps {
  postId: any;
  onSubmit: (text: string) => void;
  placeholder?: string;
  currentUser?: any;
}

export function CommentComposer({
  postId,
  onSubmit,
  placeholder = 'Write a comment...',
  currentUser,
}: CommentComposerProps) {
  const { t, currentLanguage } = useLanguage() as any;
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

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
          setText((prev) => (prev ? `${prev} ${transcribed}` : transcribed));
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

  const minLength = 2;
  const maxLength = 1000;
  const isValid = text.trim().length >= minLength && text.length <= maxLength;

  const modCheck = moderationCheck(text);
  const isBlocked = modCheck.status === 'BLOCKED';

  const handleSubmit = async () => {
    if (!isValid || isBlocked || submitting) return;

    setSubmitting(true);
    try {
      await onSubmit(text.trim());
      setText('');
      setShowEmojis(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  return (
    <View style={styles.container}>
      {/* Moderation Alert Indicator */}
      {isBlocked && (
        <View style={styles.alertBar}>
          <Text style={styles.alertText}>
            ⚠️ Text contains flagged content. Please review your comment.
          </Text>
        </View>
      )}

      {/* Pill Capsule Input Box */}
      <View
        style={[
          styles.capsule,
          isBlocked && styles.capsuleBlocked,
          { borderColor: isBlocked ? COLORS.error : '#6F405F' },
        ]}
      >
        {/* Left Smile Button */}
        <TouchableOpacity
          onPress={() => setShowEmojis(!showEmojis)}
          style={styles.smileButton}
        >
          <Text style={[styles.smileText, { color: showEmojis ? '#6F405F' : '#8C8385' }]}>😀</Text>
        </TouchableOpacity>

        {/* Middle Input Field */}
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t('writeCommentPlaceholder', placeholder)}
          placeholderTextColor="#8C8385"
          maxLength={maxLength}
          editable={!submitting}
          style={styles.input}
          multiline={false}
        />

        {/* Right Action Icons: Mic + Send Button */}
        <View style={styles.actionsRow}>
          {/* Microphone */}
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            style={[
              styles.micButton,
              isRecording && styles.micButtonActive,
            ]}
          >
            {isTranscribing ? (
              <ActivityIndicator size="small" color="#6F405F" />
            ) : (
              <Text style={{ fontSize: 16 }}>{isRecording ? '🛑' : '🎤'}</Text>
            )}
          </TouchableOpacity>

          {/* Send Arrow Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isValid || isBlocked || submitting}
            style={[
              styles.sendButton,
              {
                backgroundColor: !isValid || isBlocked || submitting ? '#E5E0DF' : '#6F405F',
              },
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[styles.sendIconText, { color: !isValid || isBlocked || submitting ? '#A59B98' : '#FFFFFF' }]}>
                ➔
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Categorized Emoji Picker Panel */}
      {showEmojis && (
        <View style={styles.emojiPicker}>
          {/* Category Tabs */}
          <View style={styles.pickerHeader}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
              {EMOJI_CATEGORIES.map((cat, idx) => (
                <TouchableOpacity
                  key={cat.name}
                  onPress={() => setActiveCategoryIndex(idx)}
                  style={[
                    styles.tabButton,
                    activeCategoryIndex === idx && styles.tabButtonActive,
                  ]}
                >
                  <Text style={{ fontSize: 13 }}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.tabText,
                      {
                        fontWeight: activeCategoryIndex === idx ? 'bold' : 'normal',
                        color: activeCategoryIndex === idx ? '#6F405F' : '#6E625F',
                      },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowEmojis(false)} style={styles.closePickerBtn}>
              <Text style={styles.closePickerText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Emoji Grid */}
          <View style={styles.emojiGrid}>
            {EMOJI_CATEGORIES[activeCategoryIndex].emojis.map((emoji, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleEmojiClick(emoji)}
                style={styles.emojiBtn}
              >
                <Text style={styles.emojiChar}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  alertBar: {
    backgroundColor: '#FFEBEB',
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  alertText: {
    color: COLORS.error,
    fontSize: 11,
    fontWeight: 'bold',
  },
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    paddingVertical: 4,
    paddingHorizontal: 12,
    shadowColor: '#6F405F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  capsuleBlocked: {
    shadowColor: COLORS.error,
  },
  smileButton: {
    padding: 4,
    marginRight: 6,
  },
  smileText: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    color: '#2D1D15',
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    marginRight: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  micButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonActive: {
    backgroundColor: '#FFEBEB',
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIconText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emojiPicker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E0DF',
    marginTop: 8,
    padding: 8,
    shadowColor: '#2D1D15',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EDE8E6',
    paddingBottom: 6,
    marginBottom: 6,
  },
  tabsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(111, 64, 95, 0.12)',
    borderWidth: 1,
    borderColor: '#6F405F',
  },
  tabText: {
    fontSize: 11,
  },
  closePickerBtn: {
    padding: 4,
  },
  closePickerText: {
    fontSize: 14,
    color: '#8C8385',
    fontWeight: 'bold',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    maxHeight: 120,
    overflow: 'scroll',
    paddingVertical: 4,
  },
  emojiBtn: {
    padding: 4,
    borderRadius: 6,
  },
  emojiChar: {
    fontSize: 20,
  },
});
