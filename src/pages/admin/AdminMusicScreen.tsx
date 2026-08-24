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
import { apiMusicService } from '../../services/apiMusicService';
import { COLORS } from '../../styles/theme';
import { useMoodMusic } from '../../context/MoodMusicContext';
import { localStorage } from '../../services/localStorage';

const LANGUAGES = ['EN', 'HI', 'BN', 'MR', 'TE', 'TA', 'GU', 'UR', 'KN', 'OR', 'ML', 'PA', 'AS', 'SAT', 'KS', 'MNI', 'DOI', 'BHO'];
const MOODS = ['ROMANTIC', 'CALM', 'ENERGETIC', 'CONFUSED', 'MELANCHOLY', 'FOCUS'];
const STATUSES = ['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'DRAFT', 'UNPUBLISHED'];

export function AdminMusicScreen() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { playTrack, isPlaying, currentTrack } = useMoodMusic() as any;

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [moodFilter, setMoodFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Upload/Edit Form Modal state
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
  const [formAudio, setFormAudio] = useState<any>(null);
  const [formFeatured, setFormFeatured] = useState(false);
  const [formSortOrder, setFormSortOrder] = useState('0');
  const [submittingForm, setSubmittingForm] = useState(false);

  // Rejection Dialog state
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectTrackId, setRejectTrackId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAdminTracks = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setErrorText(null);
    try {
      const filters = {
        query: searchQuery.trim(),
        status: statusFilter,
        language: langFilter,
        mood: moodFilter,
        featured: featuredFilter,
        genre: genreFilter.trim(),
        page: 0,
        size: 40,
      };
      const res = await apiMusicService.getAdminTracks(filters);
      setTracks(res?.content || []);
    } catch (e: any) {
      console.warn('[AdminMusicScreen] Failed to load tracks:', e.message);
      setErrorText(e.message || 'Failed to load tracks');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAdminTracks(true);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAdminTracks();
  }, [searchQuery, statusFilter, langFilter, moodFilter, featuredFilter, genreFilter]);

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

  const handleSaveTrack = async () => {
    if (!formTitle.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
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
        formData.append('featured', formFeatured.toString());
        formData.append('sortOrder', formSortOrder);

        if (formCover) formData.append('cover', formCover);
        const finalAudio = formAudio || { uri: 'mock_uri', name: 'audio.mp3', type: 'audio/mpeg' };
        formData.append('audio', finalAudio);

        await apiMusicService.uploadTrack(formData);
        Alert.alert('Success', 'Track uploaded successfully.');
      } else {
        await apiMusicService.updateTrack(editingTrackId!, {
          title: formTitle.trim(),
          artistName: formArtist.trim(),
          language: formLanguage,
          mood: formMood,
          genre: formGenre.trim(),
          description: formDescription.trim(),
          featured: formFeatured,
          sortOrder: parseInt(formSortOrder, 10) || 0,
        });
        Alert.alert('Success', 'Track details updated.');
      }
      setModalVisible(false);
      fetchAdminTracks();
    } catch (e: any) {
      if (e.message && e.message.includes('413')) {
        Alert.alert('Upload Failed', 'The selected file is too large for the server. Please ensure the audio file is under 10MB and the cover image is under 2MB.');
      } else {
        Alert.alert('Error', e.message);
      }
    } finally {
      setSubmittingForm(false);
    }
  };

  // Admin approval / publish operations
  const handleApprove = async (id: string, title: string) => {
    Alert.alert('Approve Track', `Approve and publish "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try {
            await apiMusicService.approveTrack(id);
            fetchAdminTracks();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const handlePublish = async (id: string) => {
    try {
      await apiMusicService.publishTrack(id);
      fetchAdminTracks();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      await apiMusicService.unpublishTrack(id);
      fetchAdminTracks();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Rejection reason is required');
      return;
    }
    try {
      await apiMusicService.rejectTrack(rejectTrackId!, rejectReason.trim());
      setRejectModalVisible(false);
      fetchAdminTracks();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete Track', `Permanently delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiMusicService.deleteTrack(id);
            fetchAdminTracks();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const openUploadModal = () => {
    setModalMode('upload');
    setEditingTrackId(null);
    setFormTitle('');
    setFormArtist('');
    setFormLanguage('HI');
    setFormMood('CALM');
    setFormGenre('');
    setFormDescription('');
    setFormFeatured(false);
    setFormSortOrder('0');
    setFormCover(null);
    setFormAudio(null);
    setModalVisible(true);
  };

  const openEditModal = (track: any) => {
    setModalMode('edit');
    setEditingTrackId(track.id);
    setFormTitle(track.title);
    setFormArtist(track.artist || track.artistName || '');
    setFormLanguage(track.language || 'HI');
    setFormMood(track.mood || 'CALM');
    setFormGenre(track.genre || '');
    setFormDescription(track.description || '');
    setFormFeatured(track.featured || false);
    setFormSortOrder(String(track.sortOrder || 0));
    setFormCover(null);
    setFormAudio(null);
    setModalVisible(true);
  };

  const openRejectModal = (trackId: string) => {
    setRejectTrackId(trackId);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const defaultCover = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80';

  const getAuthorizedCoverUrl = (item: any) => {
    const rawUrl = item.coverUrl || item.privateCoverUrl || item.publicCoverUrl;
    if (!rawUrl) return defaultCover;
    if (rawUrl.startsWith('http') && !rawUrl.includes('/api/')) {
      return rawUrl;
    }
    const token = localStorage.getItem('auth_token');
    if (token && (rawUrl.includes('/api/admin/') || rawUrl.includes('/api/music/') || rawUrl.includes('/api/'))) {
      const separator = rawUrl.includes('?') ? '&' : '?';
      return `${rawUrl}${separator}token=${token}&access_token=${token}`;
    }
    return rawUrl;
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' };
      case 'APPROVED':
      case 'PUBLISHED':
        return { backgroundColor: '#D1FAE5', borderColor: '#10B981' };
      case 'REJECTED':
        return { backgroundColor: '#FEE2E2', borderColor: '#EF4444' };
      case 'DRAFT':
        return { backgroundColor: '#F3F4F6', borderColor: '#9CA3AF' };
      case 'UNPUBLISHED':
      default:
        return { backgroundColor: '#EDF2F7', borderColor: '#A0AEC0' };
    }
  };

  const getStatusBadgeTextStyle = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return { color: '#B45309' };
      case 'APPROVED':
      case 'PUBLISHED':
        return { color: '#065F46' };
      case 'REJECTED':
        return { color: '#991B1B' };
      case 'DRAFT':
        return { color: '#4B5563' };
      case 'UNPUBLISHED':
      default:
        return { color: '#4A5568' };
    }
  };

  // Dynamically calculated KPI counts
  const totalTracksCount = tracks.length;
  const pendingReviewCount = tracks.filter(t => t.status === 'PENDING_REVIEW').length;
  const approvedCount = tracks.filter(t => t.status === 'APPROVED' || t.status === 'PUBLISHED').length;

  return (
    <View style={styles.container}>
      {/* Page Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.headerTitle}>Music Management</Text>
            <Text style={styles.headerSubtitle}>Approve, upload, and organize music catalog</Text>
          </View>
          <TouchableOpacity onPress={openUploadModal} style={styles.uploadBtn}>
            <Text style={styles.uploadBtnText}>+ Upload Track</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* KPI Cards row */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconContainer, { backgroundColor: 'rgba(111, 64, 95, 0.1)' }]}>
            <MusicIcon color="#6F405F" size={16} />
          </View>
          <View style={styles.kpiTextContainer}>
            <Text style={styles.kpiValue}>{totalTracksCount}</Text>
            <Text style={styles.kpiLabel}>Total</Text>
          </View>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconContainer, { backgroundColor: 'rgba(217, 119, 6, 0.1)' }]}>
            <ClockIcon color="#D97706" size={16} />
          </View>
          <View style={styles.kpiTextContainer}>
            <Text style={styles.kpiValue}>{pendingReviewCount}</Text>
            <Text style={styles.kpiLabel}>Pending</Text>
          </View>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconContainer, { backgroundColor: 'rgba(41, 150, 90, 0.1)' }]}>
            <CheckIcon color="#29965A" size={16} />
          </View>
          <View style={styles.kpiTextContainer}>
            <Text style={styles.kpiValue}>{approvedCount}</Text>
            <Text style={styles.kpiLabel}>Published</Text>
          </View>
        </View>
      </View>

      {/* Filter and Search Section */}
      <View style={styles.filterSection}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              placeholder="Search title or artist..."
              placeholderTextColor="#8C8385"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
          </View>
          <TouchableOpacity 
            onPress={() => setShowFilters(!showFilters)} 
            style={[styles.filterToggleBtn, showFilters && styles.filterToggleBtnActive]}
          >
            <Text style={[styles.filterToggleBtnText, showFilters && styles.filterToggleBtnTextActive]}>
              {showFilters ? 'Hide ✕' : 'Filters ⚙️'}
            </Text>
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={styles.filtersDrawer}>
            {/* Status Filter */}
            <View style={styles.drawerFilterGroup}>
              <Text style={styles.drawerFilterLabel}>Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                <TouchableOpacity
                  onPress={() => setStatusFilter('')}
                  style={[styles.filterBadge, !statusFilter && styles.activeFilterBadge]}
                >
                  <Text style={[styles.filterBadgeText, !statusFilter && styles.activeFilterBadgeText]}>All</Text>
                </TouchableOpacity>
                {STATUSES.map((st) => (
                  <TouchableOpacity
                    key={st}
                    onPress={() => setStatusFilter(st)}
                    style={[styles.filterBadge, statusFilter === st && styles.activeFilterBadge]}
                  >
                    <Text style={[styles.filterBadgeText, statusFilter === st && styles.activeFilterBadgeText]}>
                      {st.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Language Filter */}
            <View style={styles.drawerFilterGroup}>
              <Text style={styles.drawerFilterLabel}>Language</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                <TouchableOpacity
                  onPress={() => setLangFilter('')}
                  style={[styles.filterBadge, !langFilter && styles.activeFilterBadge]}
                >
                  <Text style={[styles.filterBadgeText, !langFilter && styles.activeFilterBadgeText]}>All</Text>
                </TouchableOpacity>
                {LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    onPress={() => setLangFilter(lang)}
                    style={[styles.filterBadge, langFilter === lang && styles.activeFilterBadge]}
                  >
                    <Text style={[styles.filterBadgeText, langFilter === lang && styles.activeFilterBadgeText]}>
                      {lang}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Mood Filter */}
            <View style={styles.drawerFilterGroup}>
              <Text style={styles.drawerFilterLabel}>Mood</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                <TouchableOpacity
                  onPress={() => setMoodFilter('')}
                  style={[styles.filterBadge, !moodFilter && styles.activeFilterBadge]}
                >
                  <Text style={[styles.filterBadgeText, !moodFilter && styles.activeFilterBadgeText]}>All</Text>
                </TouchableOpacity>
                {MOODS.map((mood) => (
                  <TouchableOpacity
                    key={mood}
                    onPress={() => setMoodFilter(mood)}
                    style={[styles.filterBadge, moodFilter === mood && styles.activeFilterBadge]}
                  >
                    <Text style={[styles.filterBadgeText, moodFilter === mood && styles.activeFilterBadgeText]}>
                      {mood}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              {/* Featured Filter */}
              <View style={[styles.drawerFilterGroup, { flex: 1 }]}>
                <Text style={styles.drawerFilterLabel}>Featured</Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {['', 'true', 'false'].map((val) => (
                    <TouchableOpacity
                      key={val}
                      onPress={() => setFeaturedFilter(val)}
                      style={[styles.filterBadge, { flex: 1, alignItems: 'center' }, featuredFilter === val && styles.activeFilterBadge]}
                    >
                      <Text style={[styles.filterBadgeText, featuredFilter === val && styles.activeFilterBadgeText]}>
                        {val === '' ? 'All' : val === 'true' ? 'Yes' : 'No'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Genre Filter */}
              <View style={[styles.drawerFilterGroup, { flex: 1.5 }]}>
                <Text style={styles.drawerFilterLabel}>Genre</Text>
                <TextInput
                  placeholder="e.g. Flute, Traditional"
                  placeholderTextColor="#8C8385"
                  value={genreFilter}
                  onChangeText={setGenreFilter}
                  style={styles.drawerGenreInput}
                />
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Tracks listing */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.deepPlum} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.deepPlum]} />
          }
          renderItem={({ item }) => {
            const isCommunity = item.source === 'COMMUNITY';
            const isPending = item.status === 'PENDING_REVIEW';
            const isPublished = item.status === 'PUBLISHED';
            const isCurrentPlaying = isPlaying && currentTrack?.id === item.id;

            return (
              <View style={styles.trackCard}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={styles.coverArtContainer}>
                    <Image source={{ uri: getAuthorizedCoverUrl(item) }} style={styles.coverArt} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
                      <Text style={styles.trackTitle} numberOfLines={1}>{item.title}</Text>
                      <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
                        <Text style={[styles.statusBadgeText, getStatusBadgeTextStyle(item.status)]}>
                          {item.status.replace('_', ' ')}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.trackArtist}>{item.artist || 'Platform'}</Text>
                    <Text style={styles.uploaderText}>
                      By: {item.uploader?.displayName || 'System Admin'} • {isCommunity ? 'Community' : 'Platform'}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, alignItems: 'center' }}>
                      <Text style={styles.metaBadge}>{item.language || 'EN'}</Text>
                      <Text style={styles.metaBadge}>{item.mood || 'CALM'}</Text>
                      {item.featured ? (
                        <Text style={[styles.metaBadge, { backgroundColor: '#E2F0D9', color: '#385723' }]}>★ Featured</Text>
                      ) : null}
                    </View>
                  </View>
                </View>

                {/* Operations */}
                <View style={styles.opsRow}>
                  {/* Audio Preview Trigger */}
                  <TouchableOpacity 
                    onPress={() => {
                      const mappedItem = {
                        ...item,
                        audioUrl: item.audioUrl || item.privateAudioUrl || item.publicAudioUrl,
                        coverUrl: item.coverUrl || item.privateCoverUrl || item.publicCoverUrl || defaultCover
                      };
                      const mappedTracks = tracks.map(t => ({
                        ...t,
                        audioUrl: t.audioUrl || t.privateAudioUrl || t.publicAudioUrl,
                        coverUrl: t.coverUrl || t.privateCoverUrl || t.publicCoverUrl || defaultCover
                      }));
                      playTrack(mappedItem, mappedTracks);
                    }}
                    style={[styles.opBtn, isCurrentPlaying && { backgroundColor: '#6F405F', borderColor: '#6F405F' }]}
                  >
                    <Text style={[styles.opBtnText, isCurrentPlaying && { color: '#FFFFFF' }]}>
                      {isCurrentPlaying ? '⏸ Playing' : '▶ Preview'}
                    </Text>
                  </TouchableOpacity>

                  {isCommunity && isPending ? (
                    <>
                      <TouchableOpacity 
                        onPress={() => handleApprove(item.id, item.title)} 
                        style={[styles.opBtn, styles.opBtnApprove]}
                      >
                        <Text style={styles.opBtnApproveText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => openRejectModal(item.id)} 
                        style={[styles.opBtn, styles.opBtnReject]}
                      >
                        <Text style={styles.opBtnRejectText}>Reject</Text>
                      </TouchableOpacity>
                    </>
                  ) : null}

                  {!isCommunity && ['DRAFT', 'UNPUBLISHED'].includes(item.status) ? (
                    <TouchableOpacity 
                      onPress={() => handlePublish(item.id)} 
                      style={[styles.opBtn, styles.opBtnPublish]}
                    >
                      <Text style={styles.opBtnPublishText}>Publish</Text>
                    </TouchableOpacity>
                  ) : null}

                  {isPublished ? (
                    <TouchableOpacity onPress={() => handleUnpublish(item.id)} style={styles.opBtn}>
                      <Text style={styles.opBtnText}>Unpublish</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity onPress={() => openEditModal(item)} style={styles.opBtn}>
                    <Text style={styles.opBtnText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => handleDelete(item.id, item.title)} 
                    style={[styles.opBtn, styles.opBtnDelete]}
                  >
                    <Text style={styles.opBtnDeleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <Text style={{ color: '#8C8385', fontWeight: '500', textAlign: 'center', paddingHorizontal: 20 }}>
                {errorText ? `Error: ${errorText}` : 'No tracks found.'}
              </Text>
            </View>
          }
        />
      )}

      {/* UPLOAD/EDIT MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalMode === 'upload' ? 'Upload New Track' : 'Edit Track Details'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

             <ScrollView contentContainerStyle={{ gap: 14, paddingTop: 10, paddingBottom: 30 }}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Track Title *</Text>
                <TextInput
                  value={formTitle}
                  onChangeText={setFormTitle}
                  placeholder="Track Title"
                  placeholderTextColor="#9C9592"
                  style={styles.formInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Artist Name</Text>
                <TextInput
                  value={formArtist}
                  onChangeText={setFormArtist}
                  placeholder="Artist name"
                  placeholderTextColor="#9C9592"
                  style={styles.formInput}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
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
                  placeholder="e.g. Traditional, Flute"
                  placeholderTextColor="#9C9592"
                  style={styles.formInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  value={formDescription}
                  onChangeText={setFormDescription}
                  placeholder="Description of track"
                  placeholderTextColor="#9C9592"
                  multiline
                  numberOfLines={2}
                  style={[styles.formInput, { height: 60, textAlignVertical: 'top' }]}
                />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 6 }}>
                <TouchableOpacity onPress={() => setFormFeatured(!formFeatured)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: '#6F405F',
                    backgroundColor: formFeatured ? '#6F405F' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {formFeatured && (
                      <View style={{
                        width: 10,
                        height: 6,
                        borderLeftWidth: 2,
                        borderBottomWidth: 2,
                        borderColor: '#FFFFFF',
                        transform: [{ rotate: '-45deg' }],
                        marginTop: -2,
                      }} />
                    )}
                  </View>
                  <Text style={[styles.formLabel, { fontSize: 11, color: '#2D1D15' }]}>Featured Track</Text>
                </TouchableOpacity>
              </View>

              {modalMode === 'upload' ? (
                <View style={{ flexDirection: 'row', gap: 12, marginVertical: 4 }}>
                  <TouchableOpacity 
                    onPress={handleSelectCover} 
                    style={[
                      styles.filePickerBtn, 
                      formCover && { backgroundColor: '#E2F0D9', borderColor: '#385723' }
                    ]}
                  >
                    <Text style={[
                      styles.filePickerBtnText, 
                      formCover && { color: '#385723' }
                    ]}>
                      {formCover ? '✓ Cover Attached' : '🖼 Pick Cover'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleSelectAudio} 
                    style={[
                      styles.filePickerBtn, 
                      formAudio && { backgroundColor: '#E2F0D9', borderColor: '#385723' }
                    ]}
                  >
                    <Text style={[
                      styles.filePickerBtnText, 
                      formAudio && { color: '#385723' }
                    ]}>
                      {formAudio ? '✓ Audio Attached' : '🎵 Add Audio'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {submittingForm ? (
                <ActivityIndicator size="small" color={COLORS.deepPlum} style={{ marginTop: 10 }} />
              ) : (
                <TouchableOpacity onPress={handleSaveTrack} style={styles.submitBtn}>
                  <Text style={styles.submitBtnText}>Save Track</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* REJECTION REASON MODAL */}
      <Modal visible={rejectModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.rejectContent}>
            <Text style={styles.rejectTitle}>Reject Track Approval</Text>
            <Text style={styles.formLabel}>Provide a reason for rejection *</Text>
            <TextInput
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="e.g. Copyright issue, low audio quality"
              placeholderTextColor="#9C9592"
              multiline
              numberOfLines={3}
              style={[styles.formInput, { height: 70, marginVertical: 10, textAlignVertical: 'top' }]}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)} style={styles.opBtn}>
                <Text style={styles.opBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRejectSubmit} style={[styles.opBtn, { backgroundColor: '#C00000', borderColor: '#C00000' }]}>
                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>Confirm Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Inline drawing custom icons using standard views
const MusicIcon = ({ color = '#6F405F', size = 18 }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: size * 0.7 }}>
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: size * 0.4, height: size * 0.3, borderRadius: size * 0.15, backgroundColor: color }} />
        <View style={{ width: 2.2, height: size * 0.6, backgroundColor: color }} />
      </View>
      <View style={{ width: size * 0.45, height: 2.2, backgroundColor: color, alignSelf: 'flex-start', transform: [{ rotate: '-15deg' }], marginLeft: -2.2 }} />
    </View>
  </View>
);

const ClockIcon = ({ color = '#D97706', size = 18 }) => (
  <View style={{ width: size, height: size, borderWidth: 2, borderColor: color, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: 2, height: size * 0.3, backgroundColor: color, position: 'absolute', top: size * 0.15 }} />
    <View style={{ width: size * 0.25, height: 2, backgroundColor: color, position: 'absolute', right: size * 0.18 }} />
  </View>
);

const CheckIcon = ({ color = '#29965A', size = 18 }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size * 0.5, height: size * 0.25, borderWidth: 2, borderColor: color, borderTopWidth: 0, borderRightWidth: 0, transform: [{ rotate: '-45deg' }], marginTop: -2 }} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5F3',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E8DDD5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#6F405F',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#766D68',
    fontWeight: '600',
    marginTop: 2,
  },
  uploadBtn: {
    backgroundColor: '#6F405F',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // KPI Row and Card styles
  kpiRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 8,
    justifyContent: 'space-between',
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DDD5',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  kpiIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  kpiTextContainer: {
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#17151A',
    lineHeight: 18,
  },
  kpiLabel: {
    fontSize: 9.5,
    color: '#766D68',
    fontWeight: '800',
    marginTop: 1,
    textAlign: 'center',
  },

  // Search & Filter controls
  filterSection: {
    padding: 12,
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#E8DDD5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#17151A',
    fontWeight: '600',
    paddingVertical: 0,
  },
  statusFiltersContainer: {
    height: 30,
  },
  filterBadge: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8DDD5',
    backgroundColor: '#FFF8F2',
  },
  activeFilterBadge: {
    backgroundColor: '#6F405F',
    borderColor: '#6F405F',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#766D68',
  },
  activeFilterBadgeText: {
    color: '#FFFFFF',
  },

  // Track card styles
  trackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8DDD5',
    padding: 14,
    marginBottom: 10,
    shadowColor: '#2D1D15',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  coverArtContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8DDD5',
    backgroundColor: '#FFF8F2',
  },
  coverArt: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
    color: '#17151A',
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  trackArtist: {
    fontSize: 11.5,
    color: '#766D68',
    fontWeight: '600',
    marginTop: 2,
  },
  uploaderText: {
    fontSize: 9.5,
    color: '#9F9794',
    fontWeight: '500',
    marginTop: 2,
  },
  metaBadge: {
    fontSize: 9,
    fontWeight: '800',
    backgroundColor: '#FFF8F2',
    color: '#6F405F',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#E8DDD5',
  },

  // Button operations
  opsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F8F5F3',
    paddingTop: 8,
    marginTop: 8,
  },
  opBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8DDD5',
    backgroundColor: '#FFFDFC',
  },
  opBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#332821',
  },
  opBtnApprove: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  opBtnApproveText: {
    color: '#065F46',
    fontSize: 10.5,
    fontWeight: '800',
  },
  opBtnReject: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  opBtnRejectText: {
    color: '#991B1B',
    fontSize: 10.5,
    fontWeight: '800',
  },
  opBtnPublish: {
    backgroundColor: '#6F405F',
    borderColor: '#6F405F',
  },
  opBtnPublishText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  opBtnDelete: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFFDFC',
  },
  opBtnDeleteText: {
    color: '#EF4444',
    fontSize: 10.5,
    fontWeight: '700',
  },

  emptyView: {
    padding: 40,
    alignItems: 'center',
  },

  // Modals layout
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 21, 26, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
    shadowColor: '#17151A',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F8F5F3',
    paddingBottom: 12,
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#6F405F',
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF8F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#766D68',
  },
  formGroup: {
    gap: 6,
    marginBottom: 4,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#766D68',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E8DDD5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: '#17151A',
    fontWeight: '600',
    backgroundColor: '#FFFDFC',
  },
  badgePickerContainer: {
    backgroundColor: '#FFF8F2',
    padding: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8DDD5',
  },
  pickerBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 4,
  },
  activePickerBadge: {
    backgroundColor: '#6F405F',
  },
  pickerBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#766D68',
  },
  activePickerBadgeText: {
    color: '#FFFFFF',
  },
  filePickerBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#6F405F',
    backgroundColor: '#FFF8F2',
    alignItems: 'center',
  },
  filePickerBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6F405F',
  },
  submitBtn: {
    backgroundColor: '#6F405F',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  rejectContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '90%',
    alignSelf: 'center',
    marginTop: '40%',
    elevation: 20,
    shadowColor: '#17151A',
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  rejectTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#C00000',
    marginBottom: 8,
  },
  filterToggleBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8DDD5',
    backgroundColor: '#FFFDFC',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  filterToggleBtnActive: {
    backgroundColor: '#6F405F',
    borderColor: '#6F405F',
  },
  filterToggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#766D68',
  },
  filterToggleBtnTextActive: {
    color: '#FFFFFF',
  },
  filtersDrawer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8DDD5',
    padding: 12,
    marginTop: 8,
    gap: 12,
  },
  drawerFilterGroup: {
    gap: 6,
  },
  drawerFilterLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#766D68',
    textTransform: 'uppercase',
  },
  drawerGenreInput: {
    borderWidth: 1,
    borderColor: '#E8DDD5',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    color: '#17151A',
    fontWeight: '600',
    backgroundColor: '#FFFDFC',
    height: 32,
  },
});
