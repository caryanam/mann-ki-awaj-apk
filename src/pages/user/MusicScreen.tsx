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
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { pick, types, errorCodes, isErrorWithCode } from '@react-native-documents/picker';
import { useLanguage } from '../../context/LanguageContext';
import { useMoodMusic } from '../../context/MoodMusicContext';
import { apiMusicService } from '../../services/apiMusicService';
import { COLORS } from '../../styles/theme';
import { localStorage } from '../../services/localStorage';

const LANGUAGES = ['EN', 'HI', 'BN', 'MR', 'TE', 'TA', 'GU', 'UR', 'KN', 'OR', 'ML', 'PA', 'AS', 'SAT', 'KS', 'MNI', 'DOI', 'BHO'];
const MOODS = ['ROMANTIC', 'CALM', 'ENERGETIC', 'CONFUSED', 'MELANCHOLY', 'FOCUS'];
const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PUBLISHED: 'Published',
};

export function MusicScreen() {
  const { t } = useLanguage() as any;
  const music = useMoodMusic() as any;

  // View state: 'browse' or 'mine'
  const [viewTab, setViewTab] = useState<'browse' | 'mine'>('browse');

  // Browse Tab filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [genreQuery, setGenreQuery] = useState('');
  const [publicTracks, setPublicTracks] = useState<any[]>([]);
  const [featuredTracks, setFeaturedTracks] = useState<any[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(false);

  const [myTracks, setMyTracks] = useState<any[]>([]);
  const [loadingMyTracks, setLoadingMyTracks] = useState(false);
  const [myStatusFilter, setMyStatusFilter] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Upload/Edit Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'upload' | 'edit'>('upload');
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formArtist, setFormArtist] = useState('');
  const [formLanguage, setFormLanguage] = useState('HI');
  const [formMood, setFormMood] = useState('CALM');
  const [formGenre, setFormGenre] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCover, setFormCover] = useState<any>(null);
  const [formAudio, setFormAudio] = useState<any>(null); // Mock/Recorded audio
  const [formOriginalWork, setFormOriginalWork] = useState(false);
  const [formRightsConfirmed, setFormRightsConfirmed] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);

  // Fetch Public Music
  const fetchPublicMusic = async (isSilent = false) => {
    if (!isSilent) setLoadingPublic(true);
    setErrorText(null);
    try {
      const filters = {
        query: searchQuery.trim(),
        language: selectedLanguage,
        mood: selectedMood,
        genre: genreQuery.trim(),
        page: 0,
        size: 30,
      };
      const res = await apiMusicService.getPublicTracks(filters);
      setPublicTracks(res?.content || []);

      // Load Featured
      const featRes = await apiMusicService.getPublicTracks({ featured: true, page: 0, size: 8 });
      setFeaturedTracks(featRes?.content || []);
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
    if (viewTab === 'browse') {
      await fetchPublicMusic(true);
    } else {
      await fetchMyMusic(true);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    if (viewTab === 'browse') {
      fetchPublicMusic();
    } else {
      fetchMyMusic();
    }
  }, [viewTab, searchQuery, selectedLanguage, selectedMood, genreQuery, myStatusFilter]);

  // Image Picker for Cover Art
  const handleSelectCover = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (res) => {
      if (res.didCancel) return;
      if (res.assets && res.assets[0]) {
        const file = res.assets[0];
        // Validate file size (max 2MB)
        if (file.fileSize && file.fileSize > 2 * 1024 * 1024) {
          Alert.alert('Image Too Large', 'Please select a cover image under 2MB.');
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

  // Use DocumentPicker to select real audio file
  const handleSelectAudio = async () => {
    try {
      const [res] = await pick({
        type: [types.audio],
        allowMultiSelection: false,
      });
      if (res) {
        // Validate file size (max 10MB)
        if (res.size && res.size > 10 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please select an audio file under 10MB.');
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

  // Handle Upload or Edit Save
  const handleSaveTrack = async () => {
    if (!formTitle.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    if (modalMode === 'upload') {
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
        formData.append('mood', formMood);
        formData.append('genre', formGenre.trim());
        formData.append('description', formDescription.trim());
        formData.append('originalWorkConfirmed', formOriginalWork.toString());
        formData.append('rightsConfirmed', formRightsConfirmed.toString());

        if (formCover) {
          formData.append('cover', formCover);
        }

        // Use simulated audio if none provided
        const finalAudio = formAudio || {
          uri: 'mock_uri',
          name: 'track.mp3',
          type: 'audio/mpeg',
        };
        formData.append('audio', finalAudio);

        await apiMusicService.uploadMyTrack(formData);
        Alert.alert('Success', 'Track uploaded successfully for review.');
      } else {
        // Edit mode
        await apiMusicService.updateMyTrack(editingTrackId!, {
          title: formTitle.trim(),
          artistName: formArtist.trim(),
          language: formLanguage,
          mood: formMood,
          genre: formGenre.trim(),
          description: formDescription.trim(),
        });
        Alert.alert('Success', 'Track details updated.');
      }
      setModalVisible(false);
      fetchMyMusic();
    } catch (e: any) {
      if (e.message && e.message.includes('413')) {
        Alert.alert('Upload Failed', 'The selected file is too large for the server. Please ensure the audio file is under 10MB and the cover image is under 2MB.');
      } else {
        Alert.alert('Request Failed', e.message || 'Error processing track');
      }
    } finally {
      setSubmittingForm(false);
    }
  };

  // Handle Delete
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
    setFormMood(track.mood || 'CALM');
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
    setFormMood('CALM');
    setFormGenre('');
    setFormDescription('');
    setFormCover(null);
    setFormAudio(null);
    setFormOriginalWork(false);
    setFormRightsConfirmed(false);
    setModalVisible(true);
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

  return (
    <View style={styles.container}>
      {/* Header Tabs */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Music Hub</Text>
          <Text style={styles.headerSubtitle}>Discover and share original audio</Text>
        </View>
        <View style={styles.tabRow}>
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

      {/* BROWSE TAB CONTENT */}
      {viewTab === 'browse' ? (
        <FlatList
          data={publicTracks}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.deepPlum]} />
          }
          ListHeaderComponent={
            <View style={{ gap: 16, padding: 12 }}>
              {/* Filters Toolbar */}
              <View style={styles.filterCard}>
                <TextInput
                  placeholder="🔍 Search title or artist..."
                  placeholderTextColor="#8C8385"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchInput}
                />

                {/* Language Picker buttons */}
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

                {/* Mood Picker buttons */}
                <Text style={styles.filterLabel}>Mood</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  <TouchableOpacity
                    onPress={() => setSelectedMood('')}
                    style={[styles.filterBadge, !selectedMood && styles.activeFilterBadge]}
                  >
                    <Text style={[styles.filterBadgeText, !selectedMood && styles.activeFilterBadgeText]}>All</Text>
                  </TouchableOpacity>
                  {MOODS.map((mood) => (
                    <TouchableOpacity
                      key={mood}
                      onPress={() => setSelectedMood(mood)}
                      style={[styles.filterBadge, selectedMood === mood && styles.activeFilterBadge]}
                    >
                      <Text style={[styles.filterBadgeText, selectedMood === mood && styles.activeFilterBadgeText]}>{mood}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Featured Section */}
              {featuredTracks.length > 0 ? (
                <View>
                  <Text style={styles.sectionTitle}>Featured Tracks</Text>
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

              <Text style={styles.sectionTitle}>All Tracks</Text>
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
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                    {item.language ? <Text style={styles.genreBadge}>{item.language}</Text> : null}
                    {item.mood ? <Text style={styles.genreBadge}>{item.mood}</Text> : null}
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
                  {errorText ? `Error: ${errorText}` : 'No tracks found.'}
                </Text>
              </View>
            ) : null
          }
        />
      ) : (
        /* MY UPLOADS TAB CONTENT */
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
                <Text style={styles.formLabel}>Artist Name</Text>
                <TextInput
                  value={formArtist}
                  onChangeText={setFormArtist}
                  placeholder="Artist name"
                  style={styles.formInput}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Language</Text>
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

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Mood</Text>
                  <View style={styles.badgePickerContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {MOODS.map((mood) => (
                        <TouchableOpacity
                          key={mood}
                          onPress={() => setFormMood(mood)}
                          style={[styles.pickerBadge, formMood === mood && styles.activePickerBadge]}
                        >
                          <Text style={[styles.pickerBadgeText, formMood === mood && styles.activePickerBadgeText]}>{mood}</Text>
                        </TouchableOpacity>
                      ))}
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
                        {formAudio ? '🎵 Audio Attached' : '🎵 Select Audio'}
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
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1DCDB',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#6F405F',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#8C8385',
    fontWeight: '600',
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
});
