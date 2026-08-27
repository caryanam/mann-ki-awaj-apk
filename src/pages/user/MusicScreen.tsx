import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Modal,
  RefreshControl,
  Platform,
  SafeAreaView,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { pick, types, errorCodes, isErrorWithCode } from '@react-native-documents/picker';
import { useLanguage } from '../../context/LanguageContext';
import { useMoodMusic } from '../../context/MoodMusicContext';
import { usePosts } from '../../context/PostContext';
import { useAuth } from '../../context/AuthContext';
import { apiMusicService } from '../../services/apiMusicService';
import { COLORS } from '../../styles/theme';
import { localStorage } from '../../services/localStorage';

// Components & Icons from common and posts
import { InitialAvatar } from '../../components/common/InitialAvatar';
import { StarIcon, ShieldIcon, FlagIcon } from '../../components/common/Icons';
import { CommentItem } from '../../components/posts/CommentItem';
import { CommentComposer } from '../../components/posts/CommentComposer';
import { CreatePostScreen } from './CreatePostScreen';

// High-fidelity web-matching mood artworks
const romanticArtwork = require('../../assets/music/moods/op1.webp');
const sadArtwork = require('../../assets/music/moods/op2.webp');
const energeticArtwork = require('../../assets/music/moods/op3.webp');
const allArtwork = require('../../assets/music/moods/op4.webp');

const ARTWORK: Record<string, any> = {
  romantic: romanticArtwork,
  sad: sadArtwork,
  energetic: energeticArtwork,
  all: allArtwork,
};

const LANGUAGES = ['EN', 'HI', 'BN', 'MR', 'TE', 'TA', 'GU', 'UR', 'KN', 'OR', 'ML', 'PA', 'AS', 'SAT', 'KS', 'MNI', 'DOI', 'BHO'];

const MOOD_OPTIONS = [
  { value: 'ROMANTIC', label: 'Romantic' },
  { value: 'SAD', label: 'Sad' },
  { value: 'CALM', label: 'Calm' },
  { value: 'ENERGETIC', label: 'Energetic' },
  { value: 'CONFUSED', label: 'Confused' },
  { value: 'MELANCHOLY', label: 'Melancholy' },
  { value: 'FOCUS', label: 'Focus' },
];

const LISTENING_MOODS = [
  { id: 'romantic', apiMood: 'ROMANTIC', title: 'Feeling Romantic', description: 'Soft, soulful and full of feeling.', emoji: '💖', color: '#6F405F', textColor: '#FFF' },
  { id: 'sad', apiMood: 'SAD', title: 'A Little Low', description: 'Gentle music for quieter moments.', emoji: '🌧️', color: '#4B6F8A', textColor: '#FFF' },
  { id: 'energetic', apiMood: 'ENERGETIC', title: 'Need Some Energy', description: 'Turn it up and lift the mood.', emoji: '⚡', color: '#D96C3D', textColor: '#FFF' },
  { id: 'all', apiMood: null, title: 'Play Anything', description: 'No choices. Just let the music flow.', emoji: '✨', color: '#2D1D15', textColor: '#FFF' },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PUBLISHED: 'Published',
};

const REACTION_CONFIG = [
  { key: 'relate', emoji: '💖', label: 'Relate' },
  { key: 'wellSaid', emoji: '👏', label: 'Well Said' },
  { key: 'helpful', emoji: '💡', label: 'Helpful' },
  { key: 'stayStrong', emoji: '💪', label: 'Strong' },
  { key: 'madeMeThink', emoji: '🤔', label: 'Think' },
];

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

export function MusicScreen() {
  const { t, currentLanguage, translationCache, translateText } = useLanguage() as any;
  const music = useMoodMusic() as any;
  
  // Post context & Auth context for community feed
  const { posts, reactToPost, addComment, fileReport, refreshPosts, toggleSavePost, loadComments } = usePosts() as any;
  const { currentUser } = useAuth() as any;

  // View state: 'community' | 'browse' | 'mine' (defaults to 'community' like web app)
  const [viewTab, setViewTab] = useState<'community' | 'browse' | 'mine'>('community');

  // Community modals & states
  const [createPostModalVisible, setCreatePostModalVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [activeReportPost, setActiveReportPost] = useState<any>(null);
  const [reportReason, setReportReason] = useState('Spam');
  const [reportNotes, setReportNotes] = useState('');

  // Browse Tab filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [genreQuery, setGenreQuery] = useState('');
  const [publicTracks, setPublicTracks] = useState<any[]>([]);
  const [featuredTracks, setFeaturedTracks] = useState<any[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(false);
  const [fallbackUsed, setFallbackUsed] = useState(false);

  // Listening Mood selector states
  const [listeningMood, setListeningMood] = useState<string | null>(null);
  const [moodModalVisible, setMoodModalVisible] = useState(false);
  const [moodSelectionRequired, setMoodSelectionRequired] = useState(false);

  // My Uploads Tab states
  const [myTracks, setMyTracks] = useState<any[]>([]);
  const [loadingMyTracks, setLoadingMyTracks] = useState(false);
  const [myStatusFilter, setMyStatusFilter] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Upload/Edit Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'upload' | 'edit'>('upload');
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);

  // Form states (moods array matches web format)
  const [formTitle, setFormTitle] = useState('');
  const [formArtist, setFormArtist] = useState('');
  const [formLanguage, setFormLanguage] = useState('HI');
  const [formMoods, setFormMoods] = useState<string[]>(['CALM']);
  const [formGenre, setFormGenre] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCover, setFormCover] = useState<any>(null);
  const [formAudio, setFormAudio] = useState<any>(null);
  const [formOriginalWork, setFormOriginalWork] = useState(false);
  const [formRightsConfirmed, setFormRightsConfirmed] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);

  // Load listening mood on startup or prompt selection if not chosen
  useEffect(() => {
    const saved = localStorage.getItem('mka.music.listeningMood');
    if (!saved) {
      setMoodModalVisible(true);
      setMoodSelectionRequired(true);
    } else {
      setListeningMood(saved === 'ALL' ? null : saved);
    }
  }, []);

  const saveListeningMood = (mood: string | null) => {
    setListeningMood(mood);
    localStorage.setItem('mka.music.listeningMood', mood || 'ALL');
    setMoodModalVisible(false);
    setMoodSelectionRequired(false);
  };

  // Fetch Public Music (Browse Tab) with fallback
  const fetchPublicMusic = async (isSilent = false) => {
    if (!isSilent) setLoadingPublic(true);
    setErrorText(null);
    setFallbackUsed(false);
    try {
      const filters: any = {
        query: searchQuery.trim(),
        language: selectedLanguage,
        genre: genreQuery.trim(),
        page: 0,
        size: 30,
      };

      if (listeningMood) {
        filters.mood = listeningMood;
      }

      let res = await apiMusicService.getPublicTracks(filters);
      let tracksList = res?.content || [];

      // Fallback to full catalog if no tracks match this mood
      if (listeningMood && tracksList.length === 0) {
        const fallbackFilters = { ...filters };
        delete fallbackFilters.mood;
        const fallbackRes = await apiMusicService.getPublicTracks(fallbackFilters);
        tracksList = fallbackRes?.content || [];
        setFallbackUsed(true);
      }
      setPublicTracks(tracksList);

      // Load Featured
      const featFilters: any = { featured: true, page: 0, size: 8 };
      if (listeningMood) {
        featFilters.mood = listeningMood;
      }
      let featRes = await apiMusicService.getPublicTracks(featFilters);
      let featList = featRes?.content || [];
      if (listeningMood && featList.length === 0) {
        delete featFilters.mood;
        const fallbackFeatRes = await apiMusicService.getPublicTracks(featFilters);
        featList = fallbackFeatRes?.content || [];
      }
      setFeaturedTracks(featList);

    } catch (e: any) {
      console.warn('[MusicScreen] Fetch public failed:', e.message);
      setErrorText(e.message || 'Failed to load music');
    } finally {
      if (!isSilent) setLoadingPublic(false);
    }
  };

  // Fetch My Music
  const fetchMyMusic = async (isSilent = false) => {
    if (!isSilent) setLoadingMyTracks(true);
    setErrorText(null);
    try {
      const res = await apiMusicService.getMyTracks({
        status: myStatusFilter,
        page: 0,
        size: 30,
      });
      setMyTracks(res?.content || []);
    } catch (e: any) {
      console.warn('[MusicScreen] Fetch my tracks failed:', e.message);
      setErrorText(e.message || 'Failed to load uploads');
    } finally {
      if (!isSilent) setLoadingMyTracks(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (viewTab === 'community') {
      await refreshPosts();
    } else if (viewTab === 'browse') {
      await fetchPublicMusic(true);
    } else {
      await fetchMyMusic(true);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    if (viewTab === 'community') {
      refreshPosts();
    } else if (viewTab === 'browse') {
      fetchPublicMusic();
    } else {
      fetchMyMusic();
    }
  }, [viewTab, searchQuery, selectedLanguage, listeningMood, genreQuery, myStatusFilter]);

  // Image Picker for Cover Art
  const handleSelectCover = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (res) => {
      if (res.didCancel) return;
      if (res.assets && res.assets[0]) {
        const file = res.assets[0];
        if (file.fileSize && file.fileSize > 5 * 1024 * 1024) {
          Alert.alert('Cover Too Large', 'Please select a cover image under 5MB.');
          return;
        }
        setFormCover({
          uri: Platform.OS === 'android' ? file.uri : (file.uri ? file.uri.replace('file://', '') : ''),
          name: file.fileName || 'cover.jpg',
          type: file.type || 'image/jpeg',
        });
      }
    });
  };

  // Select Real Audio file
  const handleSelectAudio = async () => {
    try {
      const [res] = await pick({
        type: [types.audio],
        allowMultiSelection: false,
      });
      if (res) {
        if (res.size && res.size > 40 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please select an audio file under 40MB.');
          return;
        }
        setFormAudio({
          uri: Platform.OS === 'android' ? res.uri : (res.uri ? res.uri.replace('file://', '') : ''),
          name: res.name || 'track.mp3',
          type: res.type || 'audio/mpeg',
        });
      }
    } catch (err) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
        // User cancelled
      } else {
        Alert.alert('Error', 'Failed to pick audio file: ' + err);
      }
    }
  };

  // Upload/Edit Track Submit
  const handleSaveTrack = async () => {
    if (!formTitle.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    if (!formArtist.trim()) {
      Alert.alert('Error', 'Artist name is required');
      return;
    }
    if (formMoods.length === 0) {
      Alert.alert('Error', 'Please select at least one mood');
      return;
    }
    if (modalMode === 'upload') {
      if (!formAudio) {
        Alert.alert('Audio Required', 'Please select an audio file to upload.');
        return;
      }
      if (!formOriginalWork || !formRightsConfirmed) {
        Alert.alert('Declaration Required', 'You must accept the rights and ownership declarations.');
        return;
      }
    }

    setSubmittingForm(true);
    try {
      if (modalMode === 'upload') {
        const formData = new FormData();
        formData.append('title', formTitle.trim());
        formData.append('artistName', formArtist.trim());
        formData.append('language', formLanguage);
        
        // Append all selected moods matching web backend format
        formMoods.forEach(mood => {
          formData.append('moods', mood);
        });

        formData.append('genre', formGenre.trim());
        formData.append('description', formDescription.trim());
        formData.append('originalWorkConfirmed', formOriginalWork.toString());
        formData.append('rightsConfirmed', formRightsConfirmed.toString());

        if (formCover) {
          formData.append('cover', formCover);
        }
        formData.append('audio', formAudio);

        await apiMusicService.uploadMyTrack(formData);
        Alert.alert('Success', 'Track uploaded successfully for review.');
      } else {
        // Edit mode
        await apiMusicService.updateMyTrack(editingTrackId!, {
          title: formTitle.trim(),
          artistName: formArtist.trim(),
          language: formLanguage,
          moods: formMoods,
          genre: formGenre.trim(),
          description: formDescription.trim(),
        });
        Alert.alert('Success', 'Track details updated.');
      }
      setModalVisible(false);
      fetchMyMusic();
    } catch (e: any) {
      if (e.message && e.message.includes('413')) {
        Alert.alert('Upload Failed', 'The selected file is too large for the server. Audio must be under 40MB and cover must be under 5MB.');
      } else {
        Alert.alert('Request Failed', e.message || 'Error processing track');
      }
    } finally {
      setSubmittingForm(false);
    }
  };

  // Delete Upload
  const handleDeleteTrack = (id: string, title: string) => {
    Alert.alert('Delete Track', `Are you sure you want to delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiMusicService.deleteMyTrack(id);
            fetchMyMusic();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  // Open Edit Modal
  const openEditModal = (track: any) => {
    setModalMode('edit');
    setEditingTrackId(track.id);
    setFormTitle(track.title);
    setFormArtist(track.artist || track.artistName || '');
    setFormLanguage(track.language || 'HI');

    // Decode track moods list or fallback
    if (track.moods && Array.isArray(track.moods)) {
      setFormMoods(track.moods);
    } else if (track.mood) {
      setFormMoods([track.mood]);
    } else {
      setFormMoods(['CALM']);
    }

    setFormGenre(track.genre || '');
    setFormDescription(track.description || '');
    setFormCover(null);
    setFormAudio(null);
    setModalVisible(true);
  };

  // Open Upload Modal
  const openUploadModal = () => {
    setModalMode('upload');
    setEditingTrackId(null);
    setFormTitle('');
    setFormArtist('');
    setFormLanguage('HI');
    setFormMoods(['CALM']);
    setFormGenre('');
    setFormDescription('');
    setFormCover(null);
    setFormAudio(null);
    setFormOriginalWork(false);
    setFormRightsConfirmed(false);
    setModalVisible(true);
  };

  const handleFileReportSubmit = () => {
    if (!activeReportPost) return;
    fileReport(
      activeReportPost.id,
      'POST',
      activeReportPost.content || activeReportPost.title,
      activeReportPost.username,
      reportReason,
      reportNotes.trim(),
      currentUser?.username || '@anonymous'
    );
    setReportNotes('');
    setReportModalVisible(false);
    setActiveReportPost(null);
    Alert.alert('Thank You', 'Content has been flagged for admin moderation.');
  };

  const defaultCover = require('../../assets/music-cover.jpg');

  const getAuthorizedCover = (item: any) => {
    const rawUrl = item.coverUrl || item.privateCoverUrl || item.publicCoverUrl;
    if (!rawUrl) return defaultCover;
    if (typeof rawUrl === 'number') return rawUrl;
    if (rawUrl.startsWith('http') && !rawUrl.includes('/api/')) {
      return { uri: rawUrl };
    }
    const token = localStorage.getItem('auth_token');
    if (token && (rawUrl.includes('/api/admin/') || rawUrl.includes('/api/music/') || rawUrl.includes('/api/'))) {
      const separator = rawUrl.includes('?') ? '&' : '?';
      return { uri: `${rawUrl}${separator}token=${token}&access_token=${token}` };
    }
    return { uri: rawUrl };
  };

  // Find the selected Listening Mood option for header banner
  const selectedListeningMoodOpt = LISTENING_MOODS.find(m => m.apiMood === listeningMood) || LISTENING_MOODS[LISTENING_MOODS.length - 1];
  
  // Find current post reference updates in comment modal
  const activePostForModal = posts.find((p: any) => p.id === selectedPost?.id) || selectedPost;

  return (
    <View style={styles.container}>
      {/* Header & Tabs */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Music Hub</Text>
          <Text style={styles.headerSubtitle}>Discover and share original audio</Text>
        </View>
        <View style={styles.tabRow}>
          <TouchableOpacity
            onPress={() => setViewTab('community')}
            style={[styles.tabButton, viewTab === 'community' && styles.activeTabButton]}
          >
            <Text style={[styles.tabButtonText, viewTab === 'community' && styles.activeTabButtonText]}>Community</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewTab('browse')}
            style={[styles.tabButton, viewTab === 'browse' && styles.activeTabButton]}
          >
            <Text style={[styles.tabButtonText, viewTab === 'browse' && styles.activeTabButtonText]}>Browse</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewTab('mine')}
            style={[styles.tabButton, viewTab === 'mine' && styles.activeTabButton]}
          >
            <Text style={[styles.tabButtonText, viewTab === 'mine' && styles.activeTabButtonText]}>My Uploads</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* COMMUNITY FEED TAB CONTENT - STYLED SAME LIKE EXPLORE CARDS */}
      {viewTab === 'community' && (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.deepPlum]} />
          }
          ListHeaderComponent={
            <View style={{ gap: 12, padding: 12 }}>
              <TouchableOpacity onPress={() => setCreatePostModalVisible(true)} style={styles.uploadButton}>
                <Text style={styles.uploadButtonText}>+ Share Voice or Thought</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const displayTitle = translateText ? translateText(item.originalTitle || item.title, currentLanguage) : (item.originalTitle || item.title);
            const displayContent = translateText ? translateText(item.originalContent || item.content, currentLanguage) : (item.originalContent || item.content);
            const isSaved = item.isSaved;

            return (
              <View style={styles.exploreCardContainer}>
                {/* CARD HEADER: AUTHOR & ACTIONS */}
                <View style={styles.cardHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <InitialAvatar
                      initials={item.avatarInitials}
                      color={item.avatarColor || '#6F405F'}
                      size={42}
                    />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 14.5, fontWeight: '800', color: '#2D1D15' }}>
                          {item.username}
                        </Text>
                        {item.verified && (
                          <ShieldIcon color="#10B981" size={13} />
                        )}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 }}>
                        {item.topic && (
                          <View style={styles.topicBadgeContainer}>
                            <Text style={styles.topicBadgeText}>
                              #{item.topic}
                            </Text>
                          </View>
                        )}
                        <Text style={{ fontSize: 11, color: '#8C8385' }}>
                          {formatTimeAgo(item.createdAt) || item.postType || 'Thought'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Card Bookmark / Report actions */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => toggleSavePost(item.id)}
                      style={[styles.actionIconPill, isSaved && styles.activeBookmarkPill]}
                    >
                      <StarIcon color={isSaved ? '#D97706' : '#8C8385'} size={15} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => {
                        setActiveReportPost(item);
                        setReportModalVisible(true);
                      }}
                      style={styles.actionIconPill}
                    >
                      <FlagIcon color="#C46F76" size={15} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* CARD BODY: TITLE & CONTENT */}
                {displayTitle ? (
                  <Text style={styles.cardTitleText}>
                    {displayTitle}
                  </Text>
                ) : null}

                <Text style={styles.cardContentText}>
                  {displayContent}
                </Text>

                {/* Attached Image Preview if any */}
                {item.imageUrl && (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.cardAttachedImage}
                    resizeMode="cover"
                  />
                )}

                {/* CARD FOOTER ACTIONS: REACTIONS & COMMENTS */}
                <View style={styles.cardFooterDivider}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {REACTION_CONFIG.map(({ key, emoji }) => {
                      const count = Number(item.reactions?.[key] || 0);
                      const isUserReacted = item.userReaction === key;

                      return (
                        <TouchableOpacity
                          key={key}
                          activeOpacity={0.7}
                          onPress={() => reactToPost(item.id, key)}
                          style={[styles.reactionBadgeButton, isUserReacted && styles.activeReactionBadgeButton]}
                        >
                          <Text style={{ fontSize: 12 }}>{emoji}</Text>
                          {count > 0 && (
                            <Text style={[styles.reactionBadgeText, isUserReacted && styles.activeReactionBadgeText]}>
                              {count}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}

                    {/* Comments Trigger Pill */}
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={async () => {
                        setSelectedPost(item);
                        setCommentModalVisible(true);
                        const comments = await loadComments(item.id);
                        setSelectedPost((prev: any) => (prev ? { ...prev, comments } : null));
                      }}
                      style={styles.commentsTriggerButton}
                    >
                      <Text style={{ fontSize: 12 }}>💬</Text>
                      <Text style={styles.commentsCountText}>
                        {item.comments?.length || item.commentCount || 0} Comments
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <Text style={{ color: '#8C8385', textAlign: 'center', paddingHorizontal: 20 }}>
                No community posts yet. Share your voice above!
              </Text>
            </View>
          }
        />
      )}

      {/* BROWSE TAB CONTENT */}
      {viewTab === 'browse' && (
        <FlatList
          data={publicTracks}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.deepPlum]} />
          }
          ListHeaderComponent={
            <View style={{ gap: 16, padding: 12 }}>
              
              {/* Web Spec Listening Mood Banner */}
              <View style={styles.listeningMoodBanner}>
                <View style={styles.listeningMoodTextContainer}>
                  <Text style={styles.listeningMoodSubtitle}>Current Listening Mood</Text>
                  <Text style={styles.listeningMoodTitle}>{selectedListeningMoodOpt.emoji} {selectedListeningMoodOpt.title}</Text>
                  <Text style={styles.listeningMoodDesc}>{selectedListeningMoodOpt.description}</Text>
                </View>
                <TouchableOpacity style={styles.changeMoodBtn} onPress={() => setMoodModalVisible(true)}>
                  <Text style={styles.changeMoodBtnText}>Change Mood</Text>
                </TouchableOpacity>
              </View>

              {fallbackUsed && (
                <View style={styles.fallbackBanner}>
                  <Text style={styles.fallbackText}>
                    ⚠️ We don't have tracks for this mood yet, so we're playing from the full collection.
                  </Text>
                </View>
              )}

              {/* Filters Toolbar */}
              <View style={styles.filterCard}>
                <TextInput
                  placeholder="🔍 Search title or artist..."
                  placeholderTextColor="#8C8385"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchInput}
                />

                {/* Language Picker badges */}
                <Text style={styles.filterLabel}>Language</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  <TouchableOpacity
                    onPress={() => setSelectedLanguage('')}
                    style={[styles.filterBadge, !selectedLanguage && styles.activeFilterBadge]}
                  >
                    <Text style={[styles.filterBadgeText, !selectedLanguage && styles.activeFilterBadgeText]}>All</Text>
                  </TouchableOpacity>
                  {LANGUAGES.map((lang) => (
                    <TouchableOpacity
                      key={lang}
                      onPress={() => setSelectedLanguage(lang)}
                      style={[styles.filterBadge, selectedLanguage === lang && styles.activeFilterBadge]}
                    >
                      <Text style={[styles.filterBadgeText, selectedLanguage === lang && styles.activeFilterBadgeText]}>{lang}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Genre Field */}
                <Text style={styles.filterLabel}>Genre</Text>
                <TextInput
                  placeholder="e.g. Sitar, Folk, Lo-Fi"
                  placeholderTextColor="#8C8385"
                  value={genreQuery}
                  onChangeText={setGenreQuery}
                  style={styles.searchInput}
                />
              </View>

              {/* Featured Section */}
              {featuredTracks.length > 0 ? (
                <View>
                  <Text style={styles.sectionTitle}>Featured for this moment</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 8 }}>
                    {featuredTracks.map((item) => {
                      const isActive = music.currentTrack?.id === item.id;
                      const isPlaying = isActive && music.isPlaying;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          onPress={() => isActive ? music.togglePlay() : music.playTrack(item, featuredTracks)}
                          style={styles.featuredCard}
                        >
                          <Image source={item.coverUrl ? (typeof item.coverUrl === 'number' ? item.coverUrl : { uri: item.coverUrl }) : defaultCover} style={styles.featuredCover} />
                          <View style={styles.featuredPlayOverlay}>
                            <Text style={styles.playOverlayText}>{isPlaying ? '⏸' : '▶'}</Text>
                          </View>
                          <Text style={styles.featuredTitle} numberOfLines={1}>{item.title}</Text>
                          <Text style={styles.featuredArtist} numberOfLines={1}>{item.artist || 'MKA User'}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}

              <Text style={styles.sectionTitle}>Your music</Text>
              {loadingPublic && <ActivityIndicator size="large" color={COLORS.deepPlum} />}
            </View>
          }
          renderItem={({ item }) => {
            const isActive = music.currentTrack?.id === item.id;
            const isPlaying = isActive && music.isPlaying;
            return (
              <View style={styles.trackRow}>
                <Image source={getAuthorizedCover(item)} style={styles.coverArt} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.trackTitle}>{item.title}</Text>
                  <Text style={styles.trackArtist}>{item.artist || 'Unknown artist'}</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                    {item.language ? <Text style={styles.genreBadge}>{item.language}</Text> : null}
                    {Array.isArray(item.moods) ? item.moods.map((m: string) => (
                      <Text key={m} style={styles.genreBadge}>{m}</Text>
                    )) : (item.mood ? <Text style={styles.genreBadge}>{item.mood}</Text> : null)}
                    {item.genre ? <Text style={styles.genreBadge}>{item.genre}</Text> : null}
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => isActive ? music.togglePlay() : music.playTrack(item, publicTracks)}
                  style={styles.playButton}
                >
                  <Text style={styles.playButtonText}>{isPlaying ? '⏸' : '▶'}</Text>
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            !loadingPublic ? (
              <View style={styles.emptyView}>
                <Text style={{ color: '#8C8385', textAlign: 'center', paddingHorizontal: 20 }}>
                  {errorText ? `Error: ${errorText}` : 'No tracks match your search or filters.'}
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* MY UPLOADS TAB CONTENT */}
      {viewTab === 'mine' && (
        <FlatList
          data={myTracks}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.deepPlum]} />
          }
          ListHeaderComponent={
            <View style={{ gap: 12, padding: 12 }}>
              <TouchableOpacity onPress={openUploadModal} style={styles.uploadButton}>
                <Text style={styles.uploadButtonText}>+ Upload Your Original Track</Text>
              </TouchableOpacity>

              {/* Status Filters */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#8C8385' }}>Filter:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  <TouchableOpacity
                    onPress={() => setMyStatusFilter('')}
                    style={[styles.filterBadge, !myStatusFilter && styles.activeFilterBadge]}
                  >
                    <Text style={[styles.filterBadgeText, !myStatusFilter && styles.activeFilterBadgeText]}>All Status</Text>
                  </TouchableOpacity>
                  {Object.entries(STATUS_LABELS).map(([val, lbl]) => (
                    <TouchableOpacity
                      key={val}
                      onPress={() => setMyStatusFilter(val)}
                      style={[styles.filterBadge, myStatusFilter === val && styles.activeFilterBadge]}
                    >
                      <Text style={[styles.filterBadgeText, myStatusFilter === val && styles.activeFilterBadgeText]}>{lbl}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {loadingMyTracks && <ActivityIndicator size="large" color={COLORS.deepPlum} />}
            </View>
          }
          renderItem={({ item }) => {
            const isPublished = item.status === 'PUBLISHED';
            const isActive = music.currentTrack?.id === item.id;
            const isPlaying = isActive && music.isPlaying;

            return (
              <View style={styles.myTrackCard}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Image source={getAuthorizedCover(item)} style={styles.coverArt} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trackTitle}>{item.title}</Text>
                    <Text style={styles.trackArtist}>{item.artist || 'Your Track'}</Text>

                    {/* Status Pill */}
                    <View style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                      <Text style={[
                        styles.statusPill,
                        item.status === 'PUBLISHED' && { backgroundColor: '#E2F0D9', color: '#385723' },
                        item.status === 'PENDING_REVIEW' && { backgroundColor: '#FFF2CC', color: '#7F6000' },
                        item.status === 'REJECTED' && { backgroundColor: '#FCE4D6', color: '#C00000' }
                      ]}>
                        {STATUS_LABELS[item.status] || item.status}
                      </Text>
                    </View>

                    {item.rejectionReason ? (
                      <Text style={styles.rejectionText}>Reason: {item.rejectionReason}</Text>
                    ) : null}
                  </View>
                </View>

                {/* Operations buttons */}
                <View style={styles.opsRow}>
                  {isPublished ? (
                    <TouchableOpacity
                      onPress={() => isActive ? music.togglePlay() : music.playTrack({ ...item, audioUrl: item.publicAudioUrl, coverUrl: item.publicCoverUrl }, myTracks.filter(x => x.status === 'PUBLISHED').map(x => ({ ...x, audioUrl: x.publicAudioUrl, coverUrl: x.publicCoverUrl })))}
                      style={[styles.opBtn, { backgroundColor: '#6F405F' }]}
                    >
                      <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>{isPlaying ? '⏸ Pause' : '▶ Play'}</Text>
                    </TouchableOpacity>
                  ) : null}

                  {item.status === 'PENDING_REVIEW' ? (
                    <TouchableOpacity onPress={() => openEditModal(item)} style={styles.opBtn}>
                      <Text style={styles.opBtnText}>✏️ Edit</Text>
                    </TouchableOpacity>
                  ) : null}

                  {['PENDING_REVIEW', 'REJECTED'].includes(item.status) ? (
                    <TouchableOpacity onPress={() => handleDeleteTrack(item.id, item.title)} style={styles.opBtn}>
                      <Text style={[styles.opBtnText, { color: '#D9534F' }]}>🗑️ Delete</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            !loadingMyTracks ? (
              <View style={styles.emptyView}>
                <Text style={{ color: '#8C8385', textAlign: 'center', paddingHorizontal: 20 }}>
                  {errorText ? `Error: ${errorText}` : 'No uploads found. Share your voice today!'}
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* WEB SPEC LISTENING MOOD SELECTOR MODAL - HIGH FIDELITY WITH ARTWORK BACKGROUNDS */}
      {moodModalVisible && (
        <Modal visible={moodModalVisible} animationType="slide" transparent>
          <View style={styles.moodBackdrop}>
            <View style={styles.moodDialog}>
              <View style={styles.moodHeader}>
                <Text style={styles.moodSubtitle}>Your music, your moment</Text>
                <Text style={styles.moodTitle}>How are you feeling today?</Text>
                <Text style={styles.moodDesc}>Pick a mood. We'll handle the music.</Text>
                {!moodSelectionRequired && (
                  <TouchableOpacity style={styles.moodCloseBtn} onPress={() => setMoodModalVisible(false)}>
                    <Text style={{ fontSize: 18, color: '#8C8385', fontWeight: 'bold' }}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <ScrollView contentContainerStyle={{ paddingVertical: 10 }} style={{ maxHeight: 440 }}>
                {LISTENING_MOODS.map((opt) => {
                  const isSelected = listeningMood === opt.apiMood;
                  const artworkSrc = ARTWORK[opt.id];
                  
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      activeOpacity={0.85}
                      style={[
                        styles.moodCard, 
                        isSelected && { borderWidth: 3, borderColor: '#FFFFFF', elevation: 6 }
                      ]}
                      onPress={() => saveListeningMood(opt.apiMood)}
                    >
                      {/* Background image stretched to cover card */}
                      <Image 
                        source={artworkSrc} 
                        style={StyleSheet.absoluteFillObject} 
                        resizeMode="cover"
                      />
                      
                      {/* Dark plum overlay for legibility */}
                      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(30, 16, 29, 0.48)' }]} />
                      
                      {/* Card Content */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                        <View style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: 'rgba(255, 255, 255, 0.22)',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 14,
                        }}>
                          <Text style={{ fontSize: 18 }}>{opt.emoji}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }}>{opt.title}</Text>
                          <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 10.5, marginTop: 2 }}>{opt.description}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              
              {moodSelectionRequired && (
                <Text style={{ fontSize: 11, color: '#6F405F', fontWeight: '700', textAlign: 'center', marginTop: 12 }}>
                  🎵 Choose one option to continue to your music.
                </Text>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* CREATE COMMUNITY POST MODAL */}
      {createPostModalVisible && (
        <Modal visible={createPostModalVisible} animationType="slide">
          <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <View style={styles.createPostModalHeader}>
              <Text style={styles.createPostModalTitle}>New Community Post</Text>
              <TouchableOpacity onPress={() => setCreatePostModalVisible(false)} style={styles.closeBtn}>
                <Text style={{ fontSize: 18, color: '#8C8385', fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <CreatePostScreen
                onPostCreated={() => {
                  setCreatePostModalVisible(false);
                  refreshPosts();
                }}
                initialTopic="MUSIC"
              />
            </View>
          </SafeAreaView>
        </Modal>
      )}

      {/* POST COMMENTS MODAL */}
      {commentModalVisible && selectedPost && (
        <Modal
          visible={commentModalVisible}
          animationType="slide"
          onRequestClose={() => setCommentModalVisible(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F5F4' }}>
            <View style={styles.commentsModalHeader}>
              <Text style={styles.commentsModalTitle}>Comments ({activePostForModal.comments?.length || 0})</Text>
              <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#8C8385' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalPostBrief}>
              <Text style={{ fontWeight: '800', color: '#2D1D15', fontSize: 12 }}>@{activePostForModal.username}</Text>
              <Text style={{ color: '#8C8385', marginTop: 2, fontSize: 12 }} numberOfLines={2}>{activePostForModal.content || activePostForModal.title}</Text>
            </View>

            <FlatList
              data={activePostForModal.comments}
              keyExtractor={(c) => c.id}
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item: c }) => (
                <CommentItem
                  comment={c}
                  postId={activePostForModal.id}
                  currentUser={currentUser}
                  postAuthorUsername={activePostForModal.username}
                  onNavigateToChat={() => {
                    setCommentModalVisible(false);
                  }}
                />
              )}
            />

            <CommentComposer
              postId={activePostForModal.id}
              onSubmit={async (text) => {
                await addComment(activePostForModal.id, text, currentUser);
                refreshPosts();
              }}
              placeholder="Share a thoughtful reply..."
              currentUser={currentUser}
            />
          </SafeAreaView>
        </Modal>
      )}

      {/* REPORT POST MODAL */}
      {reportModalVisible && (
        <Modal
          visible={reportModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setReportModalVisible(false)}
        >
          <View style={styles.reportOverlay}>
            <View style={styles.reportCard}>
              <Text style={styles.reportTitle}>Report Inappropriate Content</Text>
              
              <Text style={styles.reportLabel}>Reason</Text>
              {['Spam / Repetitive', 'Harassment', 'Hate Speech', 'Self-Harm'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.reportOption, reportReason === r && styles.activeReportOption]}
                  onPress={() => setReportReason(r)}
                >
                  <Text style={[styles.reportOptionText, reportReason === r && styles.activeReportOptionText]}>{r}</Text>
                </TouchableOpacity>
              ))}

              <TextInput
                placeholder="Additional notes (optional)..."
                placeholderTextColor="#8C8385"
                value={reportNotes}
                onChangeText={setReportNotes}
                style={styles.reportInput}
                multiline
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() => setReportModalVisible(false)}
                  style={[styles.reportBtn, { backgroundColor: '#F8F5F4' }]}
                >
                  <Text style={{ color: '#2D1D15', fontWeight: 'bold' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleFileReportSubmit}
                  style={[styles.reportBtn, { backgroundColor: '#C46F76' }]}
                >
                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Submit Report</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* UPLOAD/EDIT MODAL FORM */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalMode === 'upload' ? 'Upload New Track' : 'Edit Track details'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#8C8385' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Title *</Text>
                <TextInput
                  value={formTitle}
                  onChangeText={setFormTitle}
                  placeholder="Track Title"
                  style={styles.formInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Artist Name *</Text>
                <TextInput
                  value={formArtist}
                  onChangeText={setFormArtist}
                  placeholder="Artist name"
                  style={styles.formInput}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Language *</Text>
                  <View style={styles.badgePickerContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {LANGUAGES.map((lang) => (
                        <TouchableOpacity
                          key={lang}
                          onPress={() => setFormLanguage(lang)}
                          style={[styles.pickerBadge, formLanguage === lang && styles.activePickerBadge]}
                        >
                          <Text style={[styles.pickerBadgeText, formLanguage === lang && styles.activePickerBadgeText]}>{lang}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                {/* Multiple Moods Selector Badge Picker (Allows up to 3) */}
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Moods * (Choose 1-3)</Text>
                  <View style={styles.badgePickerContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {MOOD_OPTIONS.map((opt) => {
                        const isSelected = formMoods.includes(opt.value);
                        return (
                          <TouchableOpacity
                            key={opt.value}
                            onPress={() => {
                              if (isSelected) {
                                setFormMoods(formMoods.filter(m => m !== opt.value));
                              } else {
                                if (formMoods.length < 3) {
                                  setFormMoods([...formMoods, opt.value]);
                                } else {
                                  Alert.alert('Limit Reached', 'You can select up to 3 moods.');
                                }
                              }
                            }}
                            style={[styles.pickerBadge, isSelected && styles.activePickerBadge]}
                          >
                            <Text style={[styles.pickerBadgeText, isSelected && styles.activePickerBadgeText]}>{opt.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Genre</Text>
                <TextInput
                  value={formGenre}
                  onChangeText={setFormGenre}
                  placeholder="e.g. Folk, Lo-Fi, Sitar"
                  style={styles.formInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  value={formDescription}
                  onChangeText={setFormDescription}
                  placeholder="Details about the track"
                  multiline
                  numberOfLines={3}
                  style={[styles.formInput, { height: 60, textAlignVertical: 'top' }]}
                />
              </View>

              {modalMode === 'upload' ? (
                <>
                  {/* File Pickers */}
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={handleSelectCover} style={styles.filePickerBtn}>
                      <Text style={styles.filePickerBtnText}>
                        {formCover ? '🖼️ Cover Selected' : '🖼️ Pick Cover'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSelectAudio} style={styles.filePickerBtn}>
                      <Text style={styles.filePickerBtnText}>
                        {formAudio ? '🎵 Audio Attached' : '🎵 Select Audio *'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Declaration Checklist */}
                  <View style={{ gap: 6, marginVertical: 6 }}>
                    <TouchableOpacity onPress={() => setFormOriginalWork(!formOriginalWork)} style={styles.checkRow}>
                      <Text style={{ fontSize: 16 }}>{formOriginalWork ? '☑️' : '⬛'}</Text>
                      <Text style={styles.checkText}>I confirm I created this track or have permission.</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setFormRightsConfirmed(!formRightsConfirmed)} style={styles.checkRow}>
                      <Text style={{ fontSize: 16 }}>{formRightsConfirmed ? '☑️' : '⬛'}</Text>
                      <Text style={styles.checkText}>I understand unauthorized copyrighted files will be removed.</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : null}

              {submittingForm ? (
                <ActivityIndicator size="small" color={COLORS.deepPlum} />
              ) : (
                <TouchableOpacity onPress={handleSaveTrack} style={styles.submitBtn}>
                  <Text style={styles.submitBtnText}>
                    {modalMode === 'upload' ? 'Upload for Review' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5F4',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3ECEB',
    gap: 10,
    elevation: 2,
    shadowColor: '#2D1D15',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2D1D15',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8C8385',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#FAF5F7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0ECE9',
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTabButton: {
    backgroundColor: '#6F405F',
    elevation: 3,
    shadowColor: '#6F405F',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8C8385',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
  },

  filterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(111, 64, 95, 0.1)',
    padding: 10,
    gap: 6,
  },
  searchInput: {
    backgroundColor: '#F8F5F4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
    color: '#2D1D15',
    fontWeight: '600',
  },
  filterLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8C8385',
    marginTop: 4,
  },
  filterBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E1DCDB',
    backgroundColor: '#F8F5F4',
  },
  activeFilterBadge: {
    backgroundColor: '#6F405F',
    borderColor: '#6F405F',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2D1D15',
  },
  activeFilterBadgeText: {
    color: '#FFFFFF',
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#2D1D15',
    marginTop: 10,
  },

  featuredCard: {
    width: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 6,
    elevation: 3,
    shadowColor: '#2D1D15',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  featuredCover: {
    width: '100%',
    height: 80,
    borderRadius: 8,
  },
  featuredPlayOverlay: {
    position: 'absolute',
    top: 30,
    left: 40,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(111, 64, 95, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlayText: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  featuredTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2D1D15',
    marginTop: 4,
  },
  featuredArtist: {
    fontSize: 8,
    color: '#8C8385',
  },

  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 12,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8DDD5',
    elevation: 3,
    shadowColor: '#2D1D15',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    gap: 12,
  },
  coverArt: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2D1D15',
  },
  trackArtist: {
    fontSize: 11,
    color: '#8C8385',
    fontWeight: '600',
  },
  genreBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6F405F',
    backgroundColor: 'rgba(111, 64, 95, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6F405F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6F405F',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  playButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
  },

  emptyView: {
    padding: 40,
    alignItems: 'center',
  },

  uploadButton: {
    backgroundColor: '#6F405F',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#6F405F',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  uploadButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  myTrackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8DDD5',
    padding: 12,
    marginHorizontal: 12,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#2D1D15',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    gap: 12,
  },
  statusPill: {
    fontSize: 9,
    fontWeight: '800',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  rejectionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D9534F',
    marginTop: 4,
  },
  opsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F2F0',
    paddingTop: 10,
  },
  opBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1DCDB',
    backgroundColor: '#FCFAF9',
  },
  opBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2D1D15',
  },

  // Modal styles for forms
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F2F0',
    paddingBottom: 10,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#6F405F',
  },
  formGroup: {
    gap: 4,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8C8385',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E1DCDB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
    color: '#2D1D15',
    fontWeight: '600',
  },
  badgePickerContainer: {
    backgroundColor: '#F8F5F4',
    padding: 4,
    borderRadius: 10,
  },
  pickerBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginRight: 4,
  },
  activePickerBadge: {
    backgroundColor: '#6F405F',
  },
  pickerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2D1D15',
  },
  activePickerBadgeText: {
    color: '#FFFFFF',
  },
  filePickerBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#6F405F',
    backgroundColor: '#FAF5F7',
    alignItems: 'center',
  },
  filePickerBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6F405F',
  },
  checkRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  checkText: {
    fontSize: 10,
    color: '#2D1D15',
    fontWeight: '600',
    flex: 1,
  },
  submitBtn: {
    backgroundColor: '#6F405F',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Web Spec listening mood selector styles
  moodBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  moodDialog: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    maxHeight: '80%',
    shadowColor: '#1A0C16',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  moodHeader: {
    marginBottom: 16,
    position: 'relative',
  },
  moodSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6F405F',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  moodTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2D1D15',
    marginTop: 4,
  },
  moodDesc: {
    fontSize: 11.5,
    color: '#8C8385',
    marginTop: 4,
  },
  moodCloseBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 4,
  },
  moodCard: {
    borderRadius: 16,
    marginBottom: 12,
    height: 76,
    overflow: 'hidden',
    position: 'relative',
  },

  // Listening mood top banner (Browse catalog)
  listeningMoodBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FAF5F7',
    elevation: 2,
    shadowColor: '#2D1D15',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  listeningMoodTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  listeningMoodSubtitle: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#8C8385',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  listeningMoodTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#2D1D15',
    marginTop: 2,
  },
  listeningMoodDesc: {
    fontSize: 10,
    color: '#8C8385',
    marginTop: 2,
  },
  changeMoodBtn: {
    backgroundColor: '#FAF5F7',
    borderWidth: 1,
    borderColor: '#6F405F',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  changeMoodBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6F405F',
  },
  fallbackBanner: {
    backgroundColor: '#FFF2CC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FFE599',
  },
  fallbackText: {
    fontSize: 11,
    color: '#7F6000',
    textAlign: 'center',
    fontWeight: '600',
  },

  // Modals for post commenting
  commentsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3ECEB',
  },
  commentsModalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2D1D15',
  },
  modalPostBrief: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF5F7',
  },

  // Create post modal top header style
  createPostModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F2F0',
    backgroundColor: '#FFFFFF',
  },
  createPostModalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6F405F',
  },
  closeBtn: {
    padding: 4,
  },

  // Report Modal styles
  reportOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  reportCard: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#2D1D15',
    textAlign: 'center',
  },
  reportLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8C8385',
  },
  reportOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1DCDB',
    backgroundColor: '#F8F5F4',
  },
  activeReportOption: {
    backgroundColor: '#6F405F',
    borderColor: '#6F405F',
  },
  reportOptionText: {
    fontSize: 12,
    color: '#2D1D15',
    fontWeight: '600',
  },
  activeReportOptionText: {
    color: '#FFFFFF',
  },
  reportInput: {
    borderWidth: 1,
    borderColor: '#E1DCDB',
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: '#2D1D15',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  reportBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // HIGH FIDELITY EXPLORE SCREEN STYLE COMMUNITY CARDS
  exploreCardContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0EAEE',
    shadowColor: '#1A0C16',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  topicBadgeContainer: {
    backgroundColor: 'rgba(111, 64, 95, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  topicBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#6F405F',
  },
  actionIconPill: {
    padding: 7,
    borderRadius: 10,
    backgroundColor: '#FAF9FA',
    borderWidth: 1,
    borderColor: '#EFEAE8',
  },
  activeBookmarkPill: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  cardTitleText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2D1D15',
    letterSpacing: -0.2,
    marginBottom: 6,
    lineHeight: 22,
  },
  cardContentText: {
    fontSize: 14,
    color: '#3D2A35',
    lineHeight: 21,
  },
  cardAttachedImage: {
    width: '100%',
    height: 170,
    borderRadius: 14,
    marginTop: 10,
    backgroundColor: '#FAF4F7',
  },
  cardFooterDivider: {
    borderTopWidth: 1,
    borderTopColor: '#F6F0F4',
    paddingTop: 12,
    marginTop: 12,
  },
  reactionBadgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAF9FA',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEAE8',
  },
  activeReactionBadgeButton: {
    backgroundColor: '#6F405F',
    borderColor: '#6F405F',
  },
  reactionBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#5C5254',
  },
  activeReactionBadgeText: {
    color: '#FFFFFF',
  },
  commentsTriggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FAF9FA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEAE8',
    marginLeft: 4,
  },
  commentsCountText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#5C5254',
  },
});
