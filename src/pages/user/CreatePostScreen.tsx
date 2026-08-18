import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, SafeAreaView, Platform, PermissionsAndroid } from 'react-native';
import { usePosts } from '../../context/PostContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiService } from '../../services/apiService';
import { COLORS } from '../../styles/theme';
import { styles } from '../../styles/appStyles';

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
            message: 'This app needs access to your microphone to record voice posts.',
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

export function CreatePostScreen({ onPostCreated }: { onPostCreated: any }) {
  const { createPost } = usePosts() as any;
  const { currentUser } = useAuth() as any;
  const { t } = useLanguage() as any;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('General');
  const [postType, setPostType] = useState('Thought');
  const [isRecording, setIsRecording] = useState(false);

  const topics = ['General', 'Mental Health', 'Career', 'Relationships', 'Tech & Society', 'Confessions'];
  const postTypes = ['Thought', 'Question', 'Advice', 'Story', 'Vent'];

  const handlePublish = () => {
    if (!content.trim()) { return; }
    createPost({ title, content, topic, postType }, currentUser);
    setTitle('');
    setContent('');
    onPostCreated();
  };

  const startVoiceRecording = async () => {
    const hasPermission = await requestAudioPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Microphone permission is required to record voice posts.');
      return;
    }

    try {
      setIsRecording(true);
      await audioRecorderPlayer.startRecorder();
    } catch (err) {
      console.warn('Start recorder failed:', err);
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = async () => {
    try {
      const resultUri = await audioRecorderPlayer.stopRecorder();
      setIsRecording(false);

      if (resultUri) {
        Alert.alert('Processing', 'Transcribing your voice...');
        const transcribed = await apiService.voiceToText(resultUri, 'EN');
        if (transcribed) {
          setContent(prev => prev ? `${prev} ${transcribed}` : transcribed);
          Alert.alert('Speech-to-Text Success', `Transcribed: "${transcribed}"`);
        } else {
          Alert.alert('Speech-to-Text Error', 'Could not transcribe speech. Please try again.');
        }
      }
    } catch (err) {
      console.warn('Stop recorder failed:', err);
      setIsRecording(false);
    }
  };

  useEffect(() => {
    return () => {
      audioRecorderPlayer.stopRecorder().catch(() => {});
    };
  }, []);

  return (
    <ScrollView style={styles.createContainer} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.screenTitle}>{t('createPost', 'Create post anonymously')}</Text>

      <Text style={styles.fieldLabel}>{t('titleOptional', 'Title (Optional)')}</Text>
      <TextInput
        placeholder={t('titlePlaceholder', 'A summary of your thought...')}
        placeholderTextColor={COLORS.zorba}
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={styles.fieldLabel}>{t('whatIsOnYourMind', 'What is on your mind?')}</Text>
        <TouchableOpacity
          onPress={startVoiceRecording}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.deepPlumLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}
        >
          <Text style={{ fontSize: 13, marginRight: 4 }}>🎙️</Text>
          <Text style={{ fontSize: 11, color: COLORS.deepPlum, fontWeight: 'bold' }}>{t('voicePost', 'Voice Post')}</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        placeholder={t('contentPlaceholder', 'Type your thoughts here... Be honest, you are completely anonymous.')}
        placeholderTextColor={COLORS.zorba}
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={6}
        style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
      />

      <Text style={styles.fieldLabel}>{t('selectTopic', 'Select Topic')}</Text>
      <View style={styles.pickerRow}>
        {topics.map(topicItem => (
          <TouchableOpacity
            key={topicItem}
            style={[styles.pickerChip, topic === topicItem && styles.pickerChipActive]}
            onPress={() => setTopic(topicItem)}
          >
            <Text style={[styles.pickerChipText, topic === topicItem && styles.pickerChipTextActive]}>
              {topicItem === 'General' ? t('topicGeneral', 'General') :
               topicItem === 'Mental Health' ? t('topicMentalHealth', 'Mental Health') :
               topicItem === 'Career' ? t('topicCareer', 'Career') :
               topicItem === 'Relationships' ? t('topicRelationships', 'Relationships') :
               topicItem === 'Tech & Society' ? t('topicTechSociety', 'Tech & Society') :
               topicItem === 'Confessions' ? t('topicConfessions', 'Confessions') : topicItem}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>{t('selectPostType', 'Select Post Type')}</Text>
      <View style={styles.pickerRow}>
        {postTypes.map(pt => (
          <TouchableOpacity
            key={pt}
            style={[styles.pickerChip, postType === pt && styles.pickerChipActive]}
            onPress={() => setPostType(pt)}
          >
            <Text style={[styles.pickerChipText, postType === pt && styles.pickerChipTextActive]}>{pt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={handlePublish} style={styles.publishButton}>
        <Text style={styles.publishButtonText}>{t('publishAnonymously', 'Publish Anonymously')}</Text>
      </TouchableOpacity>

      {/* Pulsing Voice Recording Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isRecording}
      >
        <SafeAreaView style={styles.centerModalOverlay}>
          <View style={[styles.reportModalCard, { alignItems: 'center', paddingVertical: 32 }]}>
            <Text style={[styles.reportModalTitle, { color: COLORS.error }]}>🎙️ {t('listening', 'Listening...')}</Text>
            <Text style={[styles.reportModalSubtitle, { textAlign: 'center', marginTop: 8, paddingHorizontal: 12 }]}>
              {t('speakNow', 'Speak now. Converting your voice to anonymous text in real-time.')}
            </Text>

            {/* Pulsing Ring Simulation */}
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(196, 111, 118, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              marginVertical: 24,
            }}>
              <View style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: COLORS.error,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 24, color: '#FFF' }}>🎙️</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={stopVoiceRecording}
              style={{
                marginTop: 20,
                backgroundColor: COLORS.error,
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 24,
                alignItems: 'center',
                width: '80%',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#FFF' }}>
                Stop & Transcribe
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                audioRecorderPlayer.stopRecorder().catch(() => {});
                setIsRecording(false);
              }}
              style={{
                marginTop: 10,
                backgroundColor: '#F2EDED',
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 24,
                alignItems: 'center',
                width: '80%',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: COLORS.deepPlum }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

// â”€â”€ DIRECT MESSAGES SCREEN â”€â”€
