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
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import { apiMusicService } from '../../services/apiMusicService';
import { COLORS } from '../../styles/theme';

const LANGUAGES = ['EN', 'HI', 'BN', 'MR', 'TE', 'TA', 'GU', 'UR', 'KN', 'OR', 'ML', 'PA', 'AS', 'SAT', 'KS', 'MNI', 'DOI', 'BHO'];
const MOODS = ['ROMANTIC', 'CALM', 'ENERGETIC', 'CONFUSED', 'MELANCHOLY', 'FOCUS'];
const STATUSES = ['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'DRAFT', 'UNPUBLISHED'];

export function AdminMusicScreen() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [moodFilter, setMoodFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');

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

  const fetchAdminTracks = async () => {
    setLoading(true);
    try {
      const filters = {
        query: searchQuery.trim(),
        status: statusFilter,
        language: langFilter,
        mood: moodFilter,
        featured: featuredFilter,
        page: 0,
        size: 40,
      };
      const res = await apiMusicService.getAdminTracks(filters);
      setTracks(res?.content || []);
    } catch (e: any) {
      console.warn('[AdminMusicScreen] Failed to load tracks:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminTracks();
  }, [searchQuery, statusFilter, langFilter, moodFilter, featuredFilter]);

  // Image Picker for Cover Art
  const handleSelectCover = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (res) => {
      if (res.didCancel) return;
      if (res.assets && res.assets[0]) {
        const file = res.assets[0];
        setFormCover({
          uri: file.uri,
          name: file.fileName || 'cover.jpg',
          type: file.type || 'image/jpeg',
        });
      }
    });
  };

  // Use DocumentPicker to select real audio file
  const handleSelectAudio = async () => {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.audio],
      });
      setFormAudio({
        uri: res.uri,
        name: res.name || 'track.mp3',
        type: res.type || 'audio/mpeg',
      });
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
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
      Alert.alert('Error', e.message);
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

  const defaultCover = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80';

  return (
    <View style={styles.container}>
      {/* KPI Cards header */}
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

        {/* Toolbar filter row */}
        <TextInput
          placeholder="🔍 Search title or artist..."
          placeholderTextColor="#8C8385"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {/* Status pills selector */}
            <TouchableOpacity
              onPress={() => setStatusFilter('')}
              style={[styles.filterBadge, !statusFilter && styles.activeFilterBadge]}
            >
              <Text style={[styles.filterBadgeText, !statusFilter && styles.activeFilterBadgeText]}>All Status</Text>
            </TouchableOpacity>
            {STATUSES.map((st) => (
              <TouchableOpacity
                key={st}
                onPress={() => setStatusFilter(st)}
                style={[styles.filterBadge, statusFilter === st && styles.activeFilterBadge]}
              >
                <Text style={[styles.filterBadgeText, statusFilter === st && styles.activeFilterBadgeText]}>{st}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Tracks listing */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.deepPlum} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => {
            const isCommunity = item.source === 'COMMUNITY';
            const isPending = item.status === 'PENDING_REVIEW';
            const isPublished = item.status === 'PUBLISHED';

            return (
              <View style={styles.trackCard}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Image source={{ uri: item.coverUrl || defaultCover }} style={styles.coverArt} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trackTitle}>{item.title}</Text>
                    <Text style={styles.trackArtist}>{item.artist || 'Platform'}</Text>
                    <Text style={styles.uploaderText}>
                      By: {item.uploader?.displayName || 'System Admin'} ({isCommunity ? 'Community' : 'Platform'})
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, alignItems: 'center' }}>
                      <Text style={styles.metaBadge}>{item.language || 'EN'}</Text>
                      <Text style={styles.metaBadge}>{item.mood || 'CALM'}</Text>
                      {item.featured ? <Text style={[styles.metaBadge, { backgroundColor: '#E2F0D9', color: '#385723' }]}>★ Featured</Text> : null}
                    </View>
                  </View>
                </View>

                {/* Operations */}
                <View style={styles.opsRow}>
                  {isCommunity && isPending ? (
                    <>
                      <TouchableOpacity onPress={() => handleApprove(item.id, item.title)} style={[styles.opBtn, { backgroundColor: '#385723' }]}>
                        <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => openRejectModal(item.id)} style={[styles.opBtn, { backgroundColor: '#C00000' }]}>
                        <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>Reject</Text>
                      </TouchableOpacity>
                    </>
                  ) : null}

                  {!isCommunity && ['DRAFT', 'UNPUBLISHED'].includes(item.status) ? (
                    <TouchableOpacity onPress={() => handlePublish(item.id)} style={[styles.opBtn, { backgroundColor: '#6F405F' }]}>
                      <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>Publish</Text>
                    </TouchableOpacity>
                  ) : null}

                  {isPublished ? (
                    <TouchableOpacity onPress={() => handleUnpublish(item.id)} style={styles.opBtn}>
                      <Text style={styles.opBtnText}>Unpublish</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity onPress={() => openEditModal(item)} style={styles.opBtn}>
                    <Text style={styles.opBtnText}>✏️ Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => handleDelete(item.id, item.title)} style={styles.opBtn}>
                    <Text style={[styles.opBtnText, { color: '#D9534F' }]}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <Text style={{ color: '#8C8385' }}>No tracks found.</Text>
            </View>
          }
        />
      )}

      {/* UPLOAD/EDIT MODAL */}
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
                  placeholder="e.g. Traditional, Flute"
                  style={styles.formInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  value={formDescription}
                  onChangeText={setFormDescription}
                  placeholder="Description of track"
                  multiline
                  numberOfLines={2}
                  style={[styles.formInput, { height: 50, textAlignVertical: 'top' }]}
                />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 }}>
                <TouchableOpacity onPress={() => setFormFeatured(!formFeatured)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 16 }}>{formFeatured ? '☑️' : '⬛'}</Text>
                  <Text style={styles.formLabel}>Featured Track</Text>
                </TouchableOpacity>
              </View>

              {modalMode === 'upload' ? (
                <View style={{ flexDirection: 'row', gap: 10, marginVertical: 4 }}>
                  <TouchableOpacity onPress={handleSelectCover} style={styles.filePickerBtn}>
                    <Text style={styles.filePickerBtnText}>
                      {formCover ? '🖼️ Cover Attached' : '🖼️ Pick Cover'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSelectAudio} style={styles.filePickerBtn}>
                    <Text style={styles.filePickerBtnText}>
                      {formAudio ? '🎵 Audio Attached' : '🎵 Add Audio'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {submittingForm ? (
                <ActivityIndicator size="small" color={COLORS.deepPlum} />
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
              multiline
              numberOfLines={3}
              style={[styles.formInput, { height: 60, marginVertical: 10, textAlignVertical: 'top' }]}
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
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#6F405F',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#8C8385',
    fontWeight: '600',
  },
  uploadBtn: {
    backgroundColor: '#6F405F',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  searchInput: {
    backgroundColor: '#F8F5F4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
    color: '#2D1D15',
    fontWeight: '600',
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

  trackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#2D1D15',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    gap: 10,
  },
  coverArt: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  trackTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#2D1D15',
  },
  trackArtist: {
    fontSize: 11,
    color: '#8C8385',
    fontWeight: '600',
  },
  uploaderText: {
    fontSize: 9.5,
    color: '#8C8385',
    fontWeight: '500',
    marginTop: 2,
  },
  metaBadge: {
    fontSize: 8,
    fontWeight: '800',
    backgroundColor: '#FAF5F7',
    color: '#6F405F',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },

  opsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F5F2F0',
    paddingTop: 8,
    marginTop: 4,
  },
  opBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E1DCDB',
    backgroundColor: '#FCFAF9',
  },
  opBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2D1D15',
  },

  emptyView: {
    padding: 40,
    alignItems: 'center',
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

  rejectContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '85%',
    alignSelf: 'center',
    marginTop: '50%',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  rejectTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#C00000',
    marginBottom: 6,
  },
});
