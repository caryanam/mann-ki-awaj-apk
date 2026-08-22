import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Modal, SafeAreaView, TextInput, Alert, StyleSheet, Image, Platform, PermissionsAndroid, ActivityIndicator, RefreshControl } from 'react-native';
import { PostCardItem } from '../../components/posts/PostCardItem';
import { CommentItem } from '../../components/posts/CommentItem';
import { CommentComposer } from '../../components/posts/CommentComposer';
import { usePosts } from '../../context/PostContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { COLORS } from '../../styles/theme';
import { styles as appStyles } from '../../styles/appStyles';
import { localStorage } from '../../services/localStorage';
import { TOPIC_CATEGORIES, saveCustomTopic, computeTopicStats, getCustomTopics, syncTopicsWithDatabase } from '../../utils/topicUtils';
import { moderationCheck } from '../../utils/moderationCheck';
import { apiService } from '../../services/apiService';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

const audioRecorderPlayer = new AudioRecorderPlayer();

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

const EMOJI_PRESETS = [
  '💡', '🧘', '🚀', '🎭', '🧠', '🎨', '🎵', '📚', '🏆', '💻', 
  '🔮', '🍿', '☕', '🎮', '🌿', '✈️', '💬', '✨', '🔥', '💖', 
  '🤫', '🌟', '🎯', '⚡', '👑', '🌈', '🍀', '🍕', '🎉', '🥊'
];

export function HomeFeedScreen({ onNavigateToChat, initialTopic, onClearInitialTopic, _onNavigateToCreatePost }: { 
  onNavigateToChat: any; 
  initialTopic?: string;
  onClearInitialTopic?: () => void;
  _onNavigateToCreatePost?: (topicName: string) => void;
}) {
  const { posts, reactToPost, addComment, fileReport, loadComments, refreshPosts } = usePosts() as any;
  const { currentUser } = useAuth() as any;
  const { t, currentLanguage, translationCache, translateText } = useLanguage() as any;

  // Filter and Topic states
  const [activeTab, setActiveTab] = useState('Latest');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [commentText, setCommentText] = useState('');
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('Spam');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshPosts();
    } catch (err) {
      console.warn('[HomeFeedScreen] refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };
  const [reportNotes, setReportNotes] = useState('');
  const [activeReportPost, setActiveReportPost] = useState<any>(null);

  React.useEffect(() => {
    if (initialTopic) {
      setSelectedTopic(initialTopic);
      if (onClearInitialTopic) {
        onClearInitialTopic();
      }
    }
  }, [initialTopic, onClearInitialTopic]);

  // Topic catalog additions
  const [activeCategoryTab, setActiveCategoryTab] = useState('All');
  const [customTopicModalVisible, setCustomTopicModalVisible] = useState(false);
  const [newCustomTopicName, setNewCustomTopicName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('💡');
  const [customTopicsTrigger, setCustomTopicsTrigger] = useState(0);

  // Web Create Post parity modal states
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createContent, setCreateContent] = useState('');
  const [createImageUrl, setCreateImageUrl] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const createFullText = `${createTitle} ${createContent}`;
  const createModResult = moderationCheck(createFullText);
  const isCreateBlocked = createModResult.status === 'BLOCKED';

  const { createPost } = usePosts() as any;

  const handlePublishPost = async () => {
    if (!createContent.trim() || createSubmitting || isCreateBlocked || uploadingImage) { return; }

    setCreateSubmitting(true);
    try {
      const newPost = await createPost({
        title: createTitle,
        content: createContent,
        topic: selectedTopic || 'GENERAL',
        postType: 'Thought',
        imageUrl: createImageUrl,
        allowComments: true
      }, currentUser);

      setCreateTitle('');
      setCreateContent('');
      setCreateImageUrl('');
      setCreateModalVisible(false);

      if (newPost?.status === 'PENDING_REVIEW') {
        Alert.alert(
          t('pendingReviewTitle', 'Post Under Review'),
          t('pendingReviewMessage', 'Your post contains sensitive content and is pending manual review before appearing publicly.')
        );
      } else {
        Alert.alert(t('success', 'Success'), t('postCreatedSuccess', 'Your thought has been shared anonymously!'));
      }
    } catch (err: any) {
      console.warn('Publish inline post error:', err);
      Alert.alert(t('error', 'Error'), t('publishFailed', 'Failed to publish post. Please check your connection.'));
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handlePickImage = () => {
    Alert.alert(
      t('uploadImage', 'Upload Image'),
      t('selectImageSource', 'Select how you would like to add an image to your post.'),
      [
        {
          text: t('camera', 'Camera'),
          onPress: () => performImageSourceAction('camera')
        },
        {
          text: t('gallery', 'Gallery'),
          onPress: () => performImageSourceAction('gallery')
        },
        {
          text: t('otherOptions', 'Other Options'),
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
              'Enter a valid image URL:',
              [
                {
                  text: 'Attach',
                  onPress: (url) => {
                    if (url && url.startsWith('http')) {
                      setCreateImageUrl(url);
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
              'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
              'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800',
              'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
              'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
            ];
            const randomPreset = presets[Math.floor(Math.random() * presets.length)];
            setCreateImageUrl(randomPreset);
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
        setCreateImageUrl(response.data.imageUrl);
      } else if (response && response.imageUrl) {
        setCreateImageUrl(response.imageUrl);
      } else {
        Alert.alert('Error', response?.message || 'Failed to upload image. Please try again.');
      }
    } catch (err: any) {
      console.warn('Inline image picker/upload error:', err);
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
      Alert.alert('Permission Denied', 'Microphone permission is required to record voice thoughts.');
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
        const transcribed = await apiService.voiceToText(resultUri, currentLanguage || 'EN');
        if (transcribed) {
          setCreateContent(prev => prev ? `${prev} ${transcribed}` : transcribed);
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

  // Sync database and initialize custom topics
  useEffect(() => {
    async function initSync() {
      try {
        await localStorage.init();
        await syncTopicsWithDatabase();
        setCustomTopicsTrigger(prev => prev + 1);
      } catch (e) {
        console.warn('[HomeFeedScreen] sync err:', e);
      }
    }
    initSync();
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

  // List of user created custom topics
  const customTopicNames = useMemo(() => {
    return getCustomTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customTopicsTrigger, customTopicModalVisible]);

  // Topic statistics map
  const topicStatsMap = useMemo(() => {
    const statsList = computeTopicStats(posts);
    const map: any = {};
    statsList.forEach((st: any) => {
      map[st.name] = st;
    });
    return map;
  }, [posts]);

  // Dynamically resolve category color for detail card
  const selectedTopicCategoryColor = useMemo(() => {
    if (selectedTopic === 'All') return '#6F405F';
    const cleanTopic = selectedTopic.toUpperCase().trim();
    const cat = TOPIC_CATEGORIES.find(c =>
      c.subtopics.some(st => st.id.toUpperCase() === cleanTopic)
    );
    if (cat) return cat.accent;
    const customTopics = getCustomTopics();
    const customMatch = customTopics.find((tObj: any) => {
      const topicId = typeof tObj === 'string' ? tObj : (tObj.id || tObj.name);
      return topicId.toUpperCase() === cleanTopic;
    });
    if (customMatch) return '#D96C3D';
    return '#6F405F';
  }, [selectedTopic]);

  // Formatted duration of the last post under the selected topic channel
  const lastPostTimeStr = useMemo(() => {
    const stat = topicStatsMap[selectedTopic];
    if (!stat || !stat.lastPostMs) return '1d ago';
    const diffMins = Math.floor((Date.now() - stat.lastPostMs) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  }, [selectedTopic, topicStatsMap]);

  // Categories list filtered and sorted
  const displayedCategories = useMemo(() => {
    let baseCategories = TOPIC_CATEGORIES.map(cat => ({
      ...cat,
      subtopics: [...cat.subtopics]
    }));

    // Filter by active category tab if selected
    if (activeCategoryTab !== 'All') {
      baseCategories = baseCategories.filter(cat => 
        cat.name.toLowerCase() === activeCategoryTab.toLowerCase() || 
        cat.categoryKey === activeCategoryTab
      );
    }

    // Separate user custom topics into active vs inactive
    const activeCustomSubtopics: any[] = [];
    const inactiveCustomSubtopics: any[] = [];

    customTopicNames.forEach((tObj: any) => {
      const topicId = typeof tObj === 'string' ? tObj : (tObj.id || tObj.name);
      const topicLabel = typeof tObj === 'string' ? tObj : (tObj.label || tObj.name);
      const topicIcon = typeof tObj === 'string' ? '💡' : (tObj.icon || '💡');

      const stat = topicStatsMap[topicId] || { count: 0, isTrending: false };
      const item = { id: topicId, label: topicLabel, icon: topicIcon, isUserCreated: true };
      if (stat.count > 0) {
        activeCustomSubtopics.push(item);
      } else {
        inactiveCustomSubtopics.push(item);
      }
    });

    // Add active custom topics to Other & Community
    if (activeCustomSubtopics.length > 0) {
      baseCategories = baseCategories.map(cat => {
        if (cat.name === 'Other & Community') {
          return {
            ...cat,
            subtopics: [...activeCustomSubtopics, ...cat.subtopics]
          };
        }
        return cat;
      });
    }

    // Filter by search query if typed
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      baseCategories = baseCategories.map(cat => {
        const matchCategoryName = cat.name.toLowerCase().includes(q) || t(cat.categoryKey, cat.name).toLowerCase().includes(q);
        const matchingSubtopics = cat.subtopics.filter((st: any) => 
          st.label.toLowerCase().includes(q) || 
          st.id.toLowerCase().includes(q) || 
          t(st.id, st.label).toLowerCase().includes(q)
        );

        if (matchCategoryName) return cat;
        if (matchingSubtopics.length > 0) return { ...cat, subtopics: matchingSubtopics };
        return null;
      }).filter(Boolean) as any;
    }

    // Sort subtopics INSIDE each category (count > 0 first)
    const sortedCategories = baseCategories.map(cat => {
      const sortedSubtopics = [...cat.subtopics].sort((a: any, b: any) => {
        const statA = topicStatsMap[a.id] || { count: 0, lastPostMs: 0, isTrending: false };
        const statB = topicStatsMap[b.id] || { count: 0, lastPostMs: 0, isTrending: false };

        if (statB.count !== statA.count) return statB.count - statA.count;
        if (statB.isTrending !== statA.isTrending) return (statB.isTrending ? 1 : 0) - (statA.isTrending ? 1 : 0);
        return statB.lastPostMs - statA.lastPostMs;
      });
      return { ...cat, subtopics: sortedSubtopics };
    });

    // Sort CATEGORIES so those with activity appear first
    sortedCategories.sort((catA, catB) => {
      const countA = catA.subtopics.reduce((acc, st) => acc + (topicStatsMap[st.id]?.count || 0), 0);
      const countB = catB.subtopics.reduce((acc, st) => acc + (topicStatsMap[st.id]?.count || 0), 0);
      return countB - countA;
    });

    // Inactive custom topics separated at the bottom
    if (inactiveCustomSubtopics.length > 0 && activeCategoryTab === 'All') {
      sortedCategories.push({
        name: 'User Created Topics',
        categoryKey: 'USER_CREATED_CAT',
        iconName: 'UserCheck',
        accent: '#D96C3D',
        isBottomUserCard: true as any,
        subtopics: inactiveCustomSubtopics,
      } as any);
    }

    return sortedCategories;
  }, [activeCategoryTab, searchQuery, customTopicNames, topicStatsMap, t]);

  // Handler for creating custom topic
  const handleAddCustomTopic = () => {
    const cleanTopic = newCustomTopicName.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
    if (!cleanTopic) {
      Alert.alert('Error', 'Topic name cannot be empty.');
      return;
    }

    const existing = customTopicNames.find((tItem: any) => {
      const tName = typeof tItem === 'string' ? tItem : (tItem.name || tItem.id);
      return tName.toUpperCase() === cleanTopic;
    });

    if (existing) {
      Alert.alert('Info', 'This topic already exists.');
      return;
    }

    saveCustomTopic(cleanTopic, selectedEmoji, currentUser?.username || '@anonymous');
    setCustomTopicsTrigger(prev => prev + 1);
    setSelectedTopic(cleanTopic);
    setNewCustomTopicName('');
    setCustomTopicModalVisible(false);
    Alert.alert('Success', `Topic ${selectedEmoji} #${cleanTopic} created!`);
  };

  // Filter and Sort posts
  const filteredAndSortedPosts = useMemo(() => {
    if (isUserMuted) return [];

    // 1. Filtering
    const filtered = posts.filter((p: any) => {
      // Topic Filter
      if (selectedTopic !== 'All') {
        const pTopic = (p.topic || 'General').toUpperCase().replace(/[\s_-]/g, '');
        const sTopic = selectedTopic.toUpperCase().replace(/[\s_-]/g, '');
        if (pTopic !== sTopic) {
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

      {/* 2. Toggle Layout based on selectedTopic */}
      {selectedTopic === 'All' ? (
        // ── TOPIC CATALOG VIEW ──
        <View style={{ flex: 1 }}>
          {/* Hero Banner Card */}
          <View style={localStyles.heroCard}>
            <View style={localStyles.heroBannerPill}>
              <Text style={localStyles.heroBannerPillText}>मनातलं बोला… ओळख सुरक्षित ठेवा.</Text>
            </View>
            <Text style={localStyles.heroTitle}>
              {t('exploreTopicCatalog', 'Discover & Join Topic Channels')}
            </Text>
            <TouchableOpacity
              onPress={() => setCustomTopicModalVisible(true)}
              style={localStyles.heroCreateBtn}
            >
              <Text style={localStyles.heroCreateBtnText}>
                {t('createCustomTopic', '+ Create Topic')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Box inside Catalog view */}
          <View style={localStyles.searchBarContainer}>
            <TextInput
              placeholder={t('searchTopicsCatalogPlaceholder', 'Search topics or subtopics (e.g. Shayari, Love, Cricket)...')}
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

          {/* Category Filtering Tabs */}
          <View style={{ height: 42, marginVertical: 6, paddingHorizontal: 12 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => setActiveCategoryTab('All')}
                style={[
                  localStyles.filterTabButton,
                  { flex: 0, paddingHorizontal: 16 },
                  activeCategoryTab === 'All' && { backgroundColor: COLORS.deepPlum, borderColor: COLORS.deepPlum }
                ]}
              >
                <Text style={[localStyles.filterTabText, activeCategoryTab === 'All' && { color: '#FFF', fontWeight: 'bold' }]}>
                  {t('allTopics', 'All Topics')}
                </Text>
              </TouchableOpacity>
              {TOPIC_CATEGORIES.map(cat => {
                const isSelected = activeCategoryTab === cat.name || activeCategoryTab === cat.categoryKey;
                return (
                  <TouchableOpacity
                    key={cat.name}
                    onPress={() => setActiveCategoryTab(isSelected ? 'All' : cat.name)}
                    style={[
                      localStyles.filterTabButton,
                      { flex: 0, paddingHorizontal: 16 },
                      isSelected && { backgroundColor: COLORS.deepPlum, borderColor: COLORS.deepPlum }
                    ]}
                  >
                    <Text style={[localStyles.filterTabText, isSelected && { color: '#FFF', fontWeight: 'bold' }]}>
                      {translateText(cat.name, currentLanguage)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Catalog Categories scroll list */}
          <ScrollView contentContainerStyle={localStyles.catalogScroll} showsVerticalScrollIndicator={false}>
            {displayedCategories.length === 0 ? (
              <View style={[localStyles.emptyContainer, { backgroundColor: '#FFF', margin: 12, borderRadius: 18, paddingVertical: 40 }]}>
                <Text style={localStyles.emptyText}>
                  {t('noTopicsFoundQuery', 'No topics found matching your search')}
                </Text>
                <TouchableOpacity
                  onPress={() => setCustomTopicModalVisible(true)}
                  style={[localStyles.heroCreateBtn, { marginTop: 14, alignSelf: 'center' }]}
                >
                  <Text style={localStyles.heroCreateBtnText}>
                    + Create Custom Topic #{searchQuery.toUpperCase().replace(/[^A-Z0-9_]/g, '') || 'NEW'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              displayedCategories.map((category: any) => {
                const isBottomUserCard = Boolean(category.isBottomUserCard);
                return (
                  <View
                    key={category.name}
                    style={[
                      localStyles.categoryCard,
                      isBottomUserCard && { borderStyle: 'dashed', borderColor: '#D96C3D' }
                    ]}
                  >
                    {/* Header */}
                    <View style={localStyles.categoryHeader}>
                      <View style={localStyles.categoryTitleRow}>
                        <View style={[localStyles.categoryIconContainer, { backgroundColor: category.accent + '22' }]}>
                          <Text style={{ fontSize: 16, color: category.accent }}>
                            {CATEGORY_EMOJIS[category.iconName] || '💡'}
                          </Text>
                        </View>
                        <Text style={localStyles.categoryTitle}>{translateText(category.name, currentLanguage)}</Text>
                      </View>
                      <View style={[localStyles.categoryCountBadge, { backgroundColor: category.accent + '22' }]}>
                        <Text style={[localStyles.categoryCountText, { color: category.accent }]}>
                          {category.subtopics.length} {t('topics', 'topics')}
                        </Text>
                      </View>
                    </View>

                    {/* Subtopics chips */}
                    <View style={localStyles.subtopicsWrapper}>
                      {category.subtopics.map((subtopic: any) => {
                        const stat = topicStatsMap[subtopic.id] || { count: 0, isTrending: false };
                        const hasInteraction = stat.count > 0;
                        return (
                          <TouchableOpacity
                            key={subtopic.id}
                            onPress={() => setSelectedTopic(subtopic.id)}
                            style={[
                              localStyles.subtopicChip,
                              { borderColor: category.accent + '40' },
                              hasInteraction && { backgroundColor: category.accent + '12', borderColor: category.accent }
                            ]}
                          >
                            <Text style={localStyles.subtopicIcon}>{subtopic.icon || '💡'}</Text>
                            <Text style={localStyles.subtopicText}>{translateText(subtopic.label || subtopic.id, currentLanguage)}</Text>
                            <View
                              style={[
                                localStyles.subtopicCountBadge,
                                { backgroundColor: category.accent + '18' },
                                hasInteraction && { backgroundColor: category.accent }
                              ]}
                            >
                              <Text
                                style={[
                                  localStyles.subtopicCountText,
                                  { color: category.accent },
                                  hasInteraction && { color: '#FFFFFF' }
                                ]}
                              >
                                {stat.count}
                              </Text>
                            </View>
                            {stat.isTrending && (
                              <Text style={localStyles.subtopicTrendingFire}>🔥</Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      ) : (
        // ── CHANNEL FEED VIEW ──
        <View style={{ flex: 1 }}>
          {/* Header Row */}
          <View style={localStyles.channelNavBar}>
            <TouchableOpacity onPress={() => setSelectedTopic('All')} style={localStyles.backToCatalogBtn}>
              <Text style={localStyles.backToCatalogText}>← Back to Home</Text>
            </TouchableOpacity>
          </View>

          {/* Topic Detail Header Banner Card */}
          <View style={[localStyles.topicDetailCard, { backgroundColor: selectedTopicCategoryColor }]}>
            <View style={localStyles.topicDetailLeft}>
              {/* Circle Avatar with Initial */}
              <View style={[localStyles.topicDetailAvatar, { backgroundColor: 'rgba(255, 255, 255, 0.18)' }]}>
                <Text style={localStyles.topicDetailAvatarText}>
                  {(() => {
                    const clean = selectedTopic.replace(/^#/, '');
                    const parts = clean.split(/[\s_-]+/);
                    if (parts.length >= 2 && parts[1]) {
                      return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
                    }
                    return clean.slice(0, 1).toUpperCase() || '#';
                  })()}
                </Text>
              </View>

              <View style={localStyles.topicDetailMeta}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <Text style={localStyles.topicDetailTitle}>#{selectedTopic.toUpperCase()}</Text>
                  <View style={localStyles.trendingBadge}>
                    <Text style={localStyles.trendingBadgeText}>TRENDING TOPIC</Text>
                  </View>
                </View>
                
                {/* Stats Row */}
                <View style={localStyles.topicDetailStatsRow}>
                  <Text style={localStyles.topicDetailStatsText}>
                    🕒 Last post {lastPostTimeStr}
                  </Text>
                  <Text style={localStyles.topicDetailStatsText}>
                    🔥 {filteredAndSortedPosts.length} Thoughts shared
                  </Text>
                </View>
              </View>
            </View>

            {/* "+ Add Your Thought" button */}
            <TouchableOpacity
              onPress={() => {
                setCreateTitle('');
                setCreateContent('');
                setCreateImageUrl('');
                setCreateModalVisible(true);
              }}
              style={localStyles.addThoughtBtn}
            >
              <Text style={localStyles.addThoughtBtnText}>+ Add Your Thought</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Selection Row (Topic Posts) */}
          <View style={localStyles.topicPostsTabBar}>
            <Text style={localStyles.topicPostsTabActive}>Topic Posts ({filteredAndSortedPosts.length})</Text>
          </View>

          {/* Search Box inside Feed view */}
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

          {/* Filter Tabs Bar */}
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

          {/* Feed list */}
          <FlatList
            data={filteredAndSortedPosts}
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
            ListEmptyComponent={
              <View style={localStyles.emptyContainer}>
                <Text style={localStyles.emptyText}>
                  {isUserMuted ? 'Account Restricted. Feed is currently unavailable.' : 'No thoughts found under this channel. Be the first to share a thought!'}
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
        </View>
      )}

      {/* Enhanced Custom Topic Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={customTopicModalVisible}
        onRequestClose={() => setCustomTopicModalVisible(false)}
      >
        <SafeAreaView style={appStyles.centerModalOverlay}>
          <View style={[appStyles.reportModalCard, { width: '90%', maxHeight: '80%' }]}>
            <Text style={appStyles.reportModalTitle}>➕ Create Custom Topic</Text>
            <Text style={appStyles.reportModalSubtitle}>Create a new topic handle for anonymous discussions.</Text>

            {/* Emoji selector preset grid */}
            <Text style={{ fontSize: 12.5, fontWeight: 'bold', color: '#6F405F', marginTop: 12, marginBottom: 8 }}>
              Choose Topic Emoji Logo * ({selectedEmoji})
            </Text>
            <View style={{ height: 110, backgroundColor: '#FAF6F8', borderRadius: 14, borderWidth: 1, borderColor: '#EFEAE8', padding: 8 }}>
              <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }} showsVerticalScrollIndicator={true}>
                {EMOJI_PRESETS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    onPress={() => setSelectedEmoji(emoji)}
                    style={[
                      { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
                      selectedEmoji === emoji && { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#6F405F' }
                    ]}
                  >
                    <Text style={{ fontSize: 18 }}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Topic Channel Name Input */}
            <Text style={{ fontSize: 12.5, fontWeight: 'bold', color: '#6F405F', marginTop: 14, marginBottom: 6 }}>
              Topic Channel Name *
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#6F405F' }}>{selectedEmoji} #</Text>
              <TextInput
                placeholder="e.g. WELLNESS, FINANCE, TRAVEL"
                placeholderTextColor={COLORS.zorba}
                value={newCustomTopicName}
                onChangeText={(val) => setNewCustomTopicName(val.toUpperCase().replace(/\s+/g, '_'))}
                style={[appStyles.input, { flex: 1, textTransform: 'uppercase', fontWeight: 'bold', marginTop: 0 }]}
                maxLength={20}
                autoCapitalize="characters"
              />
            </View>
            <Text style={{ fontSize: 10.5, color: '#8C8385', marginTop: 6, lineHeight: 14 }}>
              User created topics start at the bottom catalog card until they receive posts & activity!
            </Text>

            <View style={[appStyles.reportActionRow, { marginTop: 18 }]}>
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
      {/* Create Anonymous Thought Modal replica of Web */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={createModalVisible}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <SafeAreaView style={localStyles.modalOverlay}>
          <View style={localStyles.createModalCard}>
            
            {/* Modal Header */}
            <View style={localStyles.modalHeaderRow}>
              <Text style={localStyles.modalTitleText}>
                Create Anonymous Thought in #{selectedTopic.toUpperCase()}
              </Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)} style={localStyles.modalCloseBtn}>
                <Text style={localStyles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={true}>
              
              {/* Context Row */}
              <View style={localStyles.contextRow}>
                <View style={[localStyles.contextAvatar, { backgroundColor: '#A58BA0' }]}>
                  <Text style={localStyles.contextAvatarText}>
                    {currentUser?.username?.replace(/^@/, '').slice(0, 1).toLowerCase() || 's'}
                  </Text>
                </View>
                <Text style={localStyles.contextText}>
                  Posting as <Text style={localStyles.contextUsername}>@{currentUser?.username?.replace(/^@/, '') || 'softwindow82'}</Text> under <Text style={localStyles.contextTopic}>#{selectedTopic.toUpperCase()}</Text>
                </Text>
              </View>

              {/* Title input */}
              <TextInput
                placeholder="Title / Summary (optional)..."
                placeholderTextColor={COLORS.zorba}
                value={createTitle}
                onChangeText={setCreateTitle}
                maxLength={120}
                style={localStyles.modalTitleInput}
              />

              {/* Content textarea */}
              <View style={localStyles.textareaContainer}>
                <TextInput
                  placeholder="Share your unspoken thoughts freely..."
                  placeholderTextColor={COLORS.zorba}
                  value={createContent}
                  onChangeText={setCreateContent}
                  multiline
                  numberOfLines={5}
                  maxLength={2500}
                  style={localStyles.modalContentInput}
                />
                
                {/* Embedded Microphone inside TextArea */}
                <TouchableOpacity onPress={startVoiceRecording} style={localStyles.micIconBtn}>
                  <Text style={{ fontSize: 16 }}>🎙️</Text>
                </TouchableOpacity>
              </View>

              {/* Image attachment / Dashed upload button */}
              {uploadingImage ? (
                <View style={localStyles.imageUploadDashedBtn}>
                  <ActivityIndicator size="small" color="#6F405F" />
                  <Text style={{ fontSize: 11, color: '#8C8385', marginTop: 4 }}>Uploading...</Text>
                </View>
              ) : createImageUrl ? (
                <View style={localStyles.attachedImageContainer}>
                  <Image
                    source={{ uri: createImageUrl.startsWith('http') ? createImageUrl : `https://api.awaazmanki.com${createImageUrl}` }}
                    style={localStyles.attachedImage}
                  />
                  <TouchableOpacity onPress={() => setCreateImageUrl('')} style={localStyles.removeAttachedImageBtn}>
                    <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={handlePickImage} style={localStyles.imageUploadDashedBtn}>
                  <Text style={localStyles.imageUploadDashedText}>
                    📤 Attach Image File
                  </Text>
                </TouchableOpacity>
              )}

              {/* Moderation Warning Banner */}
              {createModResult.status !== 'SAFE' && (
                <View style={[
                  localStyles.modalWarningBanner,
                  {
                    backgroundColor: createModResult.status === 'BLOCKED' ? 'rgba(196, 111, 118, 0.12)' : 'rgba(217, 108, 61, 0.12)',
                    borderColor: createModResult.status === 'BLOCKED' ? 'rgba(196, 111, 118, 0.4)' : 'rgba(217, 108, 61, 0.4)'
                  }
                ]}>
                  <Text style={{ fontSize: 16 }}>🛡️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      localStyles.warningBannerTitle,
                      { color: createModResult.status === 'BLOCKED' ? '#C46F76' : '#D96C3D' }
                    ]}>
                      {createModResult.status === 'BLOCKED' ? 'Content Restricted' : 'Revise Sensitive Subject'}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#8C8385', marginTop: 2, lineHeight: 14 }}>
                      {createModResult.message} {createModResult.explanation || ''}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Bottom Actions Row */}
            <View style={localStyles.modalActionsRow}>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)} style={localStyles.cancelBtn}>
                <Text style={localStyles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePublishPost}
                disabled={!createContent.trim() || isCreateBlocked || createSubmitting || uploadingImage}
                style={[
                  localStyles.publishBtn,
                  (!createContent.trim() || isCreateBlocked || createSubmitting || uploadingImage) && { backgroundColor: '#F3EEF1' }
                ]}
              >
                {createSubmitting && <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />}
                <Text style={[
                  localStyles.publishBtnText,
                  (!createContent.trim() || isCreateBlocked || createSubmitting || uploadingImage) && { color: '#A58BA0' }
                ]}>
                  Publish Thought
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </SafeAreaView>
      </Modal>

      {/* Pulsing Voice Recording Modal Overlay */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isRecording}
      >
        <SafeAreaView style={localStyles.micModalOverlay}>
          <View style={[localStyles.createModalCard, { alignItems: 'center', paddingVertical: 32 }]}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.error }}>🎙️ Listening...</Text>
            <Text style={{ textAlign: 'center', marginTop: 8, paddingHorizontal: 12, fontSize: 12, color: '#8C8385' }}>
              Speak now. Converting your voice to anonymous text in real-time.
            </Text>

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
  },
  
  // Topic Catalog Styles
  heroCard: {
    backgroundColor: '#6F405F',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  heroBannerPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 12,
  },
  heroCreateBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#D96C3D',
  },
  heroCreateBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  catalogScroll: {
    paddingBottom: 24,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#F1ECEF',
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2D1D15',
  },
  categoryCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryCountText: {
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  subtopicsWrapper: {
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
  },
  subtopicIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  subtopicText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2D1D15',
  },
  subtopicCountBadge: {
    marginLeft: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  subtopicCountText: {
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  subtopicTrendingFire: {
    fontSize: 9,
    marginLeft: 2,
  },
  backToCatalogBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#FAF6F8',
    borderWidth: 1,
    borderColor: '#EFEAE8',
  },
  backToCatalogText: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#6F405F',
  },
  channelNavBar: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
  },
  topicDetailCard: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  topicDetailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topicDetailAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  topicDetailAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  topicDetailMeta: {
    flexDirection: 'column',
    gap: 2,
  },
  topicDetailTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  trendingBadge: {
    backgroundColor: '#D96C3D',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  trendingBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  topicDetailStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  topicDetailStatsText: {
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
  },
  addThoughtBtn: {
    backgroundColor: '#533246',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addThoughtBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  topicPostsTabBar: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#EDE8E6',
    paddingBottom: 6,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
  },
  topicPostsTabActive: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#6F405F',
    borderBottomWidth: 2.5,
    borderBottomColor: '#6F405F',
    alignSelf: 'flex-start',
    paddingBottom: 6,
    marginBottom: -7.5,
  },
  // Web replica Create modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 29, 21, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  createModalCard: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#2D1D15',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECEB',
    marginBottom: 16,
  },
  modalTitleText: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#2D1D15',
    flex: 1,
    marginRight: 12,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseBtnText: {
    fontSize: 16,
    color: '#8C8385',
    fontWeight: 'bold',
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F8',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#EFEAE8',
    marginBottom: 16,
    gap: 10,
  },
  contextAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextAvatarText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  contextText: {
    fontSize: 12,
    color: '#4A3E3D',
    flex: 1,
  },
  contextUsername: {
    fontWeight: 'bold',
    color: '#6F405F',
  },
  contextTopic: {
    fontWeight: 'bold',
    color: '#D96C3D',
  },
  modalTitleInput: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E1E5',
    backgroundColor: '#FAF8F8',
    height: 48,
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#2D1D15',
    marginBottom: 12,
  },
  textareaContainer: {
    position: 'relative',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E1E5',
    backgroundColor: '#FAF8F8',
    height: 120,
    padding: 12,
    marginBottom: 12,
  },
  modalContentInput: {
    flex: 1,
    textAlignVertical: 'top',
    fontSize: 13,
    color: '#2D1D15',
    padding: 0,
  },
  micIconBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#FAF0F4',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(111, 64, 95, 0.15)',
  },
  imageUploadDashedBtn: {
    height: 90,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#E8E1E5',
    borderRadius: 12,
    backgroundColor: '#FAF8F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    padding: 10,
  },
  imageUploadDashedText: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#6F405F',
  },
  attachedImageContainer: {
    position: 'relative',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E8E1E5',
  },
  attachedImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  removeAttachedImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalWarningBanner: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningBannerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0ECEB',
    paddingTop: 16,
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E1E5',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#8C8385',
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#6F405F',
  },
  publishBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});


// â”€â”€ CREATE POST SCREEN â”€â”€
