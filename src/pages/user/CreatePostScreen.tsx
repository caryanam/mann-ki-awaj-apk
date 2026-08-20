import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, SafeAreaView, Platform, PermissionsAndroid, ActivityIndicator, Image } from 'react-native';
import { usePosts } from '../../context/PostContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { COLORS } from '../../styles/theme';
import { styles } from '../../styles/appStyles';
import { apiService } from '../../services/apiService';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

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

const requestCameraPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'This app needs access to your camera to take photos for your posts.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
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
  const [topic, setTopic] = useState('Life');
  const [postType, setPostType] = useState('Thought');
  const [isRecording, setIsRecording] = useState(false);

  // Web spec added features
  const [imageUrl, setImageUrl] = useState('');
  const [allowComments, setAllowComments] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  const topics = ['Life', 'Career', 'Relationships', 'Education', 'Student Life', 'Personal Growth', 'Workplace', 'Parenting', 'Technology', 'Creativity', 'Books', 'Entertainment', 'Financial Experiences', 'Positive Thoughts'];
  const postTypes = ['Thought', 'Question', 'Experience', 'Need Advice', 'Confession', 'Something I Learned', 'Positive Note', 'Personal Challenge'];

  const handlePublish = () => {
    if (!content.trim()) { return; }
    createPost({ title, content, topic, postType, imageUrl, allowComments }, currentUser);
    setTitle('');
    setContent('');
    setImageUrl('');
    setAllowComments(true);
    onPostCreated();
  };

  const handleClear = () => {
    setTitle('');
    setContent('');
    setImageUrl('');
    setAllowComments(true);
  };

  const handlePickImage = () => {
    Alert.alert(
      'Upload Image',
      'Select how you would like to add an image to your post.',
      [
        {
          text: 'Camera',
          onPress: () => performImageSourceAction('camera')
        },
        {
          text: 'Gallery',
          onPress: () => performImageSourceAction('gallery')
        },
        {
          text: 'Other Options',
          onPress: showFallbackOptions
        }
      ],
      { cancelable: true }
    );
  };

  const showFallbackOptions = () => {
    Alert.alert(
      'Image Fallback Options',
      'Choose an alternative way to add an image.',
      [
        {
          text: 'Enter Image URL',
          onPress: () => {
            Alert.prompt(
              'Attach Image URL',
              'Enter a valid image URL (e.g. https://example.com/image.jpg):',
              [
                {
                  text: 'Attach',
                  onPress: (url) => {
                    if (url && url.startsWith('http')) {
                      setImageUrl(url);
                    } else {
                      Alert.alert('Invalid URL', 'Please enter a URL starting with http:// or https://');
                    }
                  }
                },
                { text: 'Cancel', style: 'cancel' }
              ],
              'plain-text'
            );
          }
        },
        {
          text: 'Theme Presets',
          onPress: () => {
            const presets = [
              'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800', // Meditation
              'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800', // Art/Creativity
              'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800', // Technology
              'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800', // Careers
            ];
            const randomPreset = presets[Math.floor(Math.random() * presets.length)];
            setImageUrl(randomPreset);
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const performImageSourceAction = async (source: 'camera' | 'gallery') => {
    if (source === 'camera') {
      const hasCamPermission = await requestCameraPermission();
      if (!hasCamPermission) {
        Alert.alert('Permission Denied', 'Camera permission is required to take a live photo.');
        return;
      }
    }

    try {
      setUploadingImage(true);

      const options = {
        mediaType: 'photo' as const,
        quality: 0.8 as const,
        maxWidth: 1200,
        maxHeight: 1200,
        saveToPhotos: source === 'camera',
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
      if (response && response.success && response.data?.imageUrl) {
        setImageUrl(response.data.imageUrl);
      } else if (response && response.imageUrl) {
        setImageUrl(response.imageUrl);
      } else {
        Alert.alert('Error', response?.message || 'Failed to upload image. Please try again.');
      }
    } catch (err: any) {
      console.warn('Image picker/upload error:', err);
      Alert.alert(
        'Upload Failed',
        'Could not access the camera or gallery, or the image upload failed. Please try again or use the fallback options.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Other Options', onPress: showFallbackOptions }
        ]
      );
    } finally {
      setUploadingImage(false);
    }
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
      audioRecorderPlayer.stopRecorder().catch(() => { });
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F5F4', position: 'relative' }}>
      {/* Ambient background decoration blobs */}
      <View style={{ position: 'absolute', top: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: '#FAF1ED', opacity: 0.8, zIndex: 0 }} />
      <View style={{ position: 'absolute', bottom: -50, right: -100, width: 320, height: 320, borderRadius: 160, backgroundColor: '#F5ECF0', opacity: 0.9, zIndex: 0 }} />
      <View style={{ position: 'absolute', top: '35%', right: -80, width: 180, height: 180, borderRadius: 90, backgroundColor: '#FFFDF9', opacity: 0.7, zIndex: 0 }} />

      <ScrollView style={[styles.createContainer, { zIndex: 1 }]} contentContainerStyle={{ padding: 16 }}>
        <Text style={[styles.screenTitle, { fontSize: 20, fontWeight: '800', color: '#2D1D15', marginBottom: 12 }]}>
          {t('createAnonymousPost', 'Create Anonymous Post')}
        </Text>

        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          padding: 20,
          borderWidth: 1.5,
          borderColor: 'rgba(255, 255, 255, 0.8)',
          shadowColor: '#2D1D15',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.08,
          shadowRadius: 24,
          elevation: 6,
          marginBottom: 30,
        }}>
          {/* Post Type & Topic selection labels */}
          <Text style={[styles.fieldLabel, { marginTop: 0 }]}>{t('postExpressionType', 'Post Expression Type')}</Text>
          <View style={[styles.pickerRow, { marginBottom: 16 }]}>
            {postTypes.map(pt => (
              <TouchableOpacity
                key={pt}
                style={[styles.pickerChip, { borderRadius: 18, borderWidth: 1.5, borderColor: postType === pt ? '#6F405F' : '#E8E1E5', backgroundColor: postType === pt ? 'rgba(111, 64, 95, 0.08)' : '#FFFFFF' }]}
                onPress={() => setPostType(pt)}
              >
                <Text style={[{ fontSize: 12, fontWeight: 'bold', color: postType === pt ? '#6F405F' : '#8C8385' }]}>{pt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>{t('contentTopic', 'Content Topic')}</Text>
          <View style={[styles.pickerRow, { marginBottom: 16 }]}>
            {topics.map(topicItem => (
              <TouchableOpacity
                key={topicItem}
                style={[styles.pickerChip, { borderRadius: 18, borderWidth: 1.5, borderColor: topic === topicItem ? '#6F405F' : '#E8E1E5', backgroundColor: topic === topicItem ? 'rgba(111, 64, 95, 0.08)' : '#FFFFFF' }]}
                onPress={() => setTopic(topicItem)}
              >
                <Text style={[{ fontSize: 12, fontWeight: 'bold', color: topic === topicItem ? '#6F405F' : '#8C8385' }]}>
                  {topicItem}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Title */}
          <Text style={styles.fieldLabel}>{t('titleOptional', 'Title (Optional)')}</Text>
          <TextInput
            placeholder={t('titlePlaceholderDesc', 'A short title summarizing your thought...')}
            placeholderTextColor={COLORS.zorba}
            value={title}
            onChangeText={setTitle}
            maxLength={120}
            style={[styles.input, { borderRadius: 12, borderWidth: 1.5, borderColor: '#E8E1E5', backgroundColor: '#FAF8F8', height: 48, paddingHorizontal: 14 }]}
          />

          {/* Post Content with Character Counter */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <Text style={styles.fieldLabel}>{t('postContentLabel', 'Post Content *')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity
                onPress={startVoiceRecording}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(111, 64, 95, 0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(111, 64, 95, 0.15)' }}
              >
                <Text style={{ fontSize: 12, marginRight: 4 }}>🎙️</Text>
                <Text style={{ fontSize: 11, color: COLORS.deepPlum, fontWeight: 'bold' }}>{t('voicePost', 'Voice Post')}</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: content.trim().length > 0 ? '#6F405F' : '#8C8385' }}>
                {content.length} / 2500
              </Text>
            </View>
          </View>

          <TextInput
            placeholder={t('postContentPlaceholder', 'Type your thoughts here... Be honest, you are completely anonymous.')}
            placeholderTextColor={COLORS.zorba}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
            maxLength={2500}
            style={[styles.input, { height: 140, textAlignVertical: 'top', borderRadius: 12, borderWidth: 1.5, borderColor: '#E8E1E5', backgroundColor: '#FAF8F8', padding: 14, marginTop: 6 }]}
          />

          {/* Upload Image Section */}
          <Text style={styles.fieldLabel}>{t('uploadImage', 'Upload Image')}</Text>
          {uploadingImage ? (
            <View style={{
              height: 110,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: '#E8E1E5',
              borderRadius: 12,
              backgroundColor: '#FAF8F8',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 10,
            }}>
              <ActivityIndicator size="small" color="#6F405F" />
              <Text style={{ fontSize: 11, color: '#8C8385', marginTop: 8 }}>Uploading image...</Text>
            </View>
          ) : imageUrl ? (
            <View style={{ position: 'relative', marginBottom: 12, borderRadius: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: '#E8E1E5' }}>
              <Image
                source={{ uri: imageUrl.startsWith('http') ? imageUrl : `https://api.awaazmanki.com${imageUrl}` }}
                style={{ width: '100%', height: 180, resizeMode: 'cover' }}
              />
              <TouchableOpacity
                onPress={() => setImageUrl('')}
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handlePickImage}
              style={{
                height: 110,
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: '#E8E1E5',
                borderRadius: 12,
                backgroundColor: '#FAF8F8',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 12,
                padding: 10,
              }}
            >
              <Text style={{ fontSize: 24, marginBottom: 4 }}>📤</Text>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#6F405F' }}>Choose Image File</Text>
              <Text style={{ fontSize: 10, color: '#8C8385', marginTop: 4, textAlign: 'center' }}>
                PNG, JPG, WEBP, GIF, SVG, BMP (Max 10MB) • Verified by AI Safety
              </Text>
            </TouchableOpacity>
          )}

          {/* Allow Comments Checkbox */}
          <TouchableOpacity
            onPress={() => setAllowComments(!allowComments)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FAF8F8',
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: '#E8E1E5',
              padding: 12,
              marginTop: 6,
              marginBottom: 10,
            }}
          >
            {/* Box */}
            <View style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              borderWidth: 2,
              borderColor: allowComments ? '#6F405F' : '#8C8385',
              backgroundColor: allowComments ? '#6F405F' : 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 10,
            }}>
              {allowComments && (
                <View style={{
                  width: 10,
                  height: 5,
                  borderBottomWidth: 2.2,
                  borderLeftWidth: 2.2,
                  borderColor: '#FFFFFF',
                  transform: [{ rotate: '-45deg' }],
                  marginTop: -2,
                }} />
              )}
            </View>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#2D1D15' }}>
              Allow comments & replies on this post
            </Text>
          </TouchableOpacity>

          {/* Actions Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <TouchableOpacity
              onPress={handleClear}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: '#E8E1E5',
                backgroundColor: '#FAF8F8',
              }}
            >
              <Text style={{ fontSize: 13.5, fontWeight: 'bold', color: '#8C8385' }}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePublish}
              disabled={!content.trim()}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 12,
                backgroundColor: content.trim() ? '#6F405F' : '#F3EEF1',
                minWidth: 140,
              }}
            >
              <Text style={{ fontSize: 13.5, fontWeight: 'bold', color: content.trim() ? '#FFFFFF' : '#A58BA0' }}>Publish Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

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
                audioRecorderPlayer.stopRecorder().catch(() => { });
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
    </View>
  );
}

// â”€â”€ DIRECT MESSAGES SCREEN â”€â”€
